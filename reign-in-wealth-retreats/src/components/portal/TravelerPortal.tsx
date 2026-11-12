"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Compass,
  CreditCard,
  Download,
  Inbox,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UsersRound,
} from "lucide-react";
import type { Booking } from "@/lib/types";
import { money } from "@/lib/types";
import {
  api,
  json,
  prettyStatus,
  formatDate,
  ApiError,
} from "@/components/admin/api";
import Dialog from "@/components/admin/Dialog";

type Payment = {
  id: string;
  bookingId: string;
  amount: number;
  refundedAmount?: number;
  currency: string;
  createdAt: string;
};
type PortalData = {
  email: string;
  bookings: Booking[];
  payments: Payment[];
  announcements: {
    id: string;
    subject: string;
    message: string;
    createdAt: string;
  }[];
};
export default function TravelerPortal() {
  const query = useSearchParams();
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState("");
  const [receipt, setReceipt] = useState<{
    payment: Payment;
    booking: Booking;
  } | null>(null);
  const closeReceipt = useCallback(() => setReceipt(null), []);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<PortalData>("/api/portal");
      setPortal(result);
      setError("");
    } catch (e) {
      setPortal(null);
      if (!(e instanceof ApiError) || e.status !== 401)
        setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function requestSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking("signin");
    setError("");
    try {
      const result = await api<{ sent: boolean; previewUrl?: string }>(
        "/api/auth/traveler",
        json("POST", { email }),
      );
      setSent(true);
      setPreviewUrl(result.previewUrl || "");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking("");
    }
  }
  async function logout() {
    setWorking("logout");
    try {
      await api("/api/auth/logout", json("POST", {}));
      setPortal(null);
      setSent(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking("");
    }
  }
  async function pay(booking: Booking, paymentChoice: "next" | "balance") {
    setWorking(booking.id);
    setError("");
    try {
      const result = await api<{ checkoutUrl: string }>(
        "/api/portal/pay",
        json("POST", { bookingId: booking.id, paymentChoice }),
      );
      window.location.assign(result.checkoutUrl);
    } catch (e) {
      setError((e as Error).message);
      setWorking("");
    }
  }
  async function openReceipt(payment: Payment, booking: Booking) {
    setWorking(payment.id);
    setError("");
    try {
      await api(`/api/portal/receipt/${payment.id}`);
      setReceipt({ payment, booking });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking("");
    }
  }
  const paymentReturn = [...query.values()].some(
    (value) => value === "success" || value === "paid" || value === "received",
  );
  return (
    <main className="portal-shell">
      {loading ? (
        <div className="dash-loading">
          <LoaderCircle className="dash-spin" size={20} />
          Opening your traveler portal…
        </div>
      ) : !portal ? (
        <div className="dash-login">
          <div className="dash-login-icon">
            <LockKeyhole size={22} />
          </div>
          <p className="dash-kicker">Your journey, beautifully organized</p>
          <h1>Welcome to your traveler portal.</h1>
          <p className="dash-muted">
            Your reservations, payment schedule, and retreat updates, together
            in one place.
          </p>
          {error && (
            <div className="dash-alert error" role="alert">
              <CircleAlert size={17} />
              {error}
            </div>
          )}
          {query.get("error") && (
            <div className="dash-alert warning">
              <CircleAlert size={17} />
              That sign-in link has expired or has already been used. Request a
              fresh link below.
            </div>
          )}
          {sent ? (
            <>
              <div className="dash-alert" role="status">
                <Mail size={19} />
                <p>
                  If your email is eligible, a secure sign-in link has been
                  requested for <strong>{email}</strong>. Check your inbox and
                  spam folder.
                </p>
              </div>
              {previewUrl && (
                <div className="dash-alert warning">
                  <CircleAlert size={17} />
                  <p>
                    <strong>Local development preview</strong>
                    <br />
                    This secure link is available only because local development
                    preview mode is enabled.{" "}
                    <a href={previewUrl}>Open the secure preview link</a>.
                  </p>
                </div>
              )}
              <button
                className="dash-btn secondary"
                onClick={() => {
                  setSent(false);
                  setPreviewUrl("");
                }}
              >
                Use a different email
              </button>
            </>
          ) : (
            <form onSubmit={requestSignIn}>
              <label className="dash-field">
                <span>Your registration email</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={254}
                />
              </label>
              <button
                className="dash-btn"
                type="submit"
                disabled={working === "signin"}
              >
                {working === "signin" ? (
                  <LoaderCircle size={15} className="dash-spin" />
                ) : (
                  <Mail size={15} />
                )}{" "}
                Send my sign-in link <ArrowRight size={15} />
              </button>
            </form>
          )}
          <p className="dash-login-foot">
            <ShieldCheck
              size={14}
              style={{ verticalAlign: "middle", marginRight: 6 }}
            />
            No password to remember. Your sign-in link is private and expires
            automatically.
          </p>
          <Link href="/retreats" className="dash-link">
            Discover your next retreat
          </Link>
        </div>
      ) : (
        <>
          <header className="portal-greeting">
            <div>
              <p className="dash-kicker">Traveler portal</p>
              <h1>
                {portal.bookings[0]?.firstName
                  ? `Welcome back, ${portal.bookings[0].firstName}.`
                  : "Your next chapter starts here."}
              </h1>
              <p className="dash-muted">{portal.email}</p>
            </div>
            <div className="dash-row">
              <button
                className="dash-btn secondary"
                onClick={() => void load()}
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button
                className="dash-btn secondary"
                onClick={logout}
                disabled={working === "logout"}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </header>
          {error && (
            <div className="dash-alert error" role="alert">
              <CircleAlert size={17} />
              {error}
            </div>
          )}
          {paymentReturn && (
            <div className="dash-alert" role="status">
              <CreditCard size={18} />
              <p>
                You have returned from checkout. Payment status below updates
                only after Stripe confirms your payment. Use Refresh if your
                latest payment is still being processed.
              </p>
            </div>
          )}
          <div className="portal-intro">
            <Compass size={38} strokeWidth={1.2} />
            <div>
              <h3>More than a destination. Your next experience.</h3>
              <p>
                Keep your retreat details close and your sense of possibility
                closer.
              </p>
            </div>
          </div>
          <div className="dash-section-head">
            <h2>Your reservations</h2>
            <Link href="/retreats" className="dash-link">
              Explore more experiences
            </Link>
          </div>
          {!portal.bookings.length ? (
            <div className="dash-empty">
              <Ticket size={40} />
              <h3>Your world is waiting.</h3>
              <p>
                You do not have a retreat reservation linked to this email yet.
                Explore the collection and begin your next experience.
              </p>
              <Link href="/retreats" className="dash-btn">
                Explore our retreats <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            portal.bookings.map((booking) => {
              const balance = Math.max(
                0,
                booking.totalAmount - booking.paidAmount,
              );
              const percentage =
                booking.totalAmount > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (booking.paidAmount / booking.totalAmount) * 100,
                      ),
                    )
                  : 0;
              const next = booking.installments?.find((p) => !p.paid);
              let covered = booking.paidAmount;
              let nextAmount = balance;
              for (const payment of booking.installments || []) {
                if (covered < payment.amount) {
                  nextAmount = payment.amount - covered;
                  break;
                }
                covered -= payment.amount;
              }
              const payments = (portal.payments || []).filter(
                (p) => p.bookingId === booking.id,
              );
              return (
                <article className="portal-booking" key={booking.id}>
                  <div className="portal-booking-head">
                    <div>
                      <p className="dash-kicker">
                        Reservation {booking.reference}
                      </p>
                      <h2>{booking.retreatName}</h2>
                      <p className="dash-small dash-muted">
                        {booking.firstName} {booking.lastName} · One traveler ·{" "}
                        {booking.occupancy} occupancy
                      </p>
                    </div>
                    <span
                      className={`dash-badge ${booking.status === "cancelled" ? "red" : booking.status === "pending" ? "gold" : ""}`}
                    >
                      {prettyStatus(booking.status)}
                    </span>
                  </div>
                  <div className="portal-costs">
                    <div>
                      <small>Retreat package</small>
                      <strong>
                        {money(booking.totalAmount, booking.currency)}
                      </strong>
                    </div>
                    <div>
                      <small>Payments received</small>
                      <strong>
                        {money(booking.paidAmount, booking.currency)}
                      </strong>
                    </div>
                    <div>
                      <small>Remaining balance</small>
                      <strong>{money(balance, booking.currency)}</strong>
                    </div>
                  </div>
                  <div
                    className="portal-progress"
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Package balance paid"
                  >
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="dash-row dash-space">
                    <div className="booking-meta">
                      <UsersRound size={15} />
                      {booking.roomId
                        ? `Room assignment: ${booking.roomId}`
                        : "Room assignment to be confirmed"}
                    </div>
                    <Link
                      className="dash-link"
                      href={`/retreats/${booking.retreatSlug}`}
                    >
                      View retreat details
                    </Link>
                  </div>
                  {booking.status !== "cancelled" && balance > 0 && (
                    <div className="portal-next">
                      <div>
                        <p>
                          <strong>
                            {next
                              ? `Next payment · ${money(nextAmount, booking.currency)}`
                              : "Complete your balance"}
                          </strong>
                          {next
                            ? `Due ${formatDate(next.dueDate)}`
                            : "Your remaining balance is ready to pay securely."}
                        </p>
                      </div>
                      <div className="dash-row">
                        <button
                          className="dash-btn"
                          disabled={working === booking.id}
                          onClick={() => void pay(booking, "next")}
                        >
                          {working === booking.id ? (
                            <LoaderCircle size={14} className="dash-spin" />
                          ) : (
                            <CreditCard size={14} />
                          )}{" "}
                          {next ? "Pay next installment" : "Pay balance"}
                        </button>
                        {next && nextAmount < balance && (
                          <button
                            className="dash-link"
                            disabled={working === booking.id}
                            onClick={() => void pay(booking, "balance")}
                          >
                            Pay full balance
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {balance === 0 && booking.paidAmount > 0 && (
                    <div className="dash-alert" style={{ margin: "20px 0 0" }}>
                      <CheckCircle2 size={17} />
                      Your package is paid in full. Your next experience is
                      getting closer.
                    </div>
                  )}
                  {!!booking.installments?.length && (
                    <details>
                      <summary>View your payment schedule</summary>
                      <div className="portal-schedule">
                        {booking.installments.map((p) => (
                          <div key={p.number}>
                            <small>
                              Payment {p.number} · {formatDate(p.dueDate)}
                            </small>
                            <strong>{money(p.amount, booking.currency)}</strong>
                            <span
                              className={`dash-badge ${p.paid ? "" : "gold"}`}
                            >
                              {p.paid ? "Received" : "Scheduled"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {!!payments.length && (
                    <details>
                      <summary>Payment receipts</summary>
                      <div className="portal-receipts">
                        {payments.map((payment) => (
                          <div key={payment.id}>
                            <div>
                              {money(payment.amount, payment.currency)}
                              <small>
                                {formatDate(payment.createdAt)}
                                {payment.refundedAmount
                                  ? ` · ${money(payment.refundedAmount, payment.currency)} refunded`
                                  : ""}
                              </small>
                            </div>
                            <button
                              className="dash-link"
                              onClick={() => void openReceipt(payment, booking)}
                              disabled={working === payment.id}
                            >
                              View receipt
                            </button>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {booking.status === "cancelled" && (
                    <p className="dash-small dash-muted dash-topline">
                      This reservation has been cancelled. Any refund is managed
                      separately under the retreat’s cancellation terms. Contact
                      the team for assistance.
                    </p>
                  )}
                </article>
              );
            })
          )}
          <div className="portal-mini-grid" style={{ marginTop: 32 }}>
            <section className="dash-panel">
              <div className="dash-panel-head">
                <h3>Notes from your retreat team</h3>
                <Bell size={19} color="#a28b61" />
              </div>
              {portal.announcements?.length ? (
                <ul className="dash-list">
                  {portal.announcements.map((a) => (
                    <li key={a.id} style={{ display: "block" }}>
                      <strong>{a.subject}</strong>
                      <small>{formatDate(a.createdAt)}</small>
                      <p
                        className="dash-small"
                        style={{ whiteSpace: "pre-wrap", margin: "12px 0 0" }}
                      >
                        {a.message}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dash-small dash-muted">
                  Your team’s trip announcements and preparation updates will
                  appear here when available.
                </p>
              )}
            </section>
            <section className="dash-panel">
              <h3>A little preparation goes a long way.</h3>
              <div className="dash-proof-row">
                <CalendarDays size={18} />
                <span>
                  <strong>Keep your travel dates close</strong>Review your
                  destination page for confirmed details and preparation notes.
                </span>
              </div>
              <div className="dash-proof-row">
                <Inbox size={18} />
                <span>
                  <strong>Watch your inbox</strong>Your team will share payment
                  and retreat updates by email.
                </span>
              </div>
              <Link href="/contact" className="dash-btn secondary">
                Ask our retreat team <ArrowRight size={14} />
              </Link>
            </section>
          </div>
        </>
      )}
      {receipt && (
        <Dialog
          title="Payment receipt"
          subtitle={receipt.booking.reference}
          onClose={closeReceipt}
        >
          <div className="portal-receipt-logo">Reign in Wealth Retreats</div>
          <div className="portal-receipt-mark">
            <CheckCircle2 size={16} />
            Payment received
          </div>
          <div className="portal-receipt-amount">
            {money(receipt.payment.amount, receipt.payment.currency)}
          </div>
          {!!receipt.payment.refundedAmount && (
            <div className="dash-alert warning">
              <CircleAlert size={16} />A refund of{" "}
              {money(receipt.payment.refundedAmount, receipt.payment.currency)}{" "}
              has been recorded against this payment.
            </div>
          )}
          <dl className="dash-definition">
            <div>
              <dt>Traveler</dt>
              <dd>
                {receipt.booking.firstName} {receipt.booking.lastName}
              </dd>
            </div>
            <div>
              <dt>Retreat</dt>
              <dd>{receipt.booking.retreatName}</dd>
            </div>
            <div>
              <dt>Payment date</dt>
              <dd>{formatDate(receipt.payment.createdAt)}</dd>
            </div>
            <div>
              <dt>Reservation</dt>
              <dd>{receipt.booking.reference}</dd>
            </div>
            <div>
              <dt>Payment reference</dt>
              <dd style={{ fontSize: 10 }}>{receipt.payment.id}</dd>
            </div>
            <div>
              <dt>Currency</dt>
              <dd>{receipt.payment.currency}</dd>
            </div>
          </dl>
          <p className="dash-small dash-muted">
            This receipt records a payment toward your retreat package. Your
            traveler portal shows your current remaining balance.
          </p>
          <div className="dash-form-actions">
            <button className="dash-btn" onClick={() => window.print()}>
              <Download size={14} />
              Print or save receipt
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
