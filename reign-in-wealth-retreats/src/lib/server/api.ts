import { randomBytes, randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { z, ZodError } from "zod";
import { db, transaction } from "./db";
import { getRetreats, getRetreat, getSettings, getTestimonials } from "./data";
import {
  ApiError,
  requireCondition,
  jsonBody,
  checkOrigin,
  rateLimit,
  requestKey,
  requireSession,
  session,
  createSession,
  logout,
  verifyPassword,
  safeEqual,
  hash,
  isDevPreview,
  appUrl,
  audit,
  csvCell,
} from "./security";
import {
  email,
  bookingSchema,
  quoteSchema,
  leadSchema,
  contactSchema,
  retreatSchema,
  settingsSchema,
  testimonialSchema,
  promoSchema,
} from "./validation";
import {
  quote,
  createBooking,
  listBookings,
  getBooking,
  saveBooking,
  publicBooking,
  stripe,
  paymentReady,
  reservesSeat,
  makeCheckout,
  recordVerifiedPayment,
  recordVerifiedRefund,
  getPromos,
  type Promo,
} from "./payments";
import { queueMail, runJobs, flushOutbox } from "./email";
import type { Booking } from "../types";

const ok = (
  data: unknown,
  message?: string,
  status = 200,
  headers: HeadersInit = {},
) =>
  Response.json(
    { data, ...(message ? { message } : {}) },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
const param = (parts: string[], i: number) =>
  decodeURIComponent(parts[i] || "");
const now = () => new Date().toISOString();
// Runtime uploads are persisted separately; they must never enter the build trace.
const mediaRoot = () =>
  resolve(/*turbopackIgnore: true*/ process.env.MEDIA_PATH || "./data/media");

function leads() {
  return db()
    .prepare(
      "SELECT id,name,email,destination,source,consent,created_at AS createdAt FROM leads ORDER BY created_at DESC",
    )
    .all();
}
function messages() {
  return db()
    .prepare(
      "SELECT id,name,email,phone,subject,message,created_at AS createdAt FROM messages ORDER BY created_at DESC",
    )
    .all();
}
async function upload(request: Request) {
  requireCondition(
    Number(request.headers.get("content-length") || 0) < 27 * 1024 * 1024,
    "Upload must be 25 MB or smaller.",
    413,
  );
  const form = await request.formData();
  const file = form.get("file");
  requireCondition(file instanceof File, "Choose an image or video to upload.");
  requireCondition(
    file.size > 0 && file.size <= 25 * 1024 * 1024,
    "Upload must be 25 MB or smaller.",
    413,
  );
  const buffer = Buffer.from(await file.arrayBuffer());
  const head = buffer.subarray(0, 32);
  let extension = "";
  let mime = "";
  if (head.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) {
    extension = "jpg";
    mime = "image/jpeg";
  } else if (
    head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    extension = "png";
    mime = "image/png";
  } else if (
    head.toString("ascii", 0, 4) === "RIFF" &&
    head.toString("ascii", 8, 12) === "WEBP"
  ) {
    extension = "webp";
    mime = "image/webp";
  } else if (/^GIF8[79]a/.test(head.toString("ascii"))) {
    extension = "gif";
    mime = "image/gif";
  } else if (
    head.toString("ascii", 4, 8) === "ftyp" &&
    /avif|avis/.test(head.toString("ascii"))
  ) {
    extension = "avif";
    mime = "image/avif";
  } else if (
    head.toString("ascii", 4, 8) === "ftyp" &&
    /isom|mp4|M4V|avc1|iso[2-9]/.test(head.toString("ascii"))
  ) {
    extension = "mp4";
    mime = "video/mp4";
  } else if (head.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]))) {
    extension = "webm";
    mime = "video/webm";
  }
  requireCondition(
    extension && file.type === mime,
    "Upload a supported JPEG, PNG, WebP, AVIF, GIF, MP4 or WebM file.",
  );
  const name = `${randomUUID()}.${extension}`;
  await mkdir(/*turbopackIgnore: true*/ mediaRoot(), { recursive: true });
  await writeFile(
    /*turbopackIgnore: true*/ join(/*turbopackIgnore: true*/ mediaRoot(), name),
    buffer,
    { flag: "wx", mode: 0o600 },
  );
  return {
    url: `/api/media/${name}`,
    name: file.name.replace(/[\r\n]/g, ""),
    size: file.size,
  };
}

