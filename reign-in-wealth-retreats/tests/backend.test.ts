import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Stripe from "stripe";
import { randomUUID } from "node:crypto";

const temporary = mkdtempSync(join(tmpdir(), "riw-backend-"));
Object.assign(process.env, {
  NODE_ENV: "test",
  RESEND_API_KEY: "",
  EMAIL_FROM: "",
});
process.env.DATABASE_PATH = join(temporary, "test.sqlite");
process.env.APP_URL = "http://localhost:3000";
process.env.DEV_PREVIEW_MODE = "false";
process.env.ADMIN_EMAIL = "owner@example.com";
process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";

import { db, closeDb } from "../src/lib/server/db";
import { getRetreats, getSettings } from "../src/lib/server/data";
import { handle } from "../src/lib/server/api";
import { passwordHash, csvCell } from "../src/lib/server/security";
import {
  paymentSchedule,
  quote,
  recordVerifiedPayment,
  recordVerifiedRefund,
  listBookings,
  reservesSeat,
} from "../src/lib/server/payments";
process.env.ADMIN_PASSWORD_HASH = passwordHash("Local-testing-password!");
const request = (
  path: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
) =>
  new Request("http://localhost:3000/api/" + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      Origin: "http://localhost:3000",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
let adminCookie = "";
before(() => {
  db();
});
after(() => {
  closeDb();
  rmSync(temporary, { recursive: true, force: true });
});

test("unconfirmed retreat cannot be sold and unpublished content is hidden", () => {
  const retreats = getRetreats();
  assert.ok(retreats.length >= 4);
  assert.equal(
    quote({
      retreatSlug: retreats[0].slug,
      occupancy: "double",
      paymentChoice: "full",
    }).canBook,
    false,
  );
  assert.equal(getSettings().policiesApproved, false);
});
test("installments preserve every minor unit and full payment is due within 30 days", () => {
  const schedule = paymentSchedule(
    100001,
    25000,
    4,
    "installments",
    "2028-12-01",
    new Date("2027-01-01"),
  );
  assert.equal(
    schedule.reduce((total, p) => total + p.amount, 0),
    100001,
  );
  assert.equal(schedule.length, 4);
  assert.equal(schedule[0].amount, 25000);
  assert.equal(schedule.at(-1)?.dueDate, "2028-11-01");
  const late = paymentSchedule(
    100001,
    25000,
    4,
    "deposit",
    "2027-01-15",
    new Date("2027-01-01"),
  );
  assert.equal(late.length, 1);
  assert.equal(late[0].amount, 100001);
});
test("admin routes reject unauthenticated users and accept secure session", async () => {
  assert.equal(
    (await handle(request("admin/bookings"), ["admin", "bookings"])).status,
    401,
  );
  const login = await handle(
    request("admin/login", "POST", {
      email: "owner@example.com",
      password: "Local-testing-password!",
    }),
    ["admin", "login"],
  );
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie")!;
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  adminCookie = cookie.split(";")[0];
  assert.equal(
    (
      await handle(request("admin/bookings", "GET", undefined, adminCookie), [
        "admin",
        "bookings",
      ])
    ).status,
    200,
  );
});
test("cross-origin writes are rejected before mutation", async () => {
  const req = new Request("http://localhost:3000/api/leads", {
    method: "POST",
    headers: {
      Origin: "https://evil.example",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: "test@example.com", consent: true }),
  });
  assert.equal((await handle(req, ["leads"])).status, 403);
});
test("waitlist captures a persistent destination lead and deduplicates", async () => {
  const body = {
    email: "traveler@example.com",
    name: "Traveler",
    destination: "ghana-2027",
    source: "waitlist",
    consent: true,
  };
  assert.equal(
    (await handle(request("leads", "POST", body), ["leads"])).status,
    201,
  );
  assert.equal(
    (await handle(request("leads", "POST", body), ["leads"])).status,
    201,
  );
  assert.equal(
    (db().prepare("SELECT COUNT(*) AS n FROM leads").get() as { n: number }).n,
    1,
  );
});
test("traveler sign-in fails honestly without email delivery; preview requires opt-in; links are single use", async () => {
  const unavailable = await handle(
    request("auth/traveler", "POST", { email: "traveler@example.com" }),
    ["auth", "traveler"],
  );
  assert.equal(unavailable.status, 503);
  process.env.DEV_PREVIEW_MODE = "true";
  const sent = await handle(
    request("auth/traveler", "POST", { email: "traveler@example.com" }),
    ["auth", "traveler"],
  );
  const payload = await sent.json();
  assert.ok(payload.data.previewUrl);
  process.env.DEV_PREVIEW_MODE = "false";
  const row = db()
    .prepare(
      "SELECT body FROM outbox WHERE subject='Your Reign in Wealth sign-in link'",
    )
    .get() as { body: string };
  const link = row.body.match(
    /http:\/\/localhost:3000\/api\/auth\/verify\?token=[a-f0-9]+/,
  )![0];
  const verified = await handle(new Request(link), ["auth", "verify"]);
  assert.equal(verified.status, 303);
  const cookie = verified.headers.get("set-cookie")!.split(";")[0];
  assert.equal(
    (await handle(new Request(link), ["auth", "verify"])).status,
    400,
  );
  assert.equal(
    (
      await handle(request("admin/bookings", "GET", undefined, cookie), [
        "admin",
        "bookings",
      ])
    ).status,
    401,
  );
  assert.equal(
    (await handle(request("portal", "GET", undefined, cookie), ["portal"]))
      .status,
    200,
  );
});
test("signed payment ledger rejects wrong totals and deduplicates events and sessions", () => {
  const retreat = getRetreats()[0];
  const id = randomUUID(),
    attempt = randomUUID();
  const booking = {
    id,
    reference: "RIW-TEST",
    retreatId: retreat.id,
    retreatSlug: retreat.slug,
    retreatName: retreat.destination,
    firstName: "Test",
    lastName: "Traveler",
    email: "owner2@example.com",
    phone: "+1234567890",
    country: "US",
    occupancy: "double",
    roommateName: "",
    roommateEmail: "",
    roomId: null,
    paymentChoice: "deposit",
    totalAmount: 100001,
    paidAmount: 0,
    currency: "USD",
    status: "pending",
    createdAt: new Date().toISOString(),
    installments: [
      { number: 1, amount: 25000, dueDate: "2027-01-01", paid: false },
      { number: 2, amount: 75001, dueDate: "2027-02-01", paid: false },
    ],
    holdExpiresAt: new Date(Date.now() + 3600000).toISOString(),
    promoId: null,
    termsSnapshot: "Terms",
    cancellationSnapshot: "Policy",
    acceptedAt: new Date().toISOString(),
    marketingConsent: false,
  };
  db()
    .prepare(
      "INSERT INTO bookings(id,reference,email,retreat_id,status,data) VALUES(?,?,?,?,?,?)",
    )
    .run(
      id,
      booking.reference,
      booking.email,
      booking.retreatId,
      booking.status,
      JSON.stringify(booking),
    );
  db()
    .prepare(
      "INSERT INTO checkout_attempts(id,booking_id,amount,currency,provider_session,status,created_at) VALUES(?,?,25000,'usd','cs_test_fixture','open',?)",
    )
    .run(attempt, id, new Date().toISOString());
  const data = {
    id: "cs_test_fixture",
    payment_status: "paid",
    payment_intent: "pi_fixture",
    amount_total: 25000,
    currency: "usd",
    metadata: { bookingId: id, attemptId: attempt },
  } as unknown as Stripe.Checkout.Session;
  assert.throws(() =>
    recordVerifiedPayment("evt_wrong", { ...data, amount_total: 25001 }),
  );
  assert.equal(listBookings().find((b) => b.id === id)?.paidAmount, 0);
  assert.equal(recordVerifiedPayment("evt_first", data).duplicate, false);
  assert.equal(recordVerifiedPayment("evt_first", data).duplicate, true);
  assert.equal(recordVerifiedPayment("evt_second", data).duplicate, true);
  const stored = listBookings().find((b) => b.id === id)!;
  assert.equal(stored.paidAmount, 25000);
  assert.equal(stored.status, "confirmed");
  assert.equal(stored.installments[0].paid, true);
  assert.equal(stored.installments[1].paid, false);
});
test("CSV export neutralizes spreadsheet formulas", () => {
  assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(csvCell("normal"), '"normal"');
});
test("invalid webhook signatures cannot update payments", async () => {
  const req = new Request("http://localhost:3000/api/payments/webhook", {
    method: "POST",
    headers: { "stripe-signature": "invalid" },
    body: "{}",
  });
  assert.equal((await handle(req, ["payments", "webhook"])).status, 400);
});

