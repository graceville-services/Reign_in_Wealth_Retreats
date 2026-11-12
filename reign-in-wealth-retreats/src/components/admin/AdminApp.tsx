"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  CircleAlert,
  Compass,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Tag,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import type { Booking, Retreat, SiteSettings, Testimonial } from "@/lib/types";
import { money } from "@/lib/types";
import { api, json, prettyStatus, formatDate, ApiError } from "./api";
import Dialog from "./Dialog";
import RetreatEditor from "./RetreatEditor";
import SettingsEditor from "./SettingsEditor";

type Overview = {
  bookings: number;
  travelers: number;
  rooms: number;
  leads: number;
  revenue: number;
  outstanding: number;
  currency: string;
  paymentConfigured: boolean;
  emailConfigured: boolean;
  policiesApproved: boolean;
  currencies?: Record<string, { revenue: number; outstanding: number }>;
};
type Lead = {
  id: string;
  name: string;
  email: string;
  destination: string;
  source: string;
  consent: boolean;
  createdAt: string;
};
type Message = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
};
type Promo = {
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
type Outbox = {
  id: string;
  to: string;
  subject: string;
  status: string;
  attempts: number;
  createdAt: string;
  lastError?: string;
  text?: string;
};
type Tab =
  | "overview"
  | "retreats"
  | "bookings"
  | "leads"
  | "messages"
  | "testimonials"
  | "promos"
  | "media"
  | "email"
  | "settings";
const tabs = [
  { id: "overview", name: "Overview", icon: LayoutDashboard },
  { id: "retreats", name: "Retreat collection", icon: Globe2 },
  { id: "bookings", name: "Travelers & rooms", icon: UsersRound },
  { id: "leads", name: "Interest lists", icon: UserRound },
  { id: "messages", name: "Inquiries", icon: Inbox },
  { id: "testimonials", name: "Traveler stories", icon: MessageSquare },
  { id: "promos", name: "Promotional codes", icon: Tag },
  { id: "media", name: "Media", icon: ImagePlus },
  { id: "email", name: "Travel updates", icon: Mail },
  { id: "settings", name: "Website settings", icon: Settings2 },
] as const;
const emptyTestimonial: Testimonial = {
  id: "",
  name: "",
  quote: "",
  destination: "",
  image: "",
  videoUrl: "",
  consent: false,
  published: false,
};
function Empty({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="dash-empty">
      <Compass size={37} strokeWidth={1.2} />
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [outbox, setOutbox] = useState<Outbox[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [retreatEditor, setRetreatEditor] = useState<Retreat | "new" | null>(
    null,
  );
  const [bookingEditor, setBookingEditor] = useState<Booking | null>(null);
  const [testimonialEditor, setTestimonialEditor] =
    useState<Testimonial | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Outbox | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [promoForm, setPromoForm] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    amount: "",
    currency: "USD",
    retreatId: "",
    maxUses: "100",
    expiresAt: "",
  });
  const [announcement, setAnnouncement] = useState({
    retreatId: "",
    subject: "",
    message: "",
  });
  const [uploadResult, setUploadResult] = useState<{
    url: string;
    name: string;
    size: number;
  } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const closeBooking = useCallback(() => setBookingEditor(null), []);
  const closeTestimonial = useCallback(() => setTestimonialEditor(null), []);
  const closeMessage = useCallback(() => setSelectedMessage(null), []);
  const closeEmail = useCallback(() => setSelectedEmail(null), []);
  const refresh = useCallback(async () => {
    setLoadingData(true);
    try {
      const [o, r, b, l, m, t, p, out, s] = await Promise.all([
        api<Overview>("/api/admin/overview"),
        api<Retreat[]>("/api/admin/retreats"),
        api<Booking[]>("/api/admin/bookings"),
        api<Lead[]>("/api/admin/leads"),
        api<Message[]>("/api/admin/messages"),
        api<Testimonial[]>("/api/admin/testimonials"),
        api<Promo[]>("/api/admin/promos"),
        api<Outbox[]>("/api/admin/outbox"),
        api<SiteSettings>("/api/admin/settings"),
      ]);
      setOverview(o);
      setRetreats(r);
      setBookings(b);
      setLeads(l);
      setMessages(m);
      setTestimonials(t);
      setPromos(p);
      setOutbox(out);
      setSettings(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingData(false);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    api<{ email: string }>("/api/admin/session")
      .then(async (s) => {
        if (alive) {
          setSession(s);
          await refresh();
        }
      })
      .catch((e) => {
        if (alive && (!(e instanceof ApiError) || e.status !== 401))
          setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [refresh]);
  const switchTab = (next: Tab) => {
    setTab(next);
    setSearch("");
    setFilter("all");
    setError("");
    setNotice("");
    setRetreatEditor(null);
  };
  async function signIn(e: FormEvent) {
    e.preventDefault();
    setError("");
    setWorking("login");
    try {
      const user = await api<{ email: string }>(
        "/api/admin/login",
        json("POST", login),
      );
      setSession(user);
      setLogin({ email: "", password: "" });
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setWorking("");
    }
  }
  async function signOut() {
    setWorking("logout");
    try {
      await api("/api/auth/logout", json("POST", {}));
      setSession(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking("");
    }
  }
  async function action<T>(
    key: string,
    path: string,
    method: string,
    body: unknown,
    success: string,
  ): Promise<T | undefined> {
    setWorking(key);
    setError("");
    setNotice("");
    try {
      const result = await api<T>(path, json(method, body));
      setNotice(success);
      await refresh();
      return result;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking("");
    }
  }
  async function deleteRetreat(retreat: Retreat) {
    if (
      !window.confirm(
        `Remove ${retreat.destination} from the collection? Retreats with registrations cannot be deleted.`,
      )
    )
      return;
    await action(
      "delete-retreat",
      `/api/admin/retreats/${retreat.id}`,
      "DELETE",
      {},
      `${retreat.destination} was removed.`,
    );
  }
  async function saveBooking(e: FormEvent) {
    e.preventDefault();
    if (!bookingEditor) return;
    const result = await action<Booking>(
      "booking",
      `/api/admin/bookings/${bookingEditor.id}`,
      "PATCH",
      {
        status: bookingEditor.status,
        roomId: bookingEditor.roomId || null,
        notes: bookingEditor.notes || "",
      },
      "Traveler details have been updated.",
    );
    if (result) setBookingEditor(null);
  }
  async function saveTestimonial(e: FormEvent) {
    e.preventDefault();
    if (!testimonialEditor) return;
    const { id, ...values } = testimonialEditor;
    const result = await action<Testimonial>(
      "testimonial",
      id ? `/api/admin/testimonials/${id}` : "/api/admin/testimonials",
      id ? "PATCH" : "POST",
      values,
      "Traveler story saved.",
    );
    if (result) setTestimonialEditor(null);
  }
  async function createPromo(e: FormEvent) {
    e.preventDefault();
    const result = await action<Promo>(
      "promo",
      "/api/admin/promos",
      "POST",
      {
        ...promoForm,
        amount:
          promoForm.type === "fixed"
            ? Math.round(Number(promoForm.amount) * 100)
            : Number(promoForm.amount),
        maxUses: Number(promoForm.maxUses),
        retreatId: promoForm.retreatId || null,
        expiresAt: promoForm.expiresAt
          ? `${promoForm.expiresAt}T23:59:59.000Z`
          : null,
        active: true,
      },
      "Promotional code created.",
    );
    if (result)
      setPromoForm({
        code: "",
        type: "percent",
        amount: "",
        currency: "USD",
        retreatId: "",
        maxUses: "100",
        expiresAt: "",
      });
  }
  async function sendAnnouncement(e: FormEvent) {
    e.preventDefault();
    setWorking("announcement");
    setError("");
    setNotice("");
    try {
      const result = await api<{ recipients: number }>(
        "/api/admin/announcements",
        json("POST", announcement),
      );
      setNotice(
        `Travel update created for ${result.recipients} registered ${result.recipients === 1 ? "guest" : "guests"}. Email messages are queued for delivery.`,
      );
      setAnnouncement({ ...announcement, subject: "", message: "" });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking("");
    }
  }
  async function runJobs() {
    setWorking("jobs");
    setError("");
    setNotice("");
    try {
      const result = await api<{
        queued: number;
        sent: number;
        failed: number;
      }>("/api/admin/jobs", json("POST", {}));
      setNotice(
        `Email run complete. ${result.queued} queued, ${result.sent} sent, ${result.failed} failed.`,
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking("");
    }
  }
  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    setWorking("upload");
    setError("");
    setUploadResult(null);
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      const result = await api<{ url: string; name: string; size: number }>(
        "/api/admin/upload",
        { method: "POST", body: form },
      );
      setUploadResult(result);
      setNotice(
        "Your media is ready to use. Copy its URL into the relevant content field.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking("");
    }
  }
  const destinationName = (slug: string) =>
    slug === "all"
      ? "All destinations"
      : retreats.find((r) => r.slug === slug || r.id === slug)?.destination ||
        slug;
  const filteredBookings = bookings.filter(
    (b) =>
      (filter === "all" || b.retreatId === filter) &&
      `${b.firstName} ${b.lastName} ${b.email} ${b.reference}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const filteredLeads = leads.filter(
    (l) =>
      (filter === "all" || l.destination === filter) &&
      `${l.name} ${l.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredMessages = messages.filter((m) =>
    `${m.name} ${m.email} ${m.subject} ${m.message}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <main className="dash-shell">
      {loading ? (
        <div className="dash-loading">
          <LoaderCircle size={20} className="dash-spin" />
          Opening your retreat studio…
        </div>
      ) : !session ? (
        <section className="dash-login">
          <div className="dash-login-icon">
            <LockKeyhole size={22} />
          </div>
          <p className="dash-kicker">Reign in Wealth Retreats</p>
          <h1>Your retreat studio.</h1>
          <p className="dash-muted">
            A considered space to manage destinations, travelers, and everything
            that makes the experience.
          </p>
          {error && (
            <div className="dash-alert error" role="alert">
              <CircleAlert size={17} />
              {error}
            </div>
          )}
          <form onSubmit={signIn}>
            <label className="dash-field">
              <span>Admin email</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={login.email}
                onChange={(e) => setLogin({ ...login, email: e.target.value })}
              />
            </label>
            <label className="dash-field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={login.password}
                onChange={(e) =>
                  setLogin({ ...login, password: e.target.value })
                }
              />
            </label>
            <button className="dash-btn" disabled={working === "login"}>
              {working === "login" ? (
                <LoaderCircle size={15} className="dash-spin" />
              ) : (
                <ShieldCheck size={15} />
              )}
              Sign in to the studio <ArrowRight size={15} />
            </button>
          </form>
          <p className="dash-login-foot">
            Use the administrator credentials created during project setup.
            Traveler? <Link href="/portal">Visit your personal portal.</Link>
          </p>
          <Link className="dash-link" href="/">
            Back to the website
          </Link>
        </section>
      ) : (
        <>
          <header className="dash-heading">
            <div>
              <p className="dash-kicker">
                <Compass size={14} />
                Reign in Wealth Retreats
              </p>
              <h1>The retreat studio.</h1>
              <p>
                Thoughtfully managed, from the first invitation to the journey
                home.
              </p>
            </div>
            <div className="dash-heading-actions">
              <span>{session.email}</span>
              <Link
                className="dash-btn secondary small"
                href="/"
                target="_blank"
              >
                View website <ExternalLink size={13} />
              </Link>
              <button
                className="dash-icon-btn"
                aria-label="Refresh studio data"
                onClick={() => void refresh()}
                disabled={loadingData}
              >
                <RefreshCw
                  size={15}
                  className={loadingData ? "dash-spin" : ""}
                />
              </button>
              <button
                className="dash-icon-btn"
                aria-label="Sign out"
                onClick={signOut}
                disabled={working === "logout"}
              >
                <LogOut size={15} />
              </button>
            </div>
          </header>
          <div className="dash-layout">
            <aside className="dash-sidebar">
              <nav className="dash-nav" aria-label="Retreat studio">
                {tabs.map(({ id, name, icon: Icon }) => (
                  <button
                    className={`dash-tab ${tab === id ? "active" : ""}`}
                    key={id}
                    aria-current={tab === id ? "page" : undefined}
                    onClick={() => switchTab(id)}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    {name}
                  </button>
                ))}
              </nav>
            </aside>
            <section
              className="dash-content"
              aria-label={tabs.find((t) => t.id === tab)?.name}
            >
              {error && (
                <div className="dash-alert error" role="alert">
                  <CircleAlert size={17} />
                  <p>{error}</p>
                </div>
              )}
              {notice && (
                <div className="dash-alert" role="status">
                  <CheckCircle2 size={17} />
                  <p>{notice}</p>
                </div>
              )}
              {tab === "overview" && (
                <>
                  {overview ? (
                    <>
                      <div className="dash-grid">
                        {[
                          {
                            label: "Registered travelers",
                            value: overview.travelers,
                            note: `${overview.bookings} individual registrations`,
                            icon: UsersRound,
                          },
                          {
                            label: "Assigned rooms",
                            value: overview.rooms,
                            note: "Tracked separately from travelers",
                            icon: WalletCards,
                          },
                          {
                            label: "Payments received",
                            value: money(overview.revenue, overview.currency),
                            note: `${overview.currency} · verified payments`,
                            icon: CreditCard,
                          },
                          {
                            label: "Interested travelers",
                            value: overview.leads,
                            note: "Across your destination lists",
                            icon: UserRound,
                          },
                        ].map(({ label, value, note, icon: Icon }) => (
                          <div className="dash-stat" key={label}>
                            <div className="dash-stat-top">
                              {label}
                              <Icon size={17} strokeWidth={1.4} />
                            </div>
                            <strong>{value}</strong>
                            <small>{note}</small>
                          </div>
                        ))}
                      </div>
                      <div className="dash-two">
                        <section className="dash-panel">
                          <h3>Ready for your next departure.</h3>
                          <p className="dash-small dash-muted">
                            The essentials that make your booking experience
                            work.
                          </p>
                          <ul className="dash-list">
                            {[
                              {
                                label: "Secure payments",
                                ready: overview.paymentConfigured,
                                pending: "Add Stripe credentials",
                              },
                              {
                                label: "Email delivery",
                                ready: overview.emailConfigured,
                                pending: "Configure your verified sender",
                              },
                              {
                                label: "Approved policies",
                                ready: overview.policiesApproved,
                                pending: "Review website policies",
                              },
                            ].map((item) => (
                              <li key={item.label}>
                                <div>
                                  <strong>{item.label}</strong>
                                  <small>
                                    {item.ready ? "Configured" : item.pending}
                                  </small>
                                </div>
                                {item.ready ? (
                                  <CheckCircle2 size={17} color="#54804a" />
                                ) : (
                                  <span className="dash-badge gold">
                                    To complete
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                          <button
                            className="dash-link"
                            style={{ marginTop: 21 }}
                            onClick={() => switchTab("settings")}
                          >
                            Manage website settings
                          </button>
                        </section>
                        <section className="dash-panel">
                          <h3>Balance, beautifully clear.</h3>
                          <p className="dash-small dash-muted">
                            Outstanding balances across active traveler
                            reservations.
                          </p>
                          <div
                            style={{
                              fontFamily:
                                "var(--font-display, Georgia), Georgia, serif",
                              fontSize: 46,
                              margin: "24px 0 16px",
                            }}
                          >
                            {money(overview.outstanding, overview.currency)}
                          </div>
                          {overview.currencies &&
                            Object.keys(overview.currencies).length > 1 && (
                              <p className="dash-small dash-muted">
                                By currency:{" "}
                                {Object.entries(overview.currencies)
                                  .map(([currency, amounts]) =>
                                    money(amounts.outstanding, currency),
                                  )
                                  .join(" · ")}
                              </p>
                            )}
                          <button
                            className="dash-btn secondary"
                            onClick={() => switchTab("bookings")}
                          >
                            Manage traveler balances <ArrowRight size={14} />
                          </button>
                          <p
                            className="dash-small dash-muted"
                            style={{ margin: "20px 0 0" }}
                          >
                            Payment totals update from verified Stripe events. A
                            checkout visit alone does not mark a traveler as
                            paid.
                          </p>
                        </section>
                      </div>
                      <section className="dash-panel">
                        <div className="dash-panel-head">
                          <h3>Your destination collection</h3>
                          <button
                            className="dash-link"
                            onClick={() => switchTab("retreats")}
                          >
                            Manage collection
                          </button>
                        </div>
                        <ul className="dash-list">
                          {retreats.map((r) => (
                            <li key={r.id}>
                              <div>
                                <strong>{r.destination}</strong>
                                <small>{r.dateLabel}</small>
                              </div>
                              <div className="dash-row">
                                <span
                                  className={`dash-badge ${r.status === "open" ? "" : "gold"}`}
                                >
                                  {prettyStatus(r.status)}
                                </span>
                                <button
                                  className="dash-icon-btn"
                                  aria-label={`Edit ${r.destination}`}
                                  onClick={() => {
                                    setTab("retreats");
                                    setRetreatEditor(r);
                                  }}
                                >
                                  <Pencil size={13} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </>
                  ) : (
                    <div className="dash-loading">
                      <LoaderCircle size={18} className="dash-spin" />
                      Loading your studio overview…
                    </div>
                  )}
                </>
              )}
              {tab === "retreats" &&
                (retreatEditor ? (
                  <RetreatEditor
                    retreat={
                      retreatEditor === "new" ? undefined : retreatEditor
                    }
                    onCancel={() => setRetreatEditor(null)}
                    onSaved={(saved) => {
                      setRetreatEditor(null);
                      setNotice(`${saved.destination} has been saved.`);
                      void refresh();
                    }}
                  />
                ) : (
                  <>
                    <div className="dash-section-head">
                      <div>
                        <p className="dash-kicker">The world is your canvas</p>
                        <h2>Your retreat collection.</h2>
                      </div>
                      <button
                        className="dash-btn"
                        onClick={() => setRetreatEditor("new")}
                      >
                        <Plus size={15} />
                        Add retreat
                      </button>
                    </div>
                    {retreats.length ? (
                      <div className="dash-retreat-grid">
                        {retreats.map((r) => (
                          <article className="dash-retreat-card" key={r.id}>
                            <img
                              src={r.image}
                              alt={`${r.destination} destination inspiration`}
                              className="dash-retreat-img"
                            />
                            <div className="dash-retreat-info">
                              <div className="dash-row">
                                <span
                                  className={`dash-badge ${r.status === "open" ? "" : "gold"}`}
                                >
                                  {prettyStatus(r.status)}
                                </span>
                                <span
                                  className={`dash-badge ${r.published ? "" : "grey"}`}
                                >
                                  {r.published ? "Published" : "Draft"}
                                </span>
                              </div>
                              <h3>{r.destination}</h3>
                              <p>
                                {r.dateLabel}
                                <br />
                                {r.priceDouble
                                  ? `From ${money(r.priceDouble, r.currency)} per traveler`
                                  : "Pricing to be confirmed"}
                              </p>
                              <div className="dash-row">
                                <button
                                  className="dash-btn secondary small"
                                  onClick={() => setRetreatEditor(r)}
                                >
                                  <Pencil size={13} />
                                  Edit retreat
                                </button>
                                <div className="dash-row">
                                  <Link
                                    href={`/retreats/${r.slug}`}
                                    target="_blank"
                                    className="dash-icon-btn"
                                    aria-label={`View ${r.destination}`}
                                  >
                                    <ExternalLink size={13} />
                                  </Link>
                                  <button
                                    className="dash-icon-btn"
                                    onClick={() => void deleteRetreat(r)}
                                    aria-label={`Delete ${r.destination}`}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <Empty
                        title="A world of possibility."
                        text="Add your first retreat to begin building the collection."
                      />
                    )}
                  </>
                ))}
              {tab === "bookings" && (
                <>
                  <div className="dash-section-head">
                    <div>
                      <p className="dash-kicker">
                        The people behind every journey
                      </p>
                      <h2>Travelers & rooms.</h2>
                    </div>
                    <a
                      className="dash-btn secondary small"
                      href="/api/admin/export?type=bookings"
                    >
                      <Download size={14} />
                      Export CSV
                    </a>
                  </div>
                  <div className="dash-notice">
                    <strong>One registration = one traveler.</strong> Guests
                    sharing accommodation each register separately. Assign the
                    same room reference to the two confirmed roommates; a room
                    reference never replaces a registration.
                  </div>
                  <div className="dash-tools">
                    <input
                      className="dash-search"
                      type="search"
                      placeholder="Find a traveler, email, or reference"
                      aria-label="Search travelers"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <label
                      className="dash-field"
                      style={{ margin: 0, minWidth: 190 }}
                    >
                      <select
                        aria-label="Filter by retreat"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">All retreats</option>
                        {retreats.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.destination}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {filteredBookings.length ? (
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Traveler</th>
                            <th>Retreat</th>
                            <th>Payment</th>
                            <th>Room</th>
                            <th>Status</th>
                            <th>Manage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBookings.map((b) => (
                            <tr key={b.id}>
                              <td>
                                <strong>
                                  {b.firstName} {b.lastName}
                                </strong>
                                <small>{b.email}</small>
                                <small>{b.reference}</small>
                              </td>
                              <td>
                                {b.retreatName}
                                <small>{b.occupancy} occupancy</small>
                              </td>
                              <td>
                                {money(b.paidAmount, b.currency)} received
                                <small>
                                  {money(
                                    Math.max(0, b.totalAmount - b.paidAmount),
                                    b.currency,
                                  )}{" "}
                                  remaining
                                </small>
                              </td>
                              <td>{b.roomId || "Unassigned"}</td>
                              <td>
                                <span
                                  className={`dash-badge ${b.status === "cancelled" ? "red" : b.status === "pending" ? "gold" : ""}`}
                                >
                                  {prettyStatus(b.status)}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="dash-link"
                                  onClick={() =>
                                    setBookingEditor(structuredClone(b))
                                  }
                                >
                                  Open
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty
                      title={
                        search || filter !== "all"
                          ? "No matching travelers."
                          : "The guest list starts here."
                      }
                      text={
                        search || filter !== "all"
                          ? "Try another name or destination."
                          : "Individual registrations, verified payment balances, and room assignments will appear here as reservations are made."
                      }
                    />
                  )}
                </>
              )}
              {tab === "leads" && (
                <>
                  <div className="dash-section-head">
                    <div>
                      <p className="dash-kicker">
                        Your growing global community
                      </p>
                      <h2>Interest lists.</h2>
                    </div>
                    <a
                      className="dash-btn secondary small"
                      href="/api/admin/export?type=leads"
                    >
                      <Download size={14} />
                      Export CSV
                    </a>
                  </div>
                  <div className="dash-tools">
                    <input
                      className="dash-search"
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      aria-label="Search interest lists"
                      placeholder="Search by name or email"
                    />
                    <label className="dash-field" style={{ margin: 0 }}>
                      <select
                        aria-label="Filter interest by destination"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">Every destination</option>
                        {retreats.map((r) => (
                          <option key={r.id} value={r.slug}>
                            {r.destination}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {filteredLeads.length ? (
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Name & email</th>
                            <th>Destination</th>
                            <th>Interest</th>
                            <th>Permission</th>
                            <th>Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeads.map((lead) => (
                            <tr key={lead.id}>
                              <td>
                                <strong>
                                  {lead.name || "Name not provided"}
                                </strong>
                                <small>{lead.email}</small>
                              </td>
                              <td>{destinationName(lead.destination)}</td>
                              <td>{prettyStatus(lead.source)}</td>
                              <td>
                                <span
                                  className={`dash-badge ${lead.consent ? "" : "grey"}`}
                                >
                                  {lead.consent ? "Opted in" : "No marketing"}
                                </span>
                              </td>
                              <td>{formatDate(lead.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty
                      title={
                        search || filter !== "all"
                          ? "No matching subscribers."
                          : "Curiosity begins here."
                      }
                      text="Destination waitlists and community signups appear here, organized by the experiences your audience wants to hear about."
                    />
                  )}
                </>
              )}
              {tab === "messages" && (
                <>
                  <div className="dash-section-head">
                    <div>
                      <p className="dash-kicker">
                        A conversation before the journey
                      </p>
                      <h2>Retreat inquiries.</h2>
                    </div>
                  </div>
                  <div className="dash-tools">
                    <input
                      className="dash-search"
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search your inquiries"
                      aria-label="Search inquiries"
                    />
                  </div>
                  {filteredMessages.length ? (
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>From</th>
                            <th>Inquiry</th>
                            <th>Received</th>
                            <th>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMessages.map((m) => (
                            <tr key={m.id}>
                              <td>
                                <strong>{m.name}</strong>
                                <small>{m.email}</small>
                              </td>
                              <td>
                                {prettyStatus(m.subject)}
                                <small>
                                  {m.message.slice(0, 90)}
                                  {m.message.length > 90 ? "…" : ""}
                                </small>
                              </td>
                              <td>{formatDate(m.createdAt)}</td>
                              <td>
                                <button
                                  className="dash-link"
                                  onClick={() => setSelectedMessage(m)}
                                >
                                  Read
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty
                      title="A place for every conversation."
                      text="General, group travel, and partnership inquiries submitted through your website appear here."
                    />
                  )}
                </>
              )}
              {tab === "testimonials" && (
                <>
                  <div className="dash-section-head">
                    <div>
                      <p className="dash-kicker">
                        Real people. Real experiences.
                      </p>
                      <h2>Traveler stories.</h2>
                    </div>
                    <button
                      className="dash-btn"
                      onClick={() =>
                        setTestimonialEditor({ ...emptyTestimonial })
                      }
                    >
                      <Plus size={15} />
                      Add a story
                    </button>
                  </div>
                  <div className="dash-notice">
                    Publish only genuine traveler feedback, with the traveler’s
                    permission. The public website does not display invented
                    testimonials.
                  </div>
                  {testimonials.length ? (
                    <div className="dash-retreat-grid">
                      {testimonials.map((t) => (
                        <article className="dash-panel" key={t.id}>
                          <p className="dash-kicker">
                            {t.destination || "Traveler story"}
                          </p>
                          <h3>{t.name}</h3>
                          <p
                            className="dash-small"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {t.quote}
                          </p>
                          <div className="dash-row dash-space">
                            <span
                              className={`dash-badge ${t.published ? "" : "grey"}`}
                            >
                              {t.published ? "Published" : "Draft"}
                            </span>
                            <div className="dash-row">
                              <button
                                className="dash-icon-btn"
                                aria-label={`Edit ${t.name}'s story`}
                                onClick={() => setTestimonialEditor({ ...t })}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className="dash-icon-btn"
                                aria-label={`Delete ${t.name}'s story`}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Delete this traveler story from ${t.name}?`,
                                    )
                                  )
                                    void action(
                                      "delete-story",
                                      `/api/admin/testimonials/${t.id}`,
                                      "DELETE",
                                      {},
                                      "Traveler story deleted.",
                                    );
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="Their words will tell the story."
                      text="Add approved feedback and photographs from your travelers. Until then, the website shows a considered invitation to share an experience."
                    />
                  )}
                </>
              )}
              {tab === "promos" && (
                <>
                  <div className="dash-section-head">
                    <div>
                      <p className="dash-kicker">A thoughtful invitation</p>
                      <h2>Promotional codes.</h2>
                    </div>
                  </div>
                  <form className="dash-panel" onSubmit={createPromo}>
                    <h3>Create a code</h3>
                    <div className="dash-three">
                      <label className="dash-field">
                        <span>Code</span>
                        <input
                          required
                          value={promoForm.code}
                          onChange={(e) =>
                            setPromoForm({
                              ...promoForm,
                              code: e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9_-]/g, ""),
                            })
                          }
                          placeholder="EARLYACCESS"
                          maxLength={40}
                        />
                      </label>
                      <label className="dash-field">
                        <span>Discount type</span>
                        <select
                          value={promoForm.type}
                          onChange={(e) =>
                            setPromoForm({
                              ...promoForm,
                              type: e.target.value as "percent" | "fixed",
                            })
                          }
                        >
                          <option value="percent">Percentage</option>
                          <option value="fixed">Fixed amount</option>
                        </select>
                      </label>
                      <label className="dash-field">
                        <span>
                          {promoForm.type === "percent"
                            ? "Percentage off"
                            : `Amount off (${promoForm.currency})`}
                        </span>
                        <input
                          type="number"
                          min={promoForm.type === "percent" ? 1 : 0.01}
                          max={promoForm.type === "percent" ? 100 : undefined}
                          step={promoForm.type === "percent" ? 1 : 0.01}
                          required
                          value={promoForm.amount}
                          onChange={(e) =>
                            setPromoForm({
                              ...promoForm,
                              amount: e.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                    <div className="dash-three">
                      <label className="dash-field">
                        <span>Eligible retreat</span>
                        <select
                          value={promoForm.retreatId}
                          onChange={(e) =>
                            setPromoForm({
                              ...promoForm,
                              retreatId: e.target.value,
                            })
                          }
                        >
                          <option value="">All retreats</option>
                          {retreats.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.destination}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="dash-field">
                        <span>Maximum redemptions</span>
                        <input
                          type="number"
                          required
                          min={1}
                          max={100000}
                          value={promoForm.maxUses}
                          onChange={(e) =>
                            setPromoForm({
                              ...promoForm,
                              maxUses: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="dash-field">
                        <span>Expiration date, optional</span>
                        <input
                          type="date"
                          value={promoForm.expiresAt}
                          onChange={(e) =>
                            setPromoForm({
                              ...promoForm,
                              expiresAt: e.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                    {promoForm.type === "fixed" && (
                      <label className="dash-field" style={{ maxWidth: 220 }}>
                        <span>Discount currency</span>
                        <select
                          value={promoForm.currency}
                          onChange={(e) =>
                            setPromoForm({
                              ...promoForm,
                              currency: e.target.value,
                            })
                          }
                        >
                          {["USD", "GBP", "EUR", "CAD", "NGN", "AED"].map(
                            (c) => (
                              <option key={c}>{c}</option>
                            ),
                          )}
                        </select>
                        <small>
                          Must match the retreat’s pricing currency.
                        </small>
                      </label>
                    )}
                    <button className="dash-btn" disabled={working === "promo"}>
                      {working === "promo" ? (
                        <LoaderCircle size={14} className="dash-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      Create promotional code
                    </button>
                  </form>
                  {promos.length > 0 && (
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Offer</th>
                            <th>Retreat</th>
                            <th>Redemptions</th>
                            <th>Expires</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {promos.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <strong>{p.code}</strong>
                              </td>
                              <td>
                                {p.type === "percent"
                                  ? `${p.amount}%`
                                  : money(p.amount, p.currency)}{" "}
                                off
                              </td>
                              <td>
                                {p.retreatId
                                  ? destinationName(p.retreatId)
                                  : "All retreats"}
                              </td>
                              <td>
                                {p.uses} / {p.maxUses}
                              </td>
                              <td>
                                {p.expiresAt
                                  ? formatDate(p.expiresAt)
                                  : "No expiry"}
                              </td>
                              <td>
                                <button
                                  className={`dash-btn small ${p.active ? "secondary" : ""}`}
                                  disabled={working === p.id}
                                  onClick={() =>
                                    void action(
                                      p.id,
                                      `/api/admin/promos/${p.id}`,
                                      "PATCH",
                                      { active: !p.active },
                                      `Code ${p.active ? "deactivated" : "activated"}.`,
                                    )
                                  }
                                >
                                  {p.active ? "Deactivate" : "Activate"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
              {tab === "media" && (
                <>
                  <div className="dash-section-head">
                    <div>
                      <p className="dash-kicker">Let the experience speak</p>
                      <h2>Your images & films.</h2>
                    </div>
                  </div>
                  <form className="dash-panel" onSubmit={upload}>
                    <div className="dash-upload">
                      <Upload size={32} strokeWidth={1.2} />
                      <h3>A new perspective.</h3>
                      <p className="dash-small dash-muted">
                        Upload photographs or a short film for your destination
                        pages, founder story, or homepage.
                      </p>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm"
                        required
                        aria-label="Select image or video"
                        onChange={(e) =>
                          setUploadFile(e.target.files?.[0] || null)
                        }
                      />
                      <p
                        className="dash-small dash-muted"
                        style={{ margin: "18px 0 0" }}
                      >
                        JPEG, PNG, WebP, AVIF, GIF, MP4, or WebM · Up to 25 MB
                      </p>
                    </div>
                    <div className="dash-form-actions">
                      <button
                        className="dash-btn"
                        disabled={working === "upload" || !uploadFile}
                      >
                        {working === "upload" ? (
                          <LoaderCircle className="dash-spin" size={15} />
                        ) : (
                          <Upload size={15} />
                        )}
                        Upload media
                      </button>
                    </div>
                  </form>
                  {uploadResult && (
                    <div className="dash-panel">
                      <p className="dash-kicker">Ready to use</p>
                      <h3>{uploadResult.name}</h3>
                      <p className="dash-small dash-muted">
                        {(uploadResult.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="dash-row">
                        <code
                          className="dash-code"
                          style={{ overflowWrap: "anywhere" }}
                        >
                          {uploadResult.url}
                        </code>
                        <button
                          className="dash-btn secondary small"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                uploadResult.url,
                              );
                              setNotice("Media URL copied.");
                            } catch {
                              setNotice(
                                "Select and copy the media URL shown above.",
                              );
                            }
                          }}
                        >
                          <Copy size={13} />
                          Copy URL
                        </button>
                      </div>
                      {/\.(mp4|webm)$/i.test(uploadResult.url) ? (
                        <video
                          className="dash-media-thumb"
                          controls
                          src={uploadResult.url}
                        />
                      ) : (
                        <img
                          className="dash-media-thumb"
                          src={uploadResult.url}
                          alt="Newly uploaded media preview"
                        />
                      )}
                      <p className="dash-small dash-muted dash-topline">
                        Paste this URL into a retreat’s Photography section or
                        Website settings. Use approved images of the founder and
                        actual guests when representing real experiences.
                      </p>
                    </div>
                  )}
                </>
              )}
              {tab === "email" && (
                <>
                  <div className="dash-section-head">
                    <div>
                      <p className="dash-kicker">
                        Stay connected along the way
                      </p>
                      <h2>Travel updates.</h2>
                    </div>
                    <button
                      className="dash-btn secondary small"
                      onClick={() => void runJobs()}
                      disabled={working === "jobs"}
                    >
                      {working === "jobs" ? (
                        <LoaderCircle size={14} className="dash-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      Process email queue
                    </button>
                  </div>
                  {overview && !overview.emailConfigured && (
                    <div className="dash-alert warning">
                      <CircleAlert size={17} />
                      <p>
                        Email delivery is not configured. Messages remain in the
                        outbox until a verified sender is connected. Local
                        development previews can be viewed below.
                      </p>
                    </div>
                  )}
                  <form className="dash-panel" onSubmit={sendAnnouncement}>
                    <h3>A note to your travelers.</h3>
                    <p className="dash-small dash-muted">
                      Create a retreat update for its active registered guests.
                      It appears in their portal and queues an email to each
                      guest.
                    </p>
                    <label className="dash-field">
                      <span>Retreat</span>
                      <select
                        required
                        value={announcement.retreatId}
                        onChange={(e) =>
                          setAnnouncement({
                            ...announcement,
                            retreatId: e.target.value,
                          })
                        }
                      >
                        <option value="">Select a retreat</option>
                        {retreats.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.destination} ·{" "}
                            {
                              bookings.filter(
                                (b) =>
                                  b.retreatId === r.id &&
                                  b.status === "confirmed",
                              ).length
                            }{" "}
                            confirmed guests
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dash-field">
                      <span>Subject</span>
                      <input
                        required
                        value={announcement.subject}
                        onChange={(e) =>
                          setAnnouncement({
                            ...announcement,
                            subject: e.target.value,
                          })
                        }
                        maxLength={180}
                        placeholder="Your next experience is getting closer"
                      />
                    </label>
                    <label className="dash-field">
                      <span>Your message</span>
                      <textarea
                        required
                        value={announcement.message}
                        onChange={(e) =>
                          setAnnouncement({
                            ...announcement,
                            message: e.target.value,
                          })
                        }
                        maxLength={10000}
                        rows={7}
                        placeholder="Share travel preparation, confirmed meeting points, or a thoughtful update from your team."
                      />
                    </label>
                    <button
                      className="dash-btn"
                      disabled={working === "announcement"}
                    >
                      {working === "announcement" ? (
                        <LoaderCircle size={14} className="dash-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      Publish & queue retreat update
                    </button>
                  </form>
                  <div className="dash-section-head">
                    <h3>Email outbox</h3>
                    <span className="dash-small dash-muted">
                      {outbox.length} messages
                    </span>
                  </div>
                  {outbox.length ? (
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Recipient</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {outbox.map((mail) => (
                            <tr key={mail.id}>
                              <td>{mail.to}</td>
                              <td>{mail.subject}</td>
                              <td>
                                <span
                                  className={`dash-badge ${mail.status === "sent" ? "" : mail.status === "failed" ? "red" : "gold"}`}
                                >
                                  {prettyStatus(mail.status)}
                                </span>
                                <small>{mail.attempts} attempts</small>
                              </td>
                              <td>{formatDate(mail.createdAt)}</td>
                              <td>
                                <button
                                  className="dash-link"
                                  onClick={() => setSelectedEmail(mail)}
                                >
                                  Open
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty
                      title="Your next note starts here."
                      text="Confirmation messages, payment receipts, reminders, and travel updates will be recorded in this outbox."
                    />
                  )}
                </>
              )}
              {tab === "settings" && settings && (
                <SettingsEditor
                  settings={settings}
                  onSaved={(value) => {
                    setSettings(value);
                    void refresh();
                  }}
                />
              )}
            </section>
          </div>
        </>
      )}
      {bookingEditor && (
        <Dialog
          title={`${bookingEditor.firstName} ${bookingEditor.lastName}`}
          subtitle={`${bookingEditor.retreatName} · ${bookingEditor.reference}`}
          onClose={closeBooking}
        >
          <form onSubmit={saveBooking}>
            <dl className="dash-definition">
              <div>
                <dt>Email</dt>
                <dd>{bookingEditor.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{bookingEditor.phone}</dd>
              </div>
              <div>
                <dt>Country</dt>
                <dd>{bookingEditor.country}</dd>
              </div>
              <div>
                <dt>Room preference</dt>
                <dd>{bookingEditor.occupancy} occupancy</dd>
              </div>
              <div>
                <dt>Package total</dt>
                <dd>
                  {money(bookingEditor.totalAmount, bookingEditor.currency)}
                </dd>
              </div>
              <div>
                <dt>Payments received</dt>
                <dd>
                  {money(bookingEditor.paidAmount, bookingEditor.currency)}
                </dd>
              </div>
              <div>
                <dt>Preferred roommate</dt>
                <dd>{bookingEditor.roommateName || "None specified"}</dd>
              </div>
              <div>
                <dt>Roommate email</dt>
                <dd>{bookingEditor.roommateEmail || "None specified"}</dd>
              </div>
            </dl>
            <div className="dash-two">
              <label className="dash-field">
                <span>Registration status</span>
                <select
                  value={bookingEditor.status}
                  onChange={(e) =>
                    setBookingEditor({
                      ...bookingEditor,
                      status: e.target.value,
                    })
                  }
                >
                  {!["pending", "confirmed", "cancelled"].includes(
                    bookingEditor.status,
                  ) && (
                    <option value={bookingEditor.status}>
                      {prettyStatus(bookingEditor.status)}
                    </option>
                  )}
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <small>
                  Changing registration status does not alter payment records or
                  issue refunds.
                </small>
              </label>
              <label className="dash-field">
                <span>Room reference</span>
                <input
                  value={bookingEditor.roomId || ""}
                  onChange={(e) =>
                    setBookingEditor({
                      ...bookingEditor,
                      roomId: e.target.value || null,
                    })
                  }
                  placeholder="For example GH-204"
                  maxLength={80}
                />
                <small>
                  Use the same reference for two confirmed roommates.
                </small>
              </label>
            </div>
            <label className="dash-field">
              <span>Registration notes</span>
              <textarea
                value={bookingEditor.notes || ""}
                onChange={(e) =>
                  setBookingEditor({ ...bookingEditor, notes: e.target.value })
                }
                maxLength={2000}
              />
            </label>
            {error && (
              <div className="dash-alert error" role="alert">
                {error}
              </div>
            )}
            <div className="dash-form-actions">
              <button
                type="button"
                className="dash-btn secondary"
                onClick={closeBooking}
              >
                Close
              </button>
              <button className="dash-btn" disabled={working === "booking"}>
                {working === "booking" ? (
                  <LoaderCircle className="dash-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                Save traveler
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {testimonialEditor && (
        <Dialog
          title={
            testimonialEditor.id
              ? "Edit a traveler story"
              : "Share their experience"
          }
          subtitle="Genuine feedback, shared with permission."
          onClose={closeTestimonial}
        >
          <form onSubmit={saveTestimonial}>
            <div className="dash-two">
              <label className="dash-field">
                <span>Traveler display name</span>
                <input
                  required
                  value={testimonialEditor.name}
                  onChange={(e) =>
                    setTestimonialEditor({
                      ...testimonialEditor,
                      name: e.target.value,
                    })
                  }
                  maxLength={120}
                />
              </label>
              <label className="dash-field">
                <span>Retreat or destination</span>
                <input
                  required
                  value={testimonialEditor.destination}
                  onChange={(e) =>
                    setTestimonialEditor({
                      ...testimonialEditor,
                      destination: e.target.value,
                    })
                  }
                  maxLength={160}
                  placeholder="Ghana 2026"
                />
              </label>
            </div>
            <label className="dash-field">
              <span>Their words</span>
              <textarea
                required
                value={testimonialEditor.quote}
                onChange={(e) =>
                  setTestimonialEditor({
                    ...testimonialEditor,
                    quote: e.target.value,
                  })
                }
                maxLength={3000}
                rows={6}
              />
            </label>
            <label className="dash-field">
              <span>Traveler photo URL, optional</span>
              <input
                value={testimonialEditor.image}
                onChange={(e) =>
                  setTestimonialEditor({
                    ...testimonialEditor,
                    image: e.target.value,
                  })
                }
              />
            </label>
            <label className="dash-field">
              <span>Video URL, optional</span>
              <input
                value={testimonialEditor.videoUrl}
                onChange={(e) =>
                  setTestimonialEditor({
                    ...testimonialEditor,
                    videoUrl: e.target.value,
                  })
                }
              />
            </label>
            <label className="dash-check">
              <input
                type="checkbox"
                checked={testimonialEditor.consent}
                onChange={(e) =>
                  setTestimonialEditor({
                    ...testimonialEditor,
                    consent: e.target.checked,
                  })
                }
              />
              <span>
                The traveler has given permission to publish their feedback and
                any supplied photograph or video.
              </span>
            </label>
            <label className="dash-check">
              <input
                type="checkbox"
                checked={testimonialEditor.published}
                onChange={(e) =>
                  setTestimonialEditor({
                    ...testimonialEditor,
                    published: e.target.checked,
                  })
                }
              />
              <span>Publish this approved story on the website.</span>
            </label>
            {error && (
              <div className="dash-alert error" role="alert">
                {error}
              </div>
            )}
            <div className="dash-form-actions">
              <button className="dash-btn" disabled={working === "testimonial"}>
                {working === "testimonial" ? (
                  <LoaderCircle size={14} className="dash-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save traveler story
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {selectedMessage && (
        <Dialog
          title={prettyStatus(selectedMessage.subject) + " inquiry"}
          subtitle={`From ${selectedMessage.name} · ${formatDate(selectedMessage.createdAt)}`}
          onClose={closeMessage}
        >
          <dl className="dash-definition">
            <div>
              <dt>Email</dt>
              <dd>{selectedMessage.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{selectedMessage.phone || "Not provided"}</dd>
            </div>
          </dl>
          <p style={{ whiteSpace: "pre-wrap" }}>{selectedMessage.message}</p>
          <div className="dash-form-actions">
            <a
              className="dash-btn"
              href={`mailto:${encodeURIComponent(selectedMessage.email)}?subject=${encodeURIComponent(`Re: Your Reign in Wealth ${selectedMessage.subject} inquiry`)}`}
            >
              <Mail size={14} />
              Reply by email
            </a>
          </div>
        </Dialog>
      )}
      {selectedEmail && (
        <Dialog
          title="Email details"
          subtitle={selectedEmail.subject}
          onClose={closeEmail}
        >
          <dl className="dash-definition">
            <div>
              <dt>Recipient</dt>
              <dd>{selectedEmail.to}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{prettyStatus(selectedEmail.status)}</dd>
            </div>
            <div>
              <dt>Queued</dt>
              <dd>{formatDate(selectedEmail.createdAt)}</dd>
            </div>
            <div>
              <dt>Delivery attempts</dt>
              <dd>{selectedEmail.attempts}</dd>
            </div>
          </dl>
          {selectedEmail.lastError && (
            <div className="dash-alert error">{selectedEmail.lastError}</div>
          )}
          {selectedEmail.text ? (
            <>
              <p className="dash-kicker">Development preview</p>
              <pre className="dash-pre">{selectedEmail.text}</pre>
            </>
          ) : (
            <p className="dash-small dash-muted">
              Message content is not exposed in this environment. Delivery
              status is shown above.
            </p>
          )}
        </Dialog>
      )}
    </main>
  );
}