export async function handle(
  request: Request,
  parts: string[],
): Promise<Response> {
  try {
    const method = request.method;
    const path = parts.join("/");
    const url = new URL(request.url);
    if (method === "GET" && parts[0] === "media") {
      const filename = param(parts, 1);
      requireCondition(
        /^[a-f0-9-]{36}\.(jpg|png|webp|gif|avif|mp4|webm)$/.test(filename),
        "Media not found.",
        404,
      );
      const extension = filename.split(".").pop()!;
      const types: Record<string, string> = {
        jpg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        gif: "image/gif",
        avif: "image/avif",
        mp4: "video/mp4",
        webm: "video/webm",
      };
      let bytes: Buffer;
      try {
        bytes = await readFile(
          /*turbopackIgnore: true*/ join(
            /*turbopackIgnore: true*/ mediaRoot(),
            filename,
          ),
        );
      } catch {
        throw new ApiError(404, "Media not found.");
      }
      const headers: Record<string, string> = {
        "Content-Type": types[extension],
        "Content-Length": String(bytes.length),
        "Cache-Control": "public,max-age=31536000,immutable",
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": "bytes",
      };
      const range = request.headers.get("range");
      if (range) {
        const match = range.match(/^bytes=(\d*)-(\d*)$/);
        if (!match || (!match[1] && !match[2]))
          return new Response(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${bytes.length}` },
          });
        const suffix = !match[1];
        const start = suffix
          ? Math.max(0, bytes.length - Number(match[2]))
          : Number(match[1]);
        const end = suffix
          ? bytes.length - 1
          : Math.min(
              match[2] ? Number(match[2]) : bytes.length - 1,
              bytes.length - 1,
            );
        if (
          start > end ||
          start >= bytes.length ||
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end)
        )
          return new Response(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${bytes.length}` },
          });
        headers["Content-Range"] = `bytes ${start}-${end}/${bytes.length}`;
        headers["Content-Length"] = String(end - start + 1);
        return new Response(new Uint8Array(bytes.subarray(start, end + 1)), {
          status: 206,
          headers,
        });
      }
      return new Response(new Uint8Array(bytes), { headers });
    }
    if (method === "POST" && path === "payments/webhook") {
      requireCondition(
        process.env.STRIPE_WEBHOOK_SECRET,
        "Payment verification is not configured.",
        503,
      );
      const signature = request.headers.get("stripe-signature");
      requireCondition(signature, "Missing payment signature.");
      let event;
      try {
        event = stripe().webhooks.constructEvent(
          await request.text(),
          signature,
          process.env.STRIPE_WEBHOOK_SECRET,
        );
      } catch {
        throw new ApiError(400, "Invalid payment signature.");
      }
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        if (event.data.object.payment_status === "paid")
          recordVerifiedPayment(event.id, event.data.object);
      }
      if (event.type === "charge.refunded")
        recordVerifiedRefund(event.id, event.data.object);
      if (event.type === "checkout.session.expired") {
        const stripeSession = event.data.object;
        db()
          .prepare(
            "UPDATE checkout_attempts SET status='expired' WHERE provider_session=? AND status!='paid'",
          )
          .run(stripeSession.id);
      }
      return ok({ received: true });
    }
    if (method === "POST" && path === "jobs") {
      const expected = process.env.CRON_SECRET;
      requireCondition(
        expected && expected.length >= 32,
        "Job processing is not configured.",
        503,
      );
      requireCondition(
        safeEqual(
          request.headers.get("authorization") || "",
          `Bearer ${expected}`,
        ),
        "Unauthorized.",
        401,
      );
      return ok(await runJobs());
    }
    if (method !== "GET" && method !== "HEAD") {
      checkOrigin(request);
      rateLimit(`ip:${requestKey(request)}:${parts[0]}`, 80);
    }
    if (method === "GET" && path === "health") return ok({ status: "ok" });
    if (method === "GET" && path === "retreats") return ok(getRetreats());
    if (method === "GET" && parts[0] === "retreats" && parts.length === 2) {
      const retreat = getRetreat(param(parts, 1));
      requireCondition(retreat, "Retreat not found.", 404);
      return ok(retreat);
    }
    if (method === "GET" && path === "settings") return ok(getSettings());
    if (method === "POST" && path === "leads") {
      const input = leadSchema.parse(await jsonBody(request));
      rateLimit(`lead:${hash(input.email)}`, 5, 3600000);
      const id = randomUUID();
      db()
        .prepare(
          "INSERT INTO leads(id,name,email,destination,source,consent,created_at) VALUES(?,?,?,?,?,1,?) ON CONFLICT(email,destination,source) DO UPDATE SET name=excluded.name,consent=1",
        )
        .run(
          id,
          input.name || "",
          input.email,
          input.destination || "all",
          input.source,
          now(),
        );
      const row = db()
        .prepare(
          "SELECT id FROM leads WHERE email=? AND destination=? AND source=?",
        )
        .get(input.email, input.destination || "all", input.source) as {
        id: string;
      };
      const unsubscribeToken = randomBytes(32).toString("hex");
      db()
        .prepare("INSERT INTO unsubscribe_tokens(token_hash,email) VALUES(?,?)")
        .run(hash(unsubscribeToken), input.email);
      queueMail(
        input.email,
        "You’re on the Reign in Wealth list",
        `Hello${input.name ? " " + input.name : ""},\n\nThank you for joining our travel community. We will share updates about ${input.destination && input.destination !== "all" ? getRetreat(input.destination)?.destination || "your chosen destination" : "our upcoming retreats"} as details are confirmed.\n\nJoining this list does not reserve a place or take a payment.\n\nExplore our retreats: ${appUrl()}/retreats\n\nTo unsubscribe from destination marketing updates: ${appUrl()}/unsubscribe?token=${unsubscribeToken}\n\nReign in Wealth Retreats`,
        `lead:${row.id}`,
      );
      return ok(
        { id: row.id },
        "You’re on the list. We’ll share the next confirmed details.",
        201,
      );
    }
    if (path === "unsubscribe" && (method === "GET" || method === "POST")) {
      const token =
        method === "GET"
          ? url.searchParams.get("token") || ""
          : z
              .object({ token: z.string() })
              .strict()
              .parse(await jsonBody(request)).token;
      requireCondition(
        /^[a-f0-9]{64}$/.test(token),
        "This unsubscribe link is invalid.",
        400,
      );
      const row = db()
        .prepare("SELECT email FROM unsubscribe_tokens WHERE token_hash=?")
        .get(hash(token)) as { email: string } | undefined;
      requireCondition(row, "This unsubscribe link is invalid.", 400);
      if (method === "GET") return ok({ valid: true });
      transaction(() => {
        db().prepare("UPDATE leads SET consent=0 WHERE email=?").run(row.email);
        db()
          .prepare(
            "UPDATE outbox SET status='cancelled' WHERE recipient=? AND dedupe_key LIKE 'lead:%' AND status IN ('pending','failed')",
          )
          .run(row.email);
      });
      return ok(
        { unsubscribed: true },
        "You have been unsubscribed from marketing updates. Essential updates about your registered retreat will still reach you.",
      );
    }
    if (method === "POST" && path === "contact") {
      const input = contactSchema.parse(await jsonBody(request));
      rateLimit(`contact:${hash(input.email)}`, 5, 3600000);
      const id = randomUUID();
      db()
        .prepare(
          "INSERT INTO messages(id,name,email,phone,subject,message,created_at) VALUES(?,?,?,?,?,?,?)",
        )
        .run(
          id,
          input.name,
          input.email,
          input.phone || "",
          input.subject,
          input.message,
          now(),
        );
      const contact = getSettings().contactEmail;
      if (contact)
        queueMail(
          contact,
          `Retreat enquiry · ${input.subject}`,
          `From: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone || "Not provided"}\n\n${input.message}`,
          `contact:${id}`,
        );
      return ok(
        { id },
        "Your message has been received. The retreat team will be in touch.",
        201,
      );
    }
    if (method === "POST" && path === "bookings/quote") {
      const input = quoteSchema.parse(await jsonBody(request));
      const { promoId, ...result } = quote(input);
      void promoId;
      return ok(result);
    }
    if (method === "POST" && path === "bookings") {
      const input = bookingSchema.parse(await jsonBody(request));
      rateLimit(`booking:${hash(input.email)}`, 5, 3600000);
      return ok(await createBooking(input), undefined, 201);
    }
    if (method === "POST" && path === "auth/traveler") {
      requireCondition(
        isDevPreview() ||
          Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
        "Traveler sign-in will be available when the retreat team enables email delivery.",
        503,
      );
      const input = z
        .object({ email })
        .strict()
        .parse(await jsonBody(request));
      rateLimit(`magic:${hash(input.email)}`, 3, 15 * 60000);
      const token = randomBytes(32).toString("hex");
      db()
        .prepare("DELETE FROM magic_tokens WHERE email=? OR expires<?")
        .run(input.email, Date.now());
      db()
        .prepare(
          "UPDATE outbox SET status='cancelled' WHERE recipient=? AND dedupe_key LIKE 'magic:%' AND status IN ('pending','failed')",
        )
        .run(input.email);
      db()
        .prepare(
          "INSERT INTO magic_tokens(token_hash,email,expires) VALUES(?,?,?)",
        )
        .run(hash(token), input.email, Date.now() + 15 * 60000);
      const previewUrl = `${appUrl()}/api/auth/verify?token=${token}`;
      const mailId = queueMail(
        input.email,
        "Your Reign in Wealth sign-in link",
        `Sign in to your traveler portal:\n\n${previewUrl}\n\nThis link expires in 15 minutes and can be used once. If you did not request it, you can ignore this email.\n\nReign in Wealth Retreats`,
        `magic:${hash(token)}`,
      );
      // Sign-in email is sent immediately when a verified sender is configured.
      const delivery = await flushOutbox(mailId || undefined);
      requireCondition(
        !delivery.failed || isDevPreview(),
        "We could not deliver your sign-in email. Please try again shortly.",
        503,
      );
      return ok(
        { sent: true, ...(isDevPreview() ? { previewUrl } : {}) },
        "If delivery is configured, a sign-in link will arrive shortly.",
      );
    }
    if (method === "GET" && path === "auth/verify") {
      const token = url.searchParams.get("token") || "";
      requireCondition(
        /^[a-f0-9]{64}$/.test(token),
        "This sign-in link is invalid or has expired.",
        400,
      );
      const row = transaction(() => {
        const row = db()
          .prepare("SELECT email,expires FROM magic_tokens WHERE token_hash=?")
          .get(hash(token)) as { email: string; expires: number } | undefined;
        requireCondition(
          row && row.expires > Date.now(),
          "This sign-in link is invalid or has expired.",
          400,
        );
        db()
          .prepare("DELETE FROM magic_tokens WHERE token_hash=?")
          .run(hash(token));
        return row;
      });
      return new Response(null, {
        status: 303,
        headers: {
          Location: `${appUrl()}/portal`,
          "Set-Cookie": createSession(row.email, "traveler"),
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      });
    }
    if (method === "POST" && path === "auth/logout")
      return ok({ ok: true }, undefined, 200, {
        "Set-Cookie": logout(request),
      });
    if (method === "GET" && path === "portal") {
      const user = requireSession(request, "traveler");
      const bookings = listBookings(user.email);
      const announcements = db()
        .prepare(
          "SELECT a.id,a.subject,a.message,a.created_at AS createdAt FROM announcements a WHERE a.retreat_id IN (SELECT retreat_id FROM bookings WHERE email=? AND status='confirmed') ORDER BY a.created_at DESC",
        )
        .all(user.email);
      const payments = db()
        .prepare(
          "SELECT p.id,p.booking_id AS bookingId,p.amount,p.refunded_amount AS refundedAmount,p.currency,p.created_at AS createdAt FROM payments p JOIN bookings b ON p.booking_id=b.id WHERE b.email=? ORDER BY p.created_at DESC",
        )
        .all(user.email);
      return ok({
        email: user.email,
        bookings: bookings.map(publicBooking),
        announcements,
        payments,
      });
    }
    if (method === "POST" && path === "portal/pay") {
      const user = requireSession(request, "traveler");
      const input = z
        .object({
          bookingId: z.string(),
          paymentChoice: z.enum(["balance", "next"]).default("next"),
        })
        .strict()
        .parse(await jsonBody(request));
      const booking = getBooking(input.bookingId);
      requireCondition(
        booking.email === user.email,
        "Registration not found.",
        404,
      );
      requireCondition(
        booking.status !== "cancelled",
        "This registration has been cancelled.",
        409,
      );
      requireCondition(
        paymentReady(),
        "Payments are unavailable. Please contact the retreat team.",
        503,
      );
      const retreat = getRetreat(booking.retreatId, true);
      requireCondition(retreat, "Retreat not found.", 404);
      if (
        booking.status === "pending" &&
        Date.parse(booking.holdExpiresAt) < Date.now()
      ) {
        transaction(() => {
          const current = getBooking(booking.id);
          const others = listBookings().filter(
            (b) =>
              b.id !== current.id &&
              b.retreatId === retreat.id &&
              reservesSeat(b),
          ).length;
          requireCondition(
            current.status === "pending" &&
              retreat.bookingEnabled &&
              retreat.status === "open" &&
              others < retreat.capacity,
            "Please contact the team to confirm availability before paying.",
            409,
          );
          current.holdExpiresAt = new Date(
            Date.now() + 45 * 60000,
          ).toISOString();
          saveBooking(current);
          Object.assign(booking, current);
        });
      }
      let amount = booking.totalAmount - booking.paidAmount;
      if (input.paymentChoice === "next") {
        let covered = booking.paidAmount;
        for (const p of booking.installments) {
          if (covered < p.amount) {
            amount = p.amount - covered;
            break;
          }
          covered -= p.amount;
        }
      }
      return ok({ checkoutUrl: await makeCheckout(booking, amount) });
    }
    if (method === "GET" && parts[0] === "portal" && parts[1] === "receipt") {
      const user = requireSession(request, "traveler");
      const row = db()
        .prepare(
          "SELECT p.id,p.amount,p.refunded_amount AS refundedAmount,p.currency,p.created_at AS createdAt,b.reference,b.email FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE p.id=? AND b.email=?",
        )
        .get(param(parts, 2), user.email);
      requireCondition(row, "Receipt not found.", 404);
      return ok({ brand: getSettings().brandName, ...row });
    }
    if (method === "POST" && path === "admin/login") {
      const input = z
        .object({ email, password: z.string().min(1).max(300) })
        .strict()
        .parse(await jsonBody(request));
      rateLimit(`admin:${requestKey(request)}`, 8, 15 * 60000);
      rateLimit(`admin-email:${hash(input.email)}`, 8, 15 * 60000);
      const validPassword = verifyPassword(input.password);
      requireCondition(
        validPassword &&
          input.email === (process.env.ADMIN_EMAIL || "").toLowerCase(),
        "The email or password is incorrect.",
        401,
      );
      audit(input.email, "login", "admin");
      return ok({ email: input.email, role: "admin" }, undefined, 200, {
        "Set-Cookie": createSession(input.email, "admin"),
      });
    }
    if (parts[0] === "admin") {
      const user = requireSession(request, "admin");
      const key = parts[1];
      const id = param(parts, 2);
      if (method === "GET" && key === "session") return ok(user);
      if (method === "GET" && key === "overview") {
        const bookings = listBookings();
        const active = bookings.filter(reservesSeat);
        const currencies: Record<
          string,
          { revenue: number; outstanding: number }
        > = {};
        for (const b of bookings) {
          currencies[b.currency] ??= { revenue: 0, outstanding: 0 };
          currencies[b.currency].revenue += b.paidAmount;
          if (active.some((item) => item.id === b.id))
            currencies[b.currency].outstanding += b.totalAmount - b.paidAmount;
        }
        const primary = Object.keys(currencies)[0] || "USD";
        return ok({
          bookings: bookings.length,
          travelers: active.length,
          rooms: new Set(
            active
              .filter((b) => b.roomId)
              .map((b) => b.retreatId + ":" + b.roomId),
          ).size,
          leads: (
            db().prepare("SELECT COUNT(*) AS n FROM leads").get() as {
              n: number;
            }
          ).n,
          revenue: currencies[primary]?.revenue || 0,
          outstanding: currencies[primary]?.outstanding || 0,
          currency: primary,
          currencies,
          paymentConfigured: paymentReady(),
          emailConfigured: Boolean(
            process.env.RESEND_API_KEY && process.env.EMAIL_FROM,
          ),
          policiesApproved: getSettings().policiesApproved,
        });
      }
      if (key === "retreats") {
        if (method === "GET") return ok(getRetreats(true));
        if (method === "DELETE") {
          requireCondition(
            !db()
              .prepare("SELECT id FROM bookings WHERE retreat_id=? LIMIT 1")
              .get(id),
            "Retreats with registrations cannot be deleted. Unpublish this retreat instead.",
            409,
          );
          db().prepare("DELETE FROM retreats WHERE id=?").run(id);
          audit(user.email, "delete-retreat", id);
          return ok({ ok: true });
        }
        if (method === "POST" || method === "PATCH") {
          const raw = await jsonBody(request);
          const previous = id ? getRetreat(id, true) : null;
          if (method === "PATCH")
            requireCondition(previous, "Retreat not found.", 404);
          const retreat = retreatSchema.parse({
            ...previous,
            ...raw,
            id: previous?.id || raw.id || randomUUID(),
          });
          requireCondition(
            !retreat.startDate ||
              !retreat.endDate ||
              retreat.startDate <= retreat.endDate,
            "End date must be after the start date.",
          );
          if (retreat.bookingEnabled)
            requireCondition(
              retreat.capacity > 0 &&
                retreat.hotelName &&
                retreat.startDate &&
                retreat.endDate &&
                (retreat.priceSingle || retreat.priceDouble) &&
                retreat.terms &&
                retreat.cancellationPolicy,
              "Add confirmed dates, hotel, capacity, prices, terms and cancellation policy before opening reservations.",
            );
          const existing = db()
            .prepare("SELECT id FROM retreats WHERE slug=? AND id!=?")
            .get(retreat.slug, retreat.id);
          requireCondition(
            !existing,
            "Another retreat already uses this URL slug.",
            409,
          );
          db()
            .prepare(
              "INSERT INTO retreats(id,slug,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,data=excluded.data",
            )
            .run(retreat.id, retreat.slug, JSON.stringify(retreat));
          audit(user.email, "save-retreat", retreat.id);
          return ok(retreat);
        }
      }
      if (key === "settings") {
        if (method === "GET") return ok(getSettings());
        if (method === "PATCH") {
          const settings = settingsSchema.parse({
            ...getSettings(),
            ...(await jsonBody(request)),
          });
          if (settings.policiesApproved)
            requireCondition(
              settings.privacyPolicy.length > 100 &&
                settings.bookingTerms.length > 100 &&
                settings.cancellationPolicy.length > 100,
              "Add your approved privacy, booking and cancellation policies first.",
            );
          db()
            .prepare("UPDATE settings SET data=? WHERE id=1")
            .run(JSON.stringify(settings));
          audit(user.email, "save-settings", "1");
          return ok(settings);
        }
      }
      if (key === "bookings") {
        if (method === "GET") return ok(listBookings().map(publicBooking));
        if (method === "PATCH") {
          const input = z
            .object({
              status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
              roomId: z.string().trim().max(100).nullable().optional(),
              notes: z.string().max(2000).optional(),
            })
            .strict()
            .parse(await jsonBody(request));
          getBooking(id);
          if (input.status === "cancelled") {
            requireCondition(
              !db()
                .prepare(
                  "SELECT id FROM checkout_attempts WHERE booking_id=? AND status='creating' AND created_at>?",
                )
                .get(id, new Date(Date.now() - 5 * 60000).toISOString()),
              "A checkout is being created. Please wait before cancelling.",
              409,
            );
            const attempts = db()
              .prepare(
                "SELECT provider_session FROM checkout_attempts WHERE booking_id=? AND status='open'",
              )
              .all(id) as { provider_session: string }[];
            for (const attempt of attempts) {
              try {
                await stripe().checkout.sessions.expire(
                  attempt.provider_session,
                );
              } catch {
                throw new ApiError(
                  409,
                  "A checkout may be completing. Wait for payment verification before cancelling.",
                );
              }
              db()
                .prepare(
                  "UPDATE checkout_attempts SET status='expired' WHERE provider_session=?",
                )
                .run(attempt.provider_session);
            }
          }
          const booking = transaction(() => {
            const current = getBooking(id);
            if (input.status === "confirmed") {
              requireCondition(
                current.paidAmount > 0,
                "A verified payment is required before confirming a registration.",
              );
              if (!reservesSeat(current)) {
                const retreat = getRetreat(current.retreatId, true)!;
                const others = listBookings().filter(
                  (b) =>
                    b.id !== current.id &&
                    b.retreatId === current.retreatId &&
                    reservesSeat(b),
                ).length;
                requireCondition(
                  others < retreat.capacity,
                  "This retreat has no available places to restore this registration.",
                  409,
                );
              }
            }
            if (input.status === "pending")
              requireCondition(
                current.paidAmount === 0,
                "A paid registration must remain confirmed or be cancelled.",
              );
            if (input.roomId) {
              const roommates = listBookings().filter(
                (b) =>
                  b.retreatId === current.retreatId &&
                  b.id !== current.id &&
                  b.status !== "cancelled" &&
                  b.roomId === input.roomId,
              );
              requireCondition(
                current.occupancy === "double"
                  ? roommates.length < 2 &&
                      roommates.every((b) => b.occupancy === "double")
                  : roommates.length === 0,
                "This room is full or its occupancy does not match.",
              );
            }
            Object.assign(current, input);
            if (current.status === "cancelled") current.roomId = null;
            saveBooking(current);
            return current;
          });
          audit(user.email, "update-booking", id);
          return ok(publicBooking(booking));
        }
      }
      if (key === "leads") {
        if (method === "GET") return ok(leads());
        if (method === "DELETE") {
          db().prepare("DELETE FROM leads WHERE id=?").run(id);
          return ok({ ok: true });
        }
      }
      if (key === "messages") {
        if (method === "GET") return ok(messages());
        if (method === "DELETE") {
          db().prepare("DELETE FROM messages WHERE id=?").run(id);
          return ok({ ok: true });
        }
      }
      if (method === "GET" && key === "export") {
        const type = url.searchParams.get("type");
        requireCondition(
          type === "bookings" || type === "leads",
          "Choose bookings or leads.",
        );
        const rows =
          type === "bookings"
            ? listBookings().map((b) => ({
                reference: b.reference,
                retreat: b.retreatName,
                firstName: b.firstName,
                lastName: b.lastName,
                email: b.email,
                phone: b.phone,
                country: b.country,
                occupancy: b.occupancy,
                roomId: b.roomId,
                roommateName: b.roommateName,
                totalMinorUnits: b.totalAmount,
                paidMinorUnits: b.paidAmount,
                currency: b.currency,
                status: b.status,
                createdAt: b.createdAt,
              }))
            : leads();
        const keys = rows.length
          ? Object.keys(rows[0])
          : ["reference", "email"];
        const csv = [
          keys.map(csvCell).join(","),
          ...rows.map((row) =>
            keys
              .map((k) => csvCell((row as Record<string, unknown>)[k]))
              .join(","),
          ),
        ].join("\r\n");
        audit(user.email, "export", type);
        return new Response("\uFEFF" + csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="riw-${type}-${now().slice(0, 10)}.csv"`,
            "Cache-Control": "no-store",
          },
        });
      }
      if (key === "promos") {
        if (method === "GET") return ok(getPromos());
        if (method === "POST") {
          const input = promoSchema.parse(await jsonBody(request));
          requireCondition(
            input.type !== "percent" || input.amount <= 100,
            "Percentage cannot exceed 100.",
          );
          requireCondition(
            !input.retreatId || getRetreat(input.retreatId, true),
            "Choose a valid retreat.",
          );
          requireCondition(
            !db().prepare("SELECT id FROM promos WHERE code=?").get(input.code),
            "This code already exists.",
            409,
          );
          const promo: Promo = { ...input, id: randomUUID(), uses: 0 };
          db()
            .prepare("INSERT INTO promos(id,code,data) VALUES(?,?,?)")
            .run(promo.id, promo.code, JSON.stringify(promo));
          audit(user.email, "create-promo", promo.id);
          return ok(promo);
        }
        if (method === "PATCH") {
          const input = z
            .object({ active: z.boolean() })
            .strict()
            .parse(await jsonBody(request));
          const promo = getPromos().find((p) => p.id === id);
          requireCondition(promo, "Promotional code not found.", 404);
          promo.active = input.active;
          db()
            .prepare("UPDATE promos SET data=? WHERE id=?")
            .run(JSON.stringify(promo), id);
          return ok(promo);
        }
      }
      if (key === "testimonials") {
        if (method === "GET") return ok(getTestimonials(true));
        if (method === "DELETE") {
          db().prepare("DELETE FROM testimonials WHERE id=?").run(id);
          return ok({ ok: true });
        }
        if (method === "POST" || method === "PATCH") {
          const raw = await jsonBody(request);
          const previous = id
            ? getTestimonials(true).find((t) => t.id === id)
            : null;
          if (method === "PATCH")
            requireCondition(previous, "Testimonial not found.", 404);
          const item = testimonialSchema.parse({
            ...previous,
            ...raw,
            id: previous?.id || raw.id || randomUUID(),
          });
          requireCondition(
            !item.published || item.consent,
            "Traveler permission is required before publication.",
          );
          db()
            .prepare(
              "INSERT INTO testimonials(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
            )
            .run(item.id, JSON.stringify(item));
          audit(user.email, "save-testimonial", item.id);
          return ok(item);
        }
      }
      if (method === "POST" && key === "upload")
        return ok(await upload(request));
      if (method === "GET" && key === "outbox")
        return ok(
          db()
            .prepare(
              `SELECT id,recipient AS "to",subject,status,attempts,created_at AS createdAt,last_error AS lastError${isDevPreview() ? ",body AS text" : ""} FROM outbox ORDER BY created_at DESC LIMIT 200`,
            )
            .all(),
        );
      if (method === "POST" && key === "announcements") {
        const input = z
          .object({
            retreatId: z.string(),
            subject: z.string().trim().min(3).max(200),
            message: z.string().trim().min(10).max(10000),
          })
          .strict()
          .parse(await jsonBody(request));
        requireCondition(
          getRetreat(input.retreatId, true),
          "Retreat not found.",
          404,
        );
        const id = randomUUID();
        db()
          .prepare(
            "INSERT INTO announcements(id,retreat_id,subject,message,created_at) VALUES(?,?,?,?,?)",
          )
          .run(id, input.retreatId, input.subject, input.message, now());
        const recipients = new Set(
          listBookings()
            .filter(
              (b) =>
                b.retreatId === input.retreatId && b.status === "confirmed",
            )
            .map((b) => b.email),
        );
        for (const recipient of recipients)
          queueMail(
            recipient,
            input.subject,
            `${input.message}\n\nYour traveler portal: ${appUrl()}/portal\nReign in Wealth Retreats`,
            `announcement:${id}:${recipient}`,
          );
        audit(user.email, "announce", input.retreatId);
        return ok({ id, recipients: recipients.size });
      }
      if (method === "POST" && key === "jobs") return ok(await runJobs());
    }
    throw new ApiError(404, "This endpoint was not found.");
  } catch (error) {
    if (error instanceof ZodError)
      return Response.json(
        {
          error: error.issues
            .map((i) => `${i.path.join(".") || "Field"}: ${i.message}`)
            .slice(0, 3)
            .join(" "),
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    if (
      parts.join("/") === "auth/verify" &&
      request.method === "GET" &&
      request.headers.get("accept")?.includes("text/html")
    )
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/portal?error=expired",
          "Cache-Control": "no-store",
        },
      });
    if (error instanceof ApiError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    console.error(
      "[retreat-api]",
      error instanceof Error ? error.name : "Unknown error",
    );
    return Response.json(
      {
        error:
          "We could not complete that request. Please try again or contact the retreat team.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