test("unsubscribe is scanner-safe and revokes all destination marketing without login", async () => {
  const row = db()
    .prepare("SELECT body FROM outbox WHERE dedupe_key LIKE 'lead:%' LIMIT 1")
    .get() as { body: string };
  const token = row.body.match(/unsubscribe\?token=([a-f0-9]+)/)![1];
  assert.equal(
    (
      await handle(
        new Request("http://localhost:3000/api/unsubscribe?token=" + token),
        ["unsubscribe"],
      )
    ).status,
    200,
  );
  assert.equal(
    (
      db()
        .prepare("SELECT consent FROM leads WHERE email=?")
        .get("traveler@example.com") as { consent: number }
    ).consent,
    1,
  );
  const result = await handle(request("unsubscribe", "POST", { token }), [
    "unsubscribe",
  ]);
  assert.equal(result.status, 200);
  assert.equal(
    (
      db()
        .prepare("SELECT consent FROM leads WHERE email=?")
        .get("traveler@example.com") as { consent: number }
    ).consent,
    0,
  );
  assert.equal(
    (
      db()
        .prepare(
          "SELECT status FROM outbox WHERE dedupe_key LIKE 'lead:%' LIMIT 1",
        )
        .get() as { status: string }
    ).status,
    "cancelled",
  );
});

