"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Globe2,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { Retreat, SiteSettings, Booking } from "@/lib/types";
import { money } from "@/lib/types";
import { api, json, formatDate } from "@/components/admin/api";

type Quote = {
  subtotal: number;
  discount: number;
  totalAmount: number;
  amountDue: number;
  currency: string;
  installments: Booking["installments"];
  canBook: boolean;
  reason?: string;
};
type Traveler = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  occupancy: "single" | "double";
  roommateName: string;
  roommateEmail: string;
  paymentChoice: "deposit" | "full" | "installments";
  promoCode: string;
  termsAccepted: boolean;
  marketingConsent: boolean;
  notes: string;
  website: string;
};
const initial: Traveler = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  occupancy: "double",
  roommateName: "",
  roommateEmail: "",
  paymentChoice: "deposit",
  promoCode: "",
  termsAccepted: false,
  marketingConsent: false,
  notes: "",
  website: "",
};

export default function ReservationForm() {
  const query = useSearchParams();
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [slug, setSlug] = useState(query.get("retreat") || "dubai-2026");
  const [traveler, setTraveler] = useState(initial);
  const [step, setStep] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [joined, setJoined] = useState(false);
  const [interest, setInterest] = useState({
    name: "",
    email: "",
    consent: false,
  });
  const retreat = retreats.find((r) => r.slug === slug);
  const available =
    !!retreat &&
    retreat.bookingEnabled &&
    retreat.status === "open" &&
    settings?.policiesApproved &&
    ((retreat.priceDouble ?? 0) > 0 || (retreat.priceSingle ?? 0) > 0);
  const update = <K extends keyof Traveler>(key: K, value: Traveler[K]) =>
    setTraveler((old) => ({ ...old, [key]: value }));
  useEffect(() => {
    let alive = true;
    Promise.all([
      api<Retreat[]>("/api/retreats"),
      api<SiteSettings>("/api/settings"),
    ])
      .then(([r, s]) => {
        if (alive) {
          setRetreats(r);
          setSettings(s);
          if (!r.some((item) => item.slug === slug)) setSlug(r[0]?.slug || "");
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setStep(0);
    setJoined(false);
    setError("");
    setQuote(null);
    if (retreat && !retreat.priceDouble && retreat.priceSingle)
      setTraveler((t) => ({ ...t, occupancy: "single" }));
  }, [slug, retreat]);
  useEffect(() => {
    if (!available || !retreat) return;
    let alive = true;
    setQuoteError("");
    setQuote(null);
    const timer = setTimeout(() => {
      void api<Quote>(
        "/api/bookings/quote",
        json("POST", {
          retreatSlug: slug,
          occupancy: traveler.occupancy,
          paymentChoice: traveler.paymentChoice,
          promoCode: traveler.promoCode,
        }),
      )
        .then((q) => {
          if (alive) setQuote(q);
        })
        .catch((e) => {
          if (alive) {
            setQuote(null);
            setQuoteError(e.message);
          }
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [
    available,
    slug,
    traveler.occupancy,
    traveler.paymentChoice,
    traveler.promoCode,
    retreat,
  ]);
  async function joinInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      await api(
        "/api/leads",
        json("POST", { ...interest, destination: slug, source: "waitlist" }),
      );
      setJoined(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }
  async function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setWorking(true);
    try {
      const result = await api<{ booking: Booking; checkoutUrl: string }>(
        "/api/bookings",
        json("POST", { ...traveler, retreatSlug: slug }),
      );
      if (!result.checkoutUrl)
        throw new Error(
          "A secure payment link could not be created. Your card has not been charged.",
        );
      window.location.assign(result.checkoutUrl);
    } catch (e) {
      setError((e as Error).message);
      setWorking(false);
    }
  }
  if (loading)
    return (
      <main className="booking-shell">
        <div className="dash-loading">
          <LoaderCircle size={20} className="dash-spin" /> Preparing your
          experience…
        </div>
      </main>
    );
  if (!retreat)
    return (
      <main className="booking-shell">
        <div className="dash-empty">
          <Globe2 size={38} />
          <h1>Your next chapter awaits.</h1>
          <p>{error || "Our next retreat collection is being prepared."}</p>
          <Link className="dash-btn" href="/retreats">
            Explore the collection <ArrowRight size={15} />
          </Link>
        </div>
      </main>
    );
  return (
    <main className="booking-shell">
      <div className="booking-breadcrumb">
        <Link href="/retreats">Our retreats</Link>
        <ChevronRight size={12} />
        <span>{retreat.destination}</span>
        <ChevronRight size={12} />
        <span>{available ? "Reserve" : "Stay in the know"}</span>
      </div>
      <header className="booking-head">
        <p className="dash-kicker">Your next experience awaits</p>
        <h1>
          {available ? "Make room for more." : "Be part of what comes next."}
        </h1>
        <p>
          {available
            ? "A remarkable destination. Meaningful connection. Your journey starts with one simple registration."
            : "Leave your details and be the first to hear when the complete experience, packages, and reservation details are ready."}
        </p>
      </header>
      <div className="booking-layout">
        <div className="booking-card">
          {retreats.length > 1 && (
            <label className="dash-field booking-select">
              <span>Your destination</span>
              <select
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                aria-label="Choose your retreat"
              >
                {retreats.map((r) => (
                  <option key={r.id} value={r.slug}>
                    {r.destination} · {r.dateLabel}
                  </option>
                ))}
              </select>
            </label>
          )}
          {error && (
            <div className="dash-alert error" role="alert">
              <CircleAlert size={17} />
              <p>{error}</p>
            </div>
          )}
          {!available ? (
            joined ? (
              <div className="booking-success" role="status">
                <CheckCircle2 size={46} />
                <p className="dash-kicker" style={{ justifyContent: "center" }}>
                  You are on the list
                </p>
                <h2>Consider this your first step.</h2>
                <p className="dash-muted">
                  Your interest in {retreat.destination} has been received. We
                  will share confirmed retreat details with{" "}
                  <strong>{interest.email}</strong>.
                </p>
                <p className="dash-small dash-muted">
                  This is an expression of interest. No payment has been taken
                  and no place has been reserved.
                </p>
                <Link href="/retreats" className="dash-btn secondary">
                  Explore more destinations <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <form onSubmit={joinInterest}>
                <p className="dash-kicker">
                  <Sparkles size={14} />{" "}
                  {retreat.status === "sold_out"
                    ? "Join the waiting list"
                    : "First to know"}
                </p>
                <h2>{retreat.destination}, on your horizon.</h2>
                <p className="dash-muted">
                  {retreat.status === "sold_out"
                    ? "This departure is currently full. Join the waiting list to hear about openings and future dates."
                    : "We are curating the finer details. Join the destination list for package announcements and reservation updates."}
                </p>
                <label className="dash-field">
                  <span>Your name</span>
                  <input
                    autoComplete="name"
                    value={interest.name}
                    onChange={(e) =>
                      setInterest({ ...interest, name: e.target.value })
                    }
                    placeholder="First and last name"
                    required
                    maxLength={120}
                  />
                </label>
                <label className="dash-field">
                  <span>Email address</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={interest.email}
                    onChange={(e) =>
                      setInterest({ ...interest, email: e.target.value })
                    }
                    placeholder="you@example.com"
                    required
                    maxLength={254}
                  />
                </label>
                <label className="dash-check">
                  <input
                    type="checkbox"
                    checked={interest.consent}
                    onChange={(e) =>
                      setInterest({ ...interest, consent: e.target.checked })
                    }
                    required
                  />
                  <span>
                    I would like to receive updates about this retreat. I have
                    read the <Link href="/privacy">privacy policy</Link> and can
                    unsubscribe at any time.
                  </span>
                </label>
                <button className="dash-btn" disabled={working} type="submit">
                  {working ? (
                    <LoaderCircle size={15} className="dash-spin" />
                  ) : null}{" "}
                  Join the {retreat.destination} list <ArrowRight size={15} />
                </button>
                <div className="booking-trust">
                  <ShieldCheck size={15} />
                  <span>No deposit or payment is collected at this stage.</span>
                </div>
              </form>
            )
          ) : (
            <>
              <div className="booking-steps" aria-label="Reservation progress">
                {["Your details", "Your room", "Payment", "Review"].map(
                  (label, index) => (
                    <div
                      key={label}
                      className={`booking-step ${index === step ? "active" : index < step ? "complete" : ""}`}
                      aria-current={index === step ? "step" : undefined}
                    >
                      <span>
                        {index < step ? (
                          <Check size={13} />
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </span>
                      {label}
                    </div>
                  ),
                )}
              </div>
              <form onSubmit={advance}>
                {step === 0 && (
                  <>
                    <h2>A little about you.</h2>
                    <p className="dash-muted">
                      Each traveler registers individually, including guests
                      sharing a room.
                    </p>
                    <div className="dash-two">
                      <label className="dash-field">
                        <span>First name</span>
                        <input
                          autoComplete="given-name"
                          value={traveler.firstName}
                          onChange={(e) => update("firstName", e.target.value)}
                          required
                          maxLength={80}
                        />
                      </label>
                      <label className="dash-field">
                        <span>Last name</span>
                        <input
                          autoComplete="family-name"
                          value={traveler.lastName}
                          onChange={(e) => update("lastName", e.target.value)}
                          required
                          maxLength={80}
                        />
                      </label>
                    </div>
                    <label className="dash-field">
                      <span>Email address</span>
                      <input
                        type="email"
                        autoComplete="email"
                        value={traveler.email}
                        onChange={(e) => update("email", e.target.value)}
                        required
                        maxLength={254}
                      />
                      <small>
                        Your confirmation and traveler portal access will use
                        this email.
                      </small>
                    </label>
                    <div className="dash-two">
                      <label className="dash-field">
                        <span>Phone with country code</span>
                        <input
                          type="tel"
                          autoComplete="tel"
                          value={traveler.phone}
                          onChange={(e) => update("phone", e.target.value)}
                          placeholder="+1 555 000 0000"
                          required
                          maxLength={30}
                        />
                      </label>
                      <label className="dash-field">
                        <span>Country of residence</span>
                        <input
                          autoComplete="country-name"
                          value={traveler.country}
                          onChange={(e) => update("country", e.target.value)}
                          placeholder="Your country"
                          required
                          maxLength={80}
                        />
                      </label>
                    </div>
                    <div style={{ display: "none" }} aria-hidden="true">
                      <label>
                        Website
                        <input
                          tabIndex={-1}
                          autoComplete="off"
                          value={traveler.website}
                          onChange={(e) => update("website", e.target.value)}
                        />
                      </label>
                    </div>
                    <label className="dash-check">
                      <input
                        type="checkbox"
                        checked={traveler.marketingConsent}
                        onChange={(e) =>
                          update("marketingConsent", e.target.checked)
                        }
                      />
                      <span>
                        Keep me inspired with news of future Reign in Wealth
                        experiences. Optional.
                      </span>
                    </label>
                  </>
                )}
                {step === 1 && (
                  <>
                    <h2>Your space to unwind.</h2>
                    <p className="dash-muted">
                      Prices are per traveler. A double occupancy booking is one
                      traveler’s place in a shared room.
                    </p>
                    {(["double", "single"] as const).map((occupancy) => {
                      const price =
                        occupancy === "double"
                          ? retreat.priceDouble
                          : retreat.priceSingle;
                      if (!price) return null;
                      return (
                        <label
                          className={`booking-choice ${traveler.occupancy === occupancy ? "selected" : ""}`}
                          key={occupancy}
                        >
                          <input
                            type="radio"
                            name="occupancy"
                            value={occupancy}
                            checked={traveler.occupancy === occupancy}
                            onChange={() => update("occupancy", occupancy)}
                          />
                          <span>
                            <strong>
                              {occupancy === "double"
                                ? "Double occupancy"
                                : "Single occupancy"}
                            </strong>
                            <small>
                              {occupancy === "double"
                                ? "Share a room with one other registered traveler."
                                : "Enjoy a room to yourself for the retreat."}
                            </small>
                          </span>
                          <b>{money(price, retreat.currency)}</b>
                        </label>
                      );
                    })}
                    {traveler.occupancy === "double" && (
                      <div className="dash-topline">
                        <h3>Traveling with someone?</h3>
                        <p className="dash-small dash-muted">
                          Optional. Your preferred roommate must complete a
                          separate registration. Our team will confirm the room
                          assignment.
                        </p>
                        <label className="dash-field">
                          <span>Preferred roommate’s full name</span>
                          <input
                            value={traveler.roommateName}
                            onChange={(e) =>
                              update("roommateName", e.target.value)
                            }
                            maxLength={160}
                          />
                        </label>
                        <label className="dash-field">
                          <span>Preferred roommate’s email</span>
                          <input
                            type="email"
                            value={traveler.roommateEmail}
                            onChange={(e) =>
                              update("roommateEmail", e.target.value)
                            }
                            maxLength={254}
                          />
                        </label>
                      </div>
                    )}
                    <div className="dash-notice">
                      <UsersRound
                        size={15}
                        style={{ verticalAlign: "middle", marginRight: 7 }}
                      />
                      This registration is for <strong>one traveler</strong>.
                      Room requests are confirmed separately.
                    </div>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h2>A plan that fits your journey.</h2>
                    <p className="dash-muted">
                      Choose how you would like to pay. All payments are
                      processed securely through Stripe.
                    </p>
                    {(["deposit", "full", "installments"] as const)
                      .filter(
                        (choice) =>
                          choice !== "installments" ||
                          retreat.installmentCount > 1,
                      )
                      .map((choice) => (
                        <label
                          className={`booking-choice ${traveler.paymentChoice === choice ? "selected" : ""}`}
                          key={choice}
                        >
                          <input
                            type="radio"
                            name="paymentChoice"
                            checked={traveler.paymentChoice === choice}
                            onChange={() => update("paymentChoice", choice)}
                          />
                          <span>
                            <strong>
                              {choice === "deposit"
                                ? "Secure with a deposit"
                                : choice === "full"
                                  ? "Pay in full"
                                  : "Choose a payment plan"}
                            </strong>
                            <small>
                              {choice === "deposit"
                                ? "Pay your deposit now and the remaining balance by the stated due date."
                                : choice === "full"
                                  ? "Settle your retreat package in one payment."
                                  : `Spread your package across ${retreat.installmentCount} scheduled payments. Payments are made by you through your portal; cards are not charged automatically.`}
                            </small>
                          </span>
                          {choice === "deposit" && retreat.depositAmount ? (
                            <b>
                              {money(retreat.depositAmount, retreat.currency)}
                            </b>
                          ) : null}
                        </label>
                      ))}
                    <label className="dash-field" style={{ marginTop: 23 }}>
                      <span>Promotional code, if you have one</span>
                      <input
                        value={traveler.promoCode}
                        onChange={(e) =>
                          update(
                            "promoCode",
                            e.target.value.trim().toUpperCase(),
                          )
                        }
                        placeholder="Enter code"
                        autoComplete="off"
                        maxLength={40}
                      />
                    </label>
                    {quoteError && (
                      <div className="dash-alert error" role="alert">
                        <CircleAlert size={16} />
                        {quoteError}
                      </div>
                    )}
                    {quote && !quote.canBook && (
                      <div className="dash-alert warning">
                        <CircleAlert size={16} />
                        <p>
                          {quote.reason ||
                            "This payment option is not available yet."}{" "}
                          <Link href="/contact">Contact our retreat team</Link>.
                        </p>
                      </div>
                    )}
                    {quote && (
                      <div
                        className="dash-panel"
                        style={{ background: "#f7f8f2", marginTop: 20 }}
                      >
                        <p className="dash-kicker">Your payment schedule</p>
                        {quote.installments.map((payment) => (
                          <div className="booking-price" key={payment.number}>
                            <span>
                              {payment.number === 1
                                ? "Due today"
                                : `Payment ${payment.number} · ${formatDate(payment.dueDate)}`}
                            </span>
                            <strong>
                              {money(payment.amount, quote.currency)}
                            </strong>
                          </div>
                        ))}
                        <p className="booking-cost-note">
                          Your balance and payment links will be available in
                          your traveler portal.
                        </p>
                      </div>
                    )}
                  </>
                )}
                {step === 3 && (
                  <>
                    <h2>The beginning of something more.</h2>
                    <p className="dash-muted">
                      Review your details before continuing to secure payment.
                    </p>
                    <dl className="dash-definition">
                      <div>
                        <dt>Traveler</dt>
                        <dd>
                          {traveler.firstName} {traveler.lastName}
                        </dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{traveler.email}</dd>
                      </div>
                      <div>
                        <dt>Destination</dt>
                        <dd>{retreat.destination}</dd>
                      </div>
                      <div>
                        <dt>Travel dates</dt>
                        <dd>{retreat.dateLabel}</dd>
                      </div>
                      <div>
                        <dt>Room preference</dt>
                        <dd>
                          {traveler.occupancy === "double"
                            ? "Double occupancy · 1 traveler"
                            : "Single occupancy · 1 traveler"}
                        </dd>
                      </div>
                      <div>
                        <dt>Payment preference</dt>
                        <dd>
                          {traveler.paymentChoice === "full"
                            ? "Full payment"
                            : traveler.paymentChoice === "deposit"
                              ? "Deposit + balance"
                              : "Installment plan"}
                        </dd>
                      </div>
                    </dl>
                    <label className="dash-field">
                      <span>
                        Anything you would like our team to know? Optional.
                      </span>
                      <textarea
                        value={traveler.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        placeholder="Room preferences or questions for the retreat team. Please do not include passport, card, or sensitive medical information."
                        maxLength={2000}
                      />
                    </label>
                    <details className="dash-topline">
                      <summary className="dash-small">
                        Your retreat’s booking and cancellation terms
                      </summary>
                      <p
                        className="dash-small"
                        style={{ whiteSpace: "pre-wrap", marginTop: 15 }}
                      >
                        {retreat.terms}
                      </p>
                      <p
                        className="dash-small"
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {retreat.cancellationPolicy}
                      </p>
                    </details>
                    <div className="booking-consent">
                      <label className="dash-check">
                        <input
                          type="checkbox"
                          checked={traveler.termsAccepted}
                          onChange={(e) =>
                            update("termsAccepted", e.target.checked)
                          }
                          required
                        />
                        <span>
                          I accept this retreat’s booking and cancellation
                          terms, the{" "}
                          <Link href="/terms" target="_blank">
                            booking terms
                          </Link>
                          , and the{" "}
                          <Link href="/privacy" target="_blank">
                            privacy policy
                          </Link>
                          . I understand that this registration covers one
                          traveler.
                        </span>
                      </label>
                    </div>
                    {quote && !quote.canBook && (
                      <div className="dash-alert warning">
                        <CircleAlert size={16} />
                        {quote.reason ||
                          "Online reservations are not available yet. Please contact the retreat team."}
                      </div>
                    )}
                  </>
                )}
                <div className="booking-nav">
                  {step > 0 ? (
                    <button
                      type="button"
                      className="dash-btn secondary"
                      onClick={() => setStep(step - 1)}
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  ) : (
                    <Link
                      className="dash-btn secondary"
                      href={`/retreats/${retreat.slug}`}
                    >
                      Retreat details
                    </Link>
                  )}
                  <button
                    type="submit"
                    className="dash-btn"
                    disabled={
                      working || (step >= 2 && (!quote || !quote.canBook))
                    }
                  >
                    {working ? (
                      <LoaderCircle size={15} className="dash-spin" />
                    ) : null}
                    {step === 3
                      ? `Continue to payment${quote ? ` · ${money(quote.amountDue, quote.currency)}` : ""}`
                      : "Continue"}{" "}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
        <aside className="booking-summary" aria-label="Your retreat summary">
          <img
            src={retreat.image}
            alt={`${retreat.destination} destination inspiration`}
          />
          <div className="booking-summary-inner">
            <p className="dash-kicker">The destination</p>
            <h2>{retreat.destination}</h2>
            <div className="booking-meta">
              <MapPin size={15} />
              {retreat.country}
            </div>
            <div className="booking-meta">
              <CalendarDays size={15} />
              {retreat.dateLabel}
            </div>
            <div className="booking-meta">
              <UserRound size={15} />
              {available
                ? "One traveler per registration"
                : "Registration updates by email"}
            </div>
            {quote && available ? (
              <>
                <div className="booking-price">
                  <span>Package per traveler</span>
                  <strong>{money(quote.subtotal, quote.currency)}</strong>
                </div>
                {quote.discount > 0 && (
                  <div className="booking-price">
                    <span>Promotional saving</span>
                    <strong>−{money(quote.discount, quote.currency)}</strong>
                  </div>
                )}
                <div className="booking-price">
                  <span>Total package</span>
                  <strong>{money(quote.totalAmount, quote.currency)}</strong>
                </div>
                <div className="booking-price total">
                  <span>Due today</span>
                  <strong>{money(quote.amountDue, quote.currency)}</strong>
                </div>
                <p className="booking-cost-note">
                  {traveler.occupancy === "double"
                    ? "Double occupancy · per person"
                    : "Single occupancy · per person"}
                </p>
              </>
            ) : (
              <div className="booking-price total">
                <span>
                  {retreat.status === "sold_out"
                    ? "Current availability"
                    : "Package pricing"}
                </span>
                <strong style={{ fontSize: 21 }}>
                  {retreat.status === "sold_out"
                    ? "Fully reserved"
                    : "To be announced"}
                </strong>
              </div>
            )}
            <div className="booking-trust">
              <ShieldCheck size={17} />
              <span>
                {available
                  ? "Your card details are entered only on Stripe’s secure checkout."
                  : "Be the first to receive confirmed package and reservation details."}
              </span>
            </div>
            {available && (
              <div className="booking-trust">
                <CreditCard size={17} />
                <span>
                  Your reservation is confirmed only after a verified payment
                  and confirmation from our team.
                </span>
              </div>
            )}
            <div className="dash-topline">
              <p className="dash-small dash-muted">
                Prefer a conversation first?
              </p>
              <Link href="/contact" className="dash-link">
                Speak with our retreat team
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
