import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import type { Booking, Retreat } from "../types";
import { db, transaction } from "./db";
import { getRetreat, getSettings } from "./data";
import { ApiError, requireCondition, appUrl } from "./security";
import { queueMail, bookingWelcome } from "./email";
import { bookingSchema, quoteSchema } from "./validation";
import type { z } from "zod";

export type StoredBooking = Booking & {
  holdExpiresAt: string;
  promoId: string | null;
  termsSnapshot: string;
  cancellationSnapshot: string;
  acceptedAt: string;
  marketingConsent: boolean;
};
export type Promo = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  amount: number;
  currency: string;
  retreatId: string | null;
  maxUses: number;
  uses: number;
  active: boolean;
  expiresAt: string | null;
};
export function stripe() {
  requireCondition(
    process.env.STRIPE_SECRET_KEY,
    "Online payments are not available yet.",
    503,
  );
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2,
    timeout: 15000,
  });
}
export function paymentReady() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
  );
}
export function listBookings(email?: string): StoredBooking[] {
  const rows = email
    ? db()
        .prepare("SELECT data FROM bookings WHERE email=? ORDER BY rowid DESC")
        .all(email)
    : db().prepare("SELECT data FROM bookings ORDER BY rowid DESC").all();
  return (rows as { data: string }[]).map((r) => JSON.parse(r.data));
}
export function reservesSeat(b: StoredBooking) {
  if (b.status === "confirmed") return true;
  if (b.status !== "pending") return false;
  if (Date.parse(b.holdExpiresAt) > Date.now()) return true;
  return Boolean(
    db()
      .prepare(
        "SELECT id FROM checkout_attempts WHERE booking_id=? AND status IN ('creating','open') LIMIT 1",
      )
      .get(b.id),
  );
}
export function getBooking(id: string): StoredBooking {
  const row = db().prepare("SELECT data FROM bookings WHERE id=?").get(id) as
    | { data: string }
    | undefined;
  requireCondition(row, "Registration not found.", 404);
  return JSON.parse(row.data);
}
export function saveBooking(booking: StoredBooking) {
  db()
    .prepare("UPDATE bookings SET status=?,data=? WHERE id=?")
    .run(booking.status, JSON.stringify(booking), booking.id);
}
export function publicBooking(b: StoredBooking): Booking {
  const {
    holdExpiresAt,
    promoId,
    termsSnapshot,
    cancellationSnapshot,
    acceptedAt,
    marketingConsent,
    ...result
  } = b;
  void holdExpiresAt;
  void promoId;
  void termsSnapshot;
  void cancellationSnapshot;
  void acceptedAt;
  void marketingConsent;
  return result;
}
export function getPromos(): Promo[] {
  return (
    db().prepare("SELECT data FROM promos").all() as { data: string }[]
  ).map((r) => JSON.parse(r.data));
}
function promoFor(code: string | undefined, r: Retreat): Promo | null {
  if (!code) return null;
  const row = db()
    .prepare("SELECT data FROM promos WHERE code=?")
    .get(code.trim().toUpperCase()) as { data: string } | undefined;
  requireCondition(row, "This promotional code is not available.");
  const promo = JSON.parse(row.data) as Promo;
  const now = Date.now();
  const reservations = listBookings().filter(
    (b) => b.promoId === promo.id && b.status === "pending" && reservesSeat(b),
  ).length;
  requireCondition(
    promo.active &&
      (!promo.expiresAt || Date.parse(promo.expiresAt) > now) &&
      promo.uses + reservations < promo.maxUses &&
      (!promo.retreatId || promo.retreatId === r.id) &&
      (promo.type === "percent" || promo.currency === r.currency),
    "This promotional code is not available for this retreat.",
  );
  return promo;
}
export function paymentSchedule(
  total: number,
  deposit: number | null,
  count: number,
  choice: Booking["paymentChoice"],
  startDate: string | null,
  now = new Date(),
): Booking["installments"] {
  requireCondition(
    Number.isSafeInteger(total) && total > 0,
    "Package pricing is not ready.",
  );
  const today = now.toISOString().slice(0, 10);
  const finalTime = startDate
    ? Date.parse(startDate) - 30 * 86400000
    : now.getTime();
  if (choice === "full" || finalTime <= now.getTime())
    return [{ number: 1, amount: total, dueDate: today, paid: false }];
  requireCondition(
    deposit && deposit > 0,
    "Deposit and payment plans will be announced shortly.",
  );
  const first = Math.min(deposit, total);
  if (first === total)
    return [{ number: 1, amount: total, dueDate: today, paid: false }];
  const remaining = total - first;
  const parts =
    choice === "installments" ? Math.max(1, Math.min(count - 1, 11)) : 1;
  const list = [{ number: 1, amount: first, dueDate: today, paid: false }];
  let allocated = 0;
  for (let n = 1; n <= parts; n++) {
    const amount =
      n === parts ? remaining - allocated : Math.floor(remaining / parts);
    allocated += amount;
    list.push({
      number: n + 1,
      amount,
      dueDate: new Date(
        now.getTime() + ((finalTime - now.getTime()) * n) / parts,
      )
        .toISOString()
        .slice(0, 10),
      paid: false,
    });
  }
  return list;
}
export function quote(input: z.infer<typeof quoteSchema>) {
  const retreat = getRetreat(input.retreatSlug);
  requireCondition(retreat, "Retreat not found.", 404);
  const subtotal =
    input.occupancy === "single" ? retreat.priceSingle : retreat.priceDouble;
  const settings = getSettings();
  let reason: string | undefined;
  if (
    !retreat.bookingEnabled ||
    retreat.status !== "open" ||
    !subtotal ||
    !retreat.startDate ||
    !retreat.endDate ||
    !retreat.hotelName ||
    !retreat.terms ||
    !retreat.cancellationPolicy ||
    !settings.policiesApproved ||
    !paymentReady()
  )
    reason =
      "Reservations are being finalized. Join the destination waitlist to hear when booking opens.";
  else if (Date.parse(retreat.startDate) < Date.now())
    reason = "Reservations for this retreat have closed.";
  const active = listBookings().filter(
    (b) => b.retreatId === retreat.id && reservesSeat(b),
  ).length;
  if (
    retreat.status === "sold_out" ||
    (retreat.capacity > 0 && active >= retreat.capacity)
  )
    reason =
      "This retreat is fully reserved. Join the waitlist for availability updates.";
  else if (retreat.capacity < 1)
    reason =
      reason ||
      "Reservations are being finalized. Join the destination waitlist to hear when booking opens.";
  const promo = subtotal ? promoFor(input.promoCode, retreat) : null;
  const discount =
    promo && subtotal
      ? Math.min(
          subtotal,
          promo.type === "percent"
            ? Math.floor((subtotal * promo.amount) / 100)
            : promo.amount,
        )
      : 0;
  const totalAmount = (subtotal || 0) - discount;
  let installments: Booking["installments"] = [];
  if (totalAmount > 0) {
    try {
      installments = paymentSchedule(
        totalAmount,
        retreat.depositAmount,
        retreat.installmentCount,
        input.paymentChoice,
        retreat.startDate,
      );
    } catch (error) {
      reason =
        error instanceof Error ? error.message : "Payment plan unavailable.";
    }
  }
  if (installments.some((p) => p.amount < 100))
    reason =
      "Please select full payment or contact the retreat team for this payment schedule.";
  if (totalAmount <= 0)
    reason = reason || "Please contact the team to arrange this registration.";
  return {
    subtotal: subtotal || 0,
    discount,
    totalAmount,
    amountDue: installments[0]?.amount || 0,
    currency: retreat.currency,
    installments,
    canBook: !reason,
    reason,
    promoId: promo?.id || null,
  };
}
export async function makeCheckout(booking: StoredBooking, amount: number) {
  requireCondition(
    booking.status !== "cancelled",
    "This registration has been cancelled.",
    409,
  );
  requireCondition(
    Number.isSafeInteger(amount) &&
      amount > 0 &&
      amount <= booking.totalAmount - booking.paidAmount,
    "Invalid payment amount.",
  );
  const client = stripe();
  const old = db()
    .prepare(
      "SELECT * FROM checkout_attempts WHERE booking_id=? AND status='open' ORDER BY created_at DESC LIMIT 1",
    )
    .get(booking.id) as
    | { id: string; provider_session: string | null; amount: number }
    | undefined;
  if (old?.provider_session) {
    const existing = await client.checkout.sessions.retrieve(
      old.provider_session,
    );
    if (existing.status === "open" && existing.url && old.amount === amount)
      return existing.url;
    if (existing.status === "complete")
      throw new ApiError(
        409,
        "Your previous payment is being verified. Please refresh shortly.",
      );
    if (existing.status === "open")
      await client.checkout.sessions.expire(existing.id);
    db()
      .prepare("UPDATE checkout_attempts SET status='expired' WHERE id=?")
      .run(old.id);
  }
  const attemptId = randomUUID();
  // Only one checkout request can be active for a registration at a time.
  transaction(() => {
    const current = getBooking(booking.id);
    requireCondition(
      current.status !== "cancelled" &&
        amount <= current.totalAmount - current.paidAmount,
      "Your registration balance changed. Refresh before paying.",
      409,
    );
    const recent = db()
      .prepare(
        "SELECT id FROM checkout_attempts WHERE booking_id=? AND status='creating' AND created_at>? LIMIT 1",
      )
      .get(booking.id, new Date(Date.now() - 60000).toISOString());
    requireCondition(
      !recent,
      "A checkout is already being prepared. Please try again shortly.",
      409,
    );
    db()
      .prepare(
        "INSERT INTO checkout_attempts(id,booking_id,amount,currency,status,created_at) VALUES(?,?,?,?,'creating',?)",
      )
      .run(
        attemptId,
        booking.id,
        amount,
        booking.currency.toLowerCase(),
        new Date().toISOString(),
      );
  });
  try {
    const result = await client.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: booking.email,
        client_reference_id: booking.id,
        metadata: { bookingId: booking.id, attemptId },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: booking.currency.toLowerCase(),
              unit_amount: amount,
              product_data: {
                name: `${booking.retreatName} · ${booking.reference}`,
                description: `Individual traveler registration (${booking.occupancy} occupancy). ${amount === booking.totalAmount ? "Full payment" : "Retreat payment"}.`,
              },
            },
          },
        ],
        payment_intent_data: {
          receipt_email: booking.email,
          metadata: { bookingId: booking.id, attemptId },
        },
        success_url: `${appUrl()}/portal?payment=received`,
        cancel_url: `${appUrl()}/portal?payment=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      },
      { idempotencyKey: attemptId },
    );
    requireCondition(result.url, "Checkout is temporarily unavailable.", 502);
    db()
      .prepare(
        "UPDATE checkout_attempts SET provider_session=?,status='open' WHERE id=?",
      )
      .run(result.id, attemptId);
    return result.url;
  } catch (error) {
    db()
      .prepare("UPDATE checkout_attempts SET status='failed' WHERE id=?")
      .run(attemptId);
    throw error;
  }
}
export async function createBooking(input: z.infer<typeof bookingSchema>) {
  const booking = transaction(() => {
    const q = quote(input);
    requireCondition(
      q.canBook,
      q.reason || "Booking is not yet available.",
      409,
    );
    const retreat = getRetreat(input.retreatSlug)!;
    const existing = listBookings(input.email).find(
      (b) => b.retreatId === retreat.id && reservesSeat(b),
    );
    requireCondition(
      !existing,
      "A registration already exists for this email and retreat. Sign in to the traveler portal to continue.",
      409,
    );
    const now = new Date().toISOString();
    const b: StoredBooking = {
      id: randomUUID(),
      reference: `RIW-${randomUUID().slice(0, 8).toUpperCase()}`,
      retreatId: retreat.id,
      retreatSlug: retreat.slug,
      retreatName: retreat.destination,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      country: input.country,
      occupancy: input.occupancy,
      roommateName:
        input.occupancy === "double" ? input.roommateName || "" : "",
      roommateEmail:
        input.occupancy === "double" ? input.roommateEmail || "" : "",
      roomId: null,
      paymentChoice: input.paymentChoice,
      totalAmount: q.totalAmount,
      paidAmount: 0,
      currency: q.currency,
      status: "pending",
      createdAt: now,
      installments: q.installments,
      notes: input.notes || "",
      holdExpiresAt: new Date(Date.now() + 45 * 60000).toISOString(),
      promoId: q.promoId,
      termsSnapshot: retreat.terms,
      cancellationSnapshot: retreat.cancellationPolicy,
      acceptedAt: now,
      marketingConsent: Boolean(input.marketingConsent),
    };
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
    return b;
  });
  try {
    const checkoutUrl = await makeCheckout(
      booking,
      booking.installments[0].amount,
    );
    if (input.marketingConsent)
      db()
        .prepare(
          "INSERT INTO leads(id,name,email,destination,source,consent,created_at) VALUES(?,?,?,?,'newsletter',1,?) ON CONFLICT(email,destination,source) DO UPDATE SET consent=1",
        )
        .run(
          randomUUID(),
          `${input.firstName} ${input.lastName}`,
          input.email,
          booking.retreatSlug,
          new Date().toISOString(),
        );
    queueMail(
      booking.email,
      `Complete your ${booking.retreatName} registration`,
      `Hello ${booking.firstName},\n\nWe have received your registration request ${booking.reference}. Your place is not confirmed until payment is verified.\n\nComplete your secure payment: ${checkoutUrl}\n\nThis payment link expires after 30 minutes. You can sign in at ${appUrl()}/portal to view the registration. Each person sharing a room must register separately.\n\nReign in Wealth Retreats`,
      `registration:${booking.id}`,
    );
    return { booking: publicBooking(booking), checkoutUrl };
  } catch (error) {
    booking.holdExpiresAt = new Date().toISOString();
    saveBooking(booking);
    throw error;
  }
}
export function recordVerifiedPayment(
  eventId: string,
  session: Stripe.Checkout.Session,
) {
  return transaction(() => {
    if (db().prepare("SELECT id FROM stripe_events WHERE id=?").get(eventId))
      return { duplicate: true };
    requireCondition(
      session.payment_status === "paid",
      "Payment is not settled.",
      409,
    );
    const attemptId = session.metadata?.attemptId;
    const bookingId = session.metadata?.bookingId;
    requireCondition(attemptId && bookingId, "Unknown payment metadata.");
    const attempt = db()
      .prepare("SELECT * FROM checkout_attempts WHERE id=? AND booking_id=?")
      .get(attemptId, bookingId) as
      | { amount: number; currency: string; provider_session: string | null }
      | undefined;
    requireCondition(
      attempt && attempt.provider_session === session.id,
      "Unknown checkout session.",
    );
    requireCondition(
      session.amount_total === attempt.amount &&
        session.currency === attempt.currency,
      "Payment amount or currency does not match the registration.",
    );
    const already = db()
      .prepare("SELECT id FROM payments WHERE provider_session=?")
      .get(session.id);
    if (already) {
      db()
        .prepare("INSERT INTO stripe_events(id,created_at) VALUES(?,?)")
        .run(eventId, new Date().toISOString());
      return { duplicate: true };
    }
    const booking = getBooking(bookingId);
    requireCondition(
      booking.paidAmount + attempt.amount <= booking.totalAmount,
      "Payment exceeds the registration balance.",
    );
    const id = randomUUID();
    const now = new Date().toISOString();
    db()
      .prepare(
        "INSERT INTO payments(id,provider_session,booking_id,amount,currency,payment_intent,created_at) VALUES(?,?,?,?,?,?,?)",
      )
      .run(
        id,
        session.id,
        booking.id,
        attempt.amount,
        booking.currency,
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null,
        now,
      );
    const initial = booking.paidAmount === 0;
    booking.paidAmount += attempt.amount;
    // A payment arriving after an operator cancellation stays visible without reactivating the booking.
    if (booking.status !== "cancelled") booking.status = "confirmed";
    let covered = booking.paidAmount;
    booking.installments = booking.installments.map((part) => {
      const paid = covered >= part.amount;
      covered = Math.max(0, covered - part.amount);
      return { ...part, paid };
    });
    saveBooking(booking);
    if (initial && booking.promoId) {
      const promo = getPromos().find((p) => p.id === booking.promoId);
      if (promo) {
        promo.uses++;
        db()
          .prepare("UPDATE promos SET data=? WHERE id=?")
          .run(JSON.stringify(promo), promo.id);
      }
    }
    db()
      .prepare("UPDATE checkout_attempts SET status='paid' WHERE id=?")
      .run(attemptId);
    db()
      .prepare("INSERT INTO stripe_events(id,created_at) VALUES(?,?)")
      .run(eventId, now);
    if (initial && booking.status !== "cancelled") bookingWelcome(booking);
    queueMail(
      booking.email,
      `Payment received · ${booking.reference}`,
      `Hello ${booking.firstName},\n\nWe received ${new Intl.NumberFormat("en-US", { style: "currency", currency: booking.currency }).format(attempt.amount / 100)} for ${booking.retreatName}.\n\nReference: ${booking.reference}\nBalance remaining: ${new Intl.NumberFormat("en-US", { style: "currency", currency: booking.currency }).format((booking.totalAmount - booking.paidAmount) / 100)}\n\nView your receipt and schedule: ${appUrl()}/portal\n\n${booking.status === "cancelled" ? "Your registration is cancelled; contact the retreat team about this payment.\n\n" : ""}Reign in Wealth Retreats`,
      `receipt:${session.id}`,
    );
    return { duplicate: false, bookingId: booking.id };
  });
}

export function recordVerifiedRefund(eventId: string, charge: Stripe.Charge) {
  return transaction(() => {
    if (db().prepare("SELECT id FROM stripe_events WHERE id=?").get(eventId))
      return { duplicate: true };
    const paymentIntent =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;
    const payment = paymentIntent
      ? (db()
          .prepare(
            "SELECT id,booking_id,amount,refunded_amount,currency FROM payments WHERE payment_intent=?",
          )
          .get(paymentIntent) as
          | {
              id: string;
              booking_id: string;
              amount: number;
              refunded_amount: number;
              currency: string;
            }
          | undefined)
      : undefined;
    // This Stripe account may also process payments outside this website.
    if (!payment) return { unrelated: true };
    requireCondition(
      charge.currency === payment.currency.toLowerCase() &&
        charge.amount_refunded <= payment.amount,
      "Refund currency or amount does not match.",
    );
    const delta = Math.max(0, charge.amount_refunded - payment.refunded_amount);
    if (delta > 0) {
      const booking = getBooking(payment.booking_id);
      requireCondition(
        booking.paidAmount >= delta,
        "Refund exceeds recorded payments.",
      );
      booking.paidAmount -= delta;
      let covered = booking.paidAmount;
      booking.installments = booking.installments.map((p) => {
        const paid = covered >= p.amount;
        covered = Math.max(0, covered - p.amount);
        return { ...p, paid };
      });
      saveBooking(booking);
      db()
        .prepare("UPDATE payments SET refunded_amount=? WHERE id=?")
        .run(charge.amount_refunded, payment.id);
      queueMail(
        booking.email,
        `Refund recorded · ${booking.reference}`,
        `Hello ${booking.firstName},\n\nA refund of ${new Intl.NumberFormat("en-US", { style: "currency", currency: booking.currency }).format(delta / 100)} has been recorded for ${booking.retreatName}. Your payment provider determines when the funds reach your account.\n\nReview your registration: ${appUrl()}/portal\n\nReign in Wealth Retreats`,
        `refund:${eventId}`,
      );
    }
    db()
      .prepare("INSERT INTO stripe_events(id,created_at) VALUES(?,?)")
      .run(eventId, new Date().toISOString());
    return { duplicate: false };
  });
}

export async function reconcileCheckouts() {
  db()
    .prepare(
      "UPDATE checkout_attempts SET status='failed' WHERE status='creating' AND provider_session IS NULL AND created_at<?",
    )
    .run(new Date(Date.now() - 5 * 60000).toISOString());
  if (!paymentReady()) return { checked: 0, failed: 0 };
  const attempts = db()
    .prepare(
      "SELECT id,provider_session FROM checkout_attempts WHERE status='open' AND provider_session IS NOT NULL AND created_at<? ORDER BY created_at LIMIT 10",
    )
    .all(new Date(Date.now() - 30 * 60000).toISOString()) as {
    id: string;
    provider_session: string;
  }[];
  let checked = 0,
    failed = 0;
  const client = stripe();
  for (const attempt of attempts) {
    try {
      const result = await client.checkout.sessions.retrieve(
        attempt.provider_session,
      );
      if (result.payment_status === "paid")
        recordVerifiedPayment(`reconcile:${result.id}`, result);
      else if (result.status === "expired")
        db()
          .prepare(
            "UPDATE checkout_attempts SET status='expired' WHERE id=? AND status!='paid'",
          )
          .run(attempt.id);
      checked++;
    } catch {
      failed++;
    }
  }
  return { checked, failed };
}