test("double occupancy caps rooms at two separately registered travelers", async () => {
  const source = listBookings().find((b) => b.reference === "RIW-TEST")!;
  const others = [1, 2].map((n) => ({
    ...source,
    id: randomUUID(),
    reference: "RIW-ROOM-" + n,
    email: `room${n}@example.com`,
    paidAmount: 0,
    roomId: null,
    status: "pending",
  }));
  for (const b of others)
    db()
      .prepare(
        "INSERT INTO bookings(id,reference,email,retreat_id,status,data) VALUES(?,?,?,?,?,?)",
      )
      .run(
        b.id,
        b.reference,
        b.email,
        b.retreatId,
        b.status,
        JSON.stringify(b),
      );
  const assign = (id: string) =>
    handle(
      request("admin/bookings/" + id, "PATCH", { roomId: "A01" }, adminCookie),
      ["admin", "bookings", id],
    );
  assert.equal((await assign(source.id)).status, 200);
  assert.equal((await assign(others[0].id)).status, 200);
  assert.equal((await assign(others[1].id)).status, 400);
});
test("refund webhooks apply cumulative amounts once and never create extra refunds", () => {
  const charge = {
    payment_intent: "pi_fixture",
    currency: "usd",
    amount_refunded: 10000,
  } as unknown as Stripe.Charge;
  recordVerifiedRefund("evt_refund_1", charge);
  assert.equal(
    listBookings().find((b) => b.reference === "RIW-TEST")!.paidAmount,
    15000,
  );
  recordVerifiedRefund("evt_refund_1", charge);
  recordVerifiedRefund("evt_refund_2", charge);
  assert.equal(
    listBookings().find((b) => b.reference === "RIW-TEST")!.paidAmount,
    15000,
  );
  recordVerifiedRefund("evt_refund_3", { ...charge, amount_refunded: 25000 });
  assert.equal(
    listBookings().find((b) => b.reference === "RIW-TEST")!.paidAmount,
    0,
  );
});
test("browser expired magic links redirect back to a readable portal error", async () => {
  const result = await handle(
    new Request("http://localhost:3000/api/auth/verify?token=bad", {
      headers: { Accept: "text/html" },
    }),
    ["auth", "verify"],
  );
  assert.equal(result.status, 303);
  assert.equal(result.headers.get("location"), "/portal?error=expired");
});
test("server quotes apply promotions to each traveler and reject capacity or client totals", async () => {
  const template = getRetreats()[0];
  const retreat = {
    ...template,
    id: randomUUID(),
    slug: "quote-fixture",
    published: true,
    status: "open",
    bookingEnabled: true,
    startDate: "2030-12-01",
    endDate: "2030-12-07",
    hotelName: "Fixture accommodation",
    terms: "Confirmed terms fixture",
    cancellationPolicy: "Confirmed cancellation fixture",
    capacity: 2,
    priceDouble: 120001,
    priceSingle: 190001,
    depositAmount: 30000,
    installmentCount: 3,
  };
  db()
    .prepare("INSERT INTO retreats(id,slug,data) VALUES(?,?,?)")
    .run(retreat.id, retreat.slug, JSON.stringify(retreat));
  const settings = getSettings();
  db()
    .prepare("UPDATE settings SET data=? WHERE id=1")
    .run(JSON.stringify({ ...settings, policiesApproved: true }));
  const promo = {
    id: randomUUID(),
    code: "TENPERCENT",
    type: "percent",
    amount: 10,
    currency: "USD",
    retreatId: retreat.id,
    maxUses: 5,
    uses: 0,
    active: true,
    expiresAt: null,
  };
  db()
    .prepare("INSERT INTO promos(id,code,data) VALUES(?,?,?)")
    .run(promo.id, promo.code, JSON.stringify(promo));
  const result = quote({
    retreatSlug: retreat.slug,
    occupancy: "double",
    paymentChoice: "installments",
    promoCode: "TENPERCENT",
  });
  assert.equal(result.canBook, true);
  assert.equal(result.totalAmount, 108001);
  assert.equal(result.discount, 12000);
  assert.equal(
    result.installments.reduce((sum, p) => sum + p.amount, 0),
    108001,
  );
  const tampered = await handle(
    request("bookings", "POST", {
      retreatSlug: retreat.slug,
      occupancy: "double",
      paymentChoice: "full",
      firstName: "Test",
      lastName: "Person",
      email: "tamper@example.com",
      phone: "+123456789",
      country: "United States",
      termsAccepted: true,
      totalAmount: 1,
    }),
    ["bookings"],
  );
  assert.equal(tampered.status, 400);
  db()
    .prepare("UPDATE retreats SET data=? WHERE id=?")
    .run(JSON.stringify({ ...retreat, capacity: 0 }), retreat.id);
  assert.equal(
    quote({
      retreatSlug: retreat.slug,
      occupancy: "double",
      paymentChoice: "full",
    }).canBook,
    false,
  );
  db()
    .prepare("UPDATE settings SET data=? WHERE id=1")
    .run(JSON.stringify(settings));
});

