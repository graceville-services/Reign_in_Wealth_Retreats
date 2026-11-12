import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Clock3,
  Check,
  Plus,
  ShieldCheck,
  BedDouble,
  CircleHelp,
  Compass,
} from "lucide-react";
import { getRetreat, getRetreats } from "@/lib/server/data";
import { money } from "@/lib/types";
import { FAQ } from "@/components/site/FAQ";
import { Gallery } from "@/components/site/Gallery";
import { LeadForm } from "@/components/site/LeadForm";
import { RetreatCard } from "@/components/site/RetreatCard";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = getRetreat(slug);
  return r
    ? {
        title: `${r.destination} retreat`,
        description: r.excerpt,
        openGraph: { images: [r.heroImage] },
      }
    : { title: "Retreat not found" };
}
export default async function RetreatDetail({ params }: Props) {
  const { slug } = await params;
  const r = getRetreat(slug);
  if (!r) notFound();
  const price = r.priceDouble ?? r.priceSingle;
  const open = r.bookingEnabled && r.status === "open" && price !== null;
  const others = getRetreats()
    .filter((x) => x.slug !== slug)
    .slice(0, 3);
  return (
    <>
      <section className="retreat-hero">
        <img
          src={r.heroImage}
          alt={`${r.destination} destination landscape`}
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <div className="container">
          <Link className="breadcrumb light" href="/retreats">
            <ArrowLeft size={14} />
            Our retreat collection
          </Link>
          <div className="retreat-hero-title">
            <p className="eyebrow light">
              {r.region} / {r.country}
            </p>
            <h1>
              {r.destination}
              <em>{r.tagline}</em>
            </h1>
            <div className="retreat-hero-meta">
              <span>
                <CalendarDays size={16} />
                {r.dateLabel}
              </span>
              <span>
                <Clock3 size={16} />
                {r.duration}
              </span>
            </div>
          </div>
        </div>
      </section>
      <nav className="detail-subnav" aria-label="On this retreat page">
        <div className="container">
          <a href="#overview">The overview</a>
          <a href="#itinerary">Your experience</a>
          <a href="#stay">Your stay</a>
          <a href="#packages">Packages</a>
          <a href="#gallery">The destination</a>
          <a href="#essentials">Before you go</a>
          <a href="#interest" className="subnav-cta">
            {open ? "Reserve your place" : "Join the interest list"}
            <ArrowUpRight size={14} />
          </a>
        </div>
      </nav>
      <div className="container detail-layout">
        <div className="detail-main">
          <section className="detail-section" id="overview">
            <p className="eyebrow">
              A JOURNEY TO {r.destination.toUpperCase()}
            </p>
            <h2>
              See the world.
              <br />
              <em>See what’s possible.</em>
            </h2>
            <p className="lead-paragraph">{r.excerpt}</p>
            <p>{r.description}</p>
            <div className="highlights-grid">
              {r.highlights.map((h) => (
                <span key={h}>
                  <Compass size={16} />
                  {h}
                </span>
              ))}
            </div>
          </section>
          <section id="itinerary" className="detail-section">
            <div className="detail-heading">
              <div>
                <p className="eyebrow">THE RHYTHM OF YOUR RETREAT</p>
                <h2>
                  Room for <em>discovery.</em>
                </h2>
              </div>
            </div>
            {r.itinerary.length ? (
              <>
                <p>
                  Explore the outline below. Proposed experiences are subject to
                  confirmation; the final schedule and inclusions will be
                  available before booking.
                </p>
                <div className="itinerary">
                  {r.itinerary.map((day, i) => (
                    <details key={i} open={i === 0}>
                      <summary>
                        <span className="day-number">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <small>{day.day}</small>
                          <h3>{day.title}</h3>
                        </div>
                        <Plus size={18} />
                      </summary>
                      <p>{day.description}</p>
                    </details>
                  ))}
                </div>
              </>
            ) : (
              <div className="soft-panel">
                <Compass size={24} />
                <h3>Something extraordinary is taking shape.</h3>
                <p>
                  The itinerary is being thoughtfully curated. Join the interest
                  list and we’ll share the details as the experience comes
                  together.
                </p>
              </div>
            )}
          </section>
          <section id="stay" className="detail-section">
            <p className="eyebrow">YOUR PLACE TO UNWIND</p>
            <h2>
              {r.hotelName || "A stay worth"}
              {!r.hotelName && (
                <>
                  {" "}
                  <em>slowing down for.</em>
                </>
              )}
            </h2>
            <p>{r.hotelDescription}</p>
            <div className="occupancy-explainer">
              <BedDouble size={26} />
              <div>
                <h3>Your room. Your preference.</h3>
                <p>
                  Single occupancy is for one person in a room. Double occupancy
                  means two individually registered travelers share one room.
                  Your roommate request is confirmed separately by our team.
                </p>
              </div>
            </div>
          </section>
          <section id="packages" className="detail-section">
            <p className="eyebrow">A CLEARER PICTURE</p>
            <h2>
              Your retreat, <em>considered.</em>
            </h2>
            <div className="package-prices">
              <div>
                <BedDouble size={21} />
                <h3>Double occupancy</h3>
                <p>Per traveler, sharing a room</p>
                <strong>
                  {r.priceDouble !== null
                    ? money(r.priceDouble, r.currency)
                    : "To be announced"}
                </strong>
              </div>
              <div>
                <BedDouble size={21} />
                <h3>Single occupancy</h3>
                <p>Per traveler, private room</p>
                <strong>
                  {r.priceSingle !== null
                    ? money(r.priceSingle, r.currency)
                    : "To be announced"}
                </strong>
              </div>
            </div>
            <div className="inclusions-grid">
              <div>
                <h3>What’s included</h3>
                {r.included.map((i) => (
                  <p key={i}>
                    <Check size={16} />
                    {i}
                  </p>
                ))}
              </div>
              <div>
                <h3>Plan separately</h3>
                {r.excluded.map((i) => (
                  <p key={i}>
                    <Plus size={16} />
                    {i}
                  </p>
                ))}
              </div>
            </div>
            {r.depositAmount !== null && (
              <div className="notice">
                <ShieldCheck size={20} />
                <p>
                  A deposit of {money(r.depositAmount, r.currency)} per traveler
                  is available. Review the full payment schedule and
                  cancellation policy during registration.
                </p>
              </div>
            )}
          </section>
          <section id="gallery" className="detail-section">
            <p className="eyebrow">A SENSE OF PLACE</p>
            <h2>
              Picture <em>the possibilities.</em>
            </h2>
            <Gallery
              images={r.gallery.length ? r.gallery : [r.heroImage]}
              title={r.destination}
            />
          </section>
          <section id="essentials" className="detail-section">
            <p className="eyebrow">A LITTLE PREPARATION</p>
            <h2>
              Before <em>you go.</em>
            </h2>
            <div className="travel-notes">
              {r.travelNotes.map((n, i) => (
                <div key={n}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <p>{n}</p>
                </div>
              ))}
            </div>
            <details className="policy-disclosure">
              <summary>
                Booking terms <Plus size={16} />
              </summary>
              <p>{r.terms}</p>
              <Link href="/terms">Read booking terms</Link>
            </details>
            <details className="policy-disclosure">
              <summary>
                Cancellation and refund terms <Plus size={16} />
              </summary>
              <p>{r.cancellationPolicy}</p>
              <Link href="/cancellation">Read cancellation policy</Link>
            </details>
          </section>
          <section className="detail-section">
            <p className="eyebrow">YOUR QUESTIONS, ANSWERED</p>
            <h2>
              Travel with <em>clarity.</em>
            </h2>
            <FAQ limit={4} />
          </section>
          <section id="interest" className="detail-section interest-section">
            <p className="eyebrow">YOUR NEXT EXPERIENCE AWAITS</p>
            <h2>
              {open ? (
                <>
                  Your place in <em>{r.destination}.</em>
                </>
              ) : (
                <>
                  Be part of the <em>next chapter.</em>
                </>
              )}
            </h2>
            {open ? (
              <>
                <p>
                  Complete one registration per traveler. You’ll review your
                  room preference, payment plan, and the retreat terms before
                  paying.
                </p>
                <Link
                  href={`/reserve?retreat=${r.slug}`}
                  className="button button-primary"
                >
                  Reserve your experience <ArrowUpRight size={17} />
                </Link>
              </>
            ) : (
              <>
                <p>
                  Leave your details to receive {r.destination} retreat updates,
                  confirmed pricing, and booking information.
                </p>
                <LeadForm destination={r.slug} />
              </>
            )}
          </section>
        </div>
        <aside className="booking-sidebar">
          <div className="booking-card">
            <p className="eyebrow">
              YOUR {r.destination.toUpperCase()} CHAPTER
            </p>
            <h3>
              {open
                ? "Your experience awaits."
                : r.status === "sold_out"
                  ? "Until the next chapter."
                  : "Be first to know."}
            </h3>
            <div className="booking-card-meta">
              <p>
                <CalendarDays size={17} />
                {r.dateLabel}
              </p>
              <p>
                <MapPin size={17} />
                {r.destination}, {r.country}
              </p>
              <p>
                <Clock3 size={17} />
                {r.duration}
              </p>
            </div>
            <div className="booking-price">
              {price !== null ? (
                <>
                  <small>From, per traveler</small>
                  <strong>{money(price, r.currency)}</strong>
                </>
              ) : (
                <>
                  <small>A thoughtfully curated experience</small>
                  <strong>Pricing coming soon</strong>
                </>
              )}
            </div>
            <Link
              href={open ? `/reserve?retreat=${r.slug}` : "#interest"}
              className="button button-primary"
            >
              {open ? "Reserve your experience" : "Join the interest list"}
              <ArrowUpRight size={17} />
            </Link>
            <p className="booking-card-note">
              {open
                ? "One registration per traveler. Shared rooms are coordinated separately."
                : "No payment required. We’ll share the confirmed package before reservations open."}
            </p>
            <Link className="booking-contact" href="/contact">
              <CircleHelp size={16} />
              Have a question? Let’s talk.
            </Link>
          </div>
        </aside>
      </div>
      <section className="section-space more-retreats">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">KEEP EXPLORING</p>
              <h2>
                More places.<em> More possibility.</em>
              </h2>
            </div>
          </div>
          <div className="retreat-grid three-column">
            {others.map((r, i) => (
              <RetreatCard key={r.id} retreat={r} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
