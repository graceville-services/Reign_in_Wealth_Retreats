import { randomUUID } from "node:crypto";
import { db } from "./db";
import { appUrl } from "./security";
import { getRetreat } from "./data";
import type { Booking } from "../types";

export function queueMail(
  to: string,
  subject: string,
  body: string,
  dedupeKey: string,
) {
  const id = randomUUID();
  const result = db()
    .prepare(
      "INSERT OR IGNORE INTO outbox(id,dedupe_key,recipient,subject,body,status,attempts,created_at) VALUES(?,?,?,?,?,'pending',0,?)",
    )
    .run(id, dedupeKey, to, subject, body, new Date().toISOString());
  return result.changes ? id : null;
}
export function bookingWelcome(booking: Booking) {
  const schedule = booking.installments
    .map(
      (p) =>
        `${p.number}. ${new Intl.NumberFormat("en-US", { style: "currency", currency: booking.currency }).format(p.amount / 100)} — ${p.dueDate}`,
    )
    .join("\n");
  queueMail(
    booking.email,
    `Your ${booking.retreatName} retreat registration`,
    `Hello ${booking.firstName},\n\nYour individual traveler registration ${booking.reference} is confirmed following your payment.\n\nRetreat: ${booking.retreatName}\nOccupancy: ${booking.occupancy}\n\nPayment schedule:\n${schedule}\n\nInstallments are paid manually through your portal; your card is not automatically charged. Sign in for your balance, upcoming payments and retreat updates: ${appUrl()}/portal\n\nEach traveler registers separately, including anyone sharing your room. Your final arrangements and travel preparation updates will be shared in your portal.\n\nReign in Wealth Retreats`,
    `welcome:${booking.id}`,
  );
}
export async function flushOutbox(onlyId?: string) {
  let sent = 0,
    failed = 0;
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    return { sent, failed, emailConfigured: false };
  db()
    .prepare(
      "UPDATE outbox SET status='pending' WHERE status='sending' AND claimed_at < ?",
    )
    .run(new Date(Date.now() - 10 * 60000).toISOString());
  const rows = (
    onlyId
      ? db()
          .prepare(
            "SELECT * FROM outbox WHERE id=? AND status IN ('pending','failed') AND attempts<5",
          )
          .all(onlyId)
      : db()
          .prepare(
            "SELECT * FROM outbox WHERE status IN ('pending','failed') AND attempts<5 ORDER BY created_at LIMIT 30",
          )
          .all()
  ) as {
    id: string;
    recipient: string;
    subject: string;
    body: string;
    attempts: number;
  }[];
  // Claim each message atomically; provider idempotency keys protect a retry after a network interruption.
  for (const row of rows) {
    const claimed = db()
      .prepare(
        "UPDATE outbox SET status='sending',attempts=attempts+1,claimed_at=? WHERE id=? AND status IN ('pending','failed')",
      )
      .run(new Date().toISOString(), row.id);
    if (!claimed.changes) continue;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `riw-${row.id}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [row.recipient],
          subject: row.subject,
          text: row.body,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        throw new Error(`Email provider returned ${response.status}.`);
      db()
        .prepare(
          "UPDATE outbox SET status='sent',last_error=NULL,body=CASE WHEN dedupe_key LIKE 'magic:%' THEN '[Sign-in link redacted after delivery]' ELSE body END WHERE id=?",
        )
        .run(row.id);
      sent++;
    } catch (error) {
      db()
        .prepare("UPDATE outbox SET status='failed',last_error=? WHERE id=?")
        .run(
          error instanceof Error ? error.message : "Email delivery failed.",
          row.id,
        );
      failed++;
    }
  }
  return { sent, failed, emailConfigured: true };
}
export async function runJobs() {
  const { reconcileCheckouts } = await import("./payments");
  const reconciliation = await reconcileCheckouts();
  const now = new Date();
  let queued = 0;
  const bookings = (
    db()
      .prepare("SELECT data FROM bookings WHERE status='confirmed'")
      .all() as { data: string }[]
  ).map((r) => JSON.parse(r.data) as Booking);
  for (const b of bookings) {
    let paid = b.paidAmount;
    for (const part of b.installments) {
      const remaining = Math.max(0, part.amount - paid);
      paid = Math.max(0, paid - part.amount);
      const days = Math.ceil(
        (Date.parse(part.dueDate) - now.getTime()) / 86400000,
      );
      if (remaining > 0 && days <= 7 && days >= -30) {
        const week = Math.floor(now.getTime() / (7 * 86400000));
        if (
          queueMail(
            b.email,
            `Payment reminder: ${b.retreatName}`,
            `Hello ${b.firstName},\n\nYour installment for ${b.retreatName} is due ${part.dueDate}. The amount remaining for this installment is ${new Intl.NumberFormat("en-US", { style: "currency", currency: b.currency }).format(remaining / 100)}.\n\nView your schedule and make your payment securely: ${appUrl()}/portal\n\nYour card is not automatically charged. Reference: ${b.reference}\nReign in Wealth Retreats`,
            `reminder:${b.id}:${part.number}:${week}`,
          )
        )
          queued++;
      }
    }
    const retreat = getRetreat(b.retreatId, true);
    if (retreat?.startDate) {
      const days = Math.ceil(
        (Date.parse(retreat.startDate) - now.getTime()) / 86400000,
      );
      const milestone = [1, 7, 30].find((m) => days <= m && days > 0);
      if (
        milestone &&
        queueMail(
          b.email,
          `Preparing for ${b.retreatName}`,
          `Hello ${b.firstName},\n\nYour retreat starts ${retreat.dateLabel}. Please review your passport, entry requirements, insurance, flight and transfer arrangements. Your destination notes:\n\n${retreat.travelNotes.join("\n\n")}\n\nSign in for retreat updates and your payment schedule: ${appUrl()}/portal\n\nReign in Wealth Retreats`,
          `departure:${b.id}:${milestone}`,
        )
      )
        queued++;
    }
  }
  return { queued, ...(await flushOutbox()), reconciliation };
}