test("unresolved checkout continues reserving capacity until provider expiry is confirmed", () => {
  const original = listBookings().find((b) => b.reference === "RIW-TEST")!;
  const b = {
    ...original,
    id: randomUUID(),
    reference: "RIW-DELAYED",
    email: "delayed@example.com",
    status: "pending",
    paidAmount: 0,
    holdExpiresAt: "2020-01-01T00:00:00.000Z",
  };
  db()
    .prepare(
      "INSERT INTO bookings(id,reference,email,retreat_id,status,data) VALUES(?,?,?,?,?,?)",
    )
    .run(b.id, b.reference, b.email, b.retreatId, b.status, JSON.stringify(b));
  assert.equal(reservesSeat(b), false);
  const attempt = randomUUID();
  db()
    .prepare(
      "INSERT INTO checkout_attempts(id,booking_id,amount,currency,provider_session,status,created_at) VALUES(?,?,100,'usd','cs_delayed','open',?)",
    )
    .run(attempt, b.id, "2020-01-01T00:00:00.000Z");
  assert.equal(reservesSeat(b), true);
  db()
    .prepare("UPDATE checkout_attempts SET status='expired' WHERE id=?")
    .run(attempt);
  assert.equal(reservesSeat(b), false);
});
test("media byte ranges are bounded and missing files do not expose filesystem paths", async () => {
  process.env.MEDIA_PATH = join(temporary, "media");
  mkdirSync(process.env.MEDIA_PATH, { recursive: true });
  const name = randomUUID() + ".mp4";
  writeFileSync(join(process.env.MEDIA_PATH, name), Buffer.from("0123456789"));
  const result = await handle(
    new Request("http://localhost:3000/api/media/" + name, {
      headers: { Range: "bytes=2-5" },
    }),
    ["media", name],
  );
  assert.equal(result.status, 206);
  assert.equal(await result.text(), "2345");
  assert.equal(result.headers.get("content-range"), "bytes 2-5/10");
  const bad = await handle(
    new Request("http://localhost:3000/api/media/" + name, {
      headers: { Range: "bytes=100-200" },
    }),
    ["media", name],
  );
  assert.equal(bad.status, 416);
  assert.equal(
    (await handle(request("media/not-a-file"), ["media", "not-a-file"])).status,
    404,
  );
});
test("malformed JSON has a useful 400 response", async () => {
  const result = await handle(
    new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: "{broken",
    }),
    ["leads"],
  );
  assert.equal(result.status, 400);
  assert.equal((await result.json()).error, "Invalid JSON.");
});
