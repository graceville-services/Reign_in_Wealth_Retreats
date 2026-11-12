import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Compass,
  Globe2,
  Gem,
  HeartHandshake,
  MoveUpRight,
  CalendarDays,
} from "lucide-react";
import { getRetreats, getSettings, getTestimonials } from "@/lib/server/data";
import { RetreatCard } from "@/components/site/RetreatCard";
import { FAQ } from "@/components/site/FAQ";
import { HeroMedia } from "@/components/site/HeroMedia";
import { CommunityBanner } from "@/components/site/PageIntro";
export default function Home() {
  const retreats = getRetreats();
  const settings = getSettings();
  const testimonials = getTestimonials();
  return (
    <>
      <section className="home-hero">
        <HeroMedia video={settings.heroVideo} />
        <div className="hero-shade" />
        <div className="hero-content container">
          <p className="eyebrow light">
            <span className="small-rule" /> LUXURY TRAVEL. DEEPER PURPOSE.
          </p>
          <h1>
            Explore the world.
            <br />
            Expand your vision.
            <br />
            <em>Reign in Wealth.</em>
          </h1>
          <p>
            More than a vacation. A global experience
            <br className="desktop-break" /> designed to transform your life.
          </p>
          <div className="hero-buttons">
            <Link href="/retreats" className="button button-cream">
              Explore upcoming retreats <ArrowUpRight size={17} />
            </Link>
            <Link href="/experience" className="hero-text-link">
              Discover the experience{" "}
              <span className="circle-icon">
                <ArrowUpRight size={16} />
              </span>
            </Link>
          </div>
        </div>
        <div className="hero-bottom container">
          <a href="#welcome" className="scroll-hint">
            <ArrowDown size={14} /> A world beyond the ordinary
          </a>
          <Link href="/retreats/zanzibar-2027" className="hero-location">
            <span className="location-dot" />
            <div>
              <span>YOUR NEXT CHAPTER COULD BEGIN IN</span>
              <strong>
                Zanzibar, Tanzania <ArrowUpRight size={14} />
              </strong>
            </div>
          </Link>
          <span className="hero-slide-number">
            2026 <span>/ 2027</span>
          </span>
        </div>
      </section>
      <section className="brand-values">
        <div className="container">
          <span>
            <Globe2 size={17} /> Extraordinary destinations
          </span>
          <span>
            <HeartHandshake size={17} /> Meaningful connections
          </span>
          <span>
            <Compass size={17} /> Travel with purpose
          </span>
          <span>
            <Gem size={17} /> Thoughtfully curated
          </span>
        </div>
      </section>
      <section className="intro-section section-space" id="welcome">
        <div className="container intro-grid">
          <div>
            <p className="eyebrow">WELCOME TO REIGN IN WEALTH RETREATS</p>
            <h2>
              Some journeys change
              <br />
              your scenery.
              <br />
              <em>Ours expand your world.</em>
            </h2>
          </div>
          <div className="intro-copy">
            <span className="section-index">01 / THE PHILOSOPHY</span>
            <p>
              There is a different kind of wealth. The places that move you. The
              people who understand your ambition. The moment you see what else
              is possible.
            </p>
            <p>
              We bring curious, purpose-driven people together for extraordinary
              travel, cultural discovery, global connection, and room to grow.
              Come for the destination. Leave with a greater vision for your
              life.
            </p>
            <Link href="/experience" className="text-link">
              This is the Reign in Wealth experience <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="upcoming-section section-space">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE UPCOMING COLLECTION · 2026 / 2027</p>
              <h2>
                Where will your
                <br />
                <em>next chapter take you?</em>
              </h2>
            </div>
            <div className="section-heading-aside">
              <p>
                Four destinations. A world of possibility.
                <br />
                Every journey, a new perspective.
              </p>
              <Link href="/retreats" className="text-link">
                Explore all retreats <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <div className="retreat-grid retreat-grid-four">
            {retreats.slice(0, 4).map((r, i) => (
              <RetreatCard key={r.id} retreat={r} index={i} />
            ))}
          </div>
        </div>
      </section>
      <section className="experience-feature">
        <div className="experience-visual">
          <img
            src="/images/experience.webp"
            alt="Quiet coastal scenery inviting a slower pace of travel"
            loading="lazy"
            width="1100"
            height="1300"
          />
          <div className="visual-caption">
            <span>TAKE THE SCENIC ROUTE</span>
            <p>
              Make space for
              <br />
              <em>something extraordinary.</em>
            </p>
          </div>
        </div>
        <div className="experience-content">
          <p className="eyebrow light">TRAVEL THAT GOES DEEPER</p>
          <h2>
            Beautiful places.
            <br />
            Bigger perspectives.
            <br />
            <em>Lasting connections.</em>
          </h2>
          <p>
            Luxury is only the beginning. Our retreats bring together the
            experiences that make a life feel rich.
          </p>
          <div className="experience-rows">
            <Link href="/experience#explore">
              <span>01</span>
              <div>
                <h3>Explore & experience</h3>
                <p>Culture, adventure, and a fresh point of view.</p>
              </div>
              <ArrowUpRight size={18} />
            </Link>
            <Link href="/experience#connect">
              <span>02</span>
              <div>
                <h3>Connect & invest</h3>
                <p>Global relationships and new possibilities.</p>
              </div>
              <ArrowUpRight size={18} />
            </Link>
            <Link href="/experience#transform">
              <span>03</span>
              <div>
                <h3>Transform & reign</h3>
                <p>Faith, purpose, and space to grow.</p>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <Link href="/experience" className="text-link light">
            Discover our six pillars <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <section className="journal-section section-space">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE TRAVEL JOURNAL</p>
              <h2>
                Places we go.
                <br />
                <em>Stories we carry.</em>
              </h2>
            </div>
            <Link href="/journal" className="text-link">
              Explore the journal <ArrowUpRight size={16} />
            </Link>
          </div>
          <Link href="/journal/ghana-2026" className="journal-feature">
            <div className="journal-image">
              <img
                src="/images/ghana.webp"
                alt="Ghanaian destination landscape"
                loading="lazy"
              />
              <span>WEST AFRICA / GHANA</span>
            </div>
            <div className="journal-copy">
              <p className="eyebrow">THE GHANA CHAPTER · 2026</p>
              <h3>
                A connection to culture.
                <br />
                <em>An invitation to more.</em>
              </h3>
              <p>
                Our Ghana chapter brings the spirit of Reign in Wealth into
                focus: cultural discovery, community, and a wider view of the
                world.
              </p>
              <span className="text-link">
                Discover the Ghana chapter <ArrowUpRight size={16} />
              </span>
              <p className="journal-note">
                Our retreat photo journal is being curated. Featured imagery
                shows the destination.
              </p>
            </div>
          </Link>
        </div>
      </section>
      <section className="founder-strip">
        <div className="container founder-strip-inner">
          <span className="founder-monogram" aria-hidden="true">
            KH
          </span>
          <div>
            <p className="eyebrow">A VISION BY KIMONA HANSON</p>
            <h2>
              Because a bigger world
              <br />
              inspires <em>a bigger vision.</em>
            </h2>
            <p>
              Entrepreneur. Global Realtor. Wealth strategist.
              <br />
              The Millionaire Chick — and the visionary behind the journey.
            </p>
          </div>
          <Link href="/about" className="button button-outline">
            Meet our founder <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      {testimonials.length > 0 && (
        <section className="testimonials-preview section-space">
          <div className="container">
            <p className="eyebrow">IN THEIR OWN WORDS</p>
            <h2>
              The journey, <em>through their eyes.</em>
            </h2>
            <div className="testimonial-grid">
              {testimonials.slice(0, 3).map((t) => (
                <blockquote key={t.id}>
                  <p>“{t.quote}”</p>
                  <footer>
                    {t.name}
                    <span>{t.destination}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
            <Link href="/testimonials" className="text-link">
              More traveler stories <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
      )}
      <section className="faq-section section-space">
        <div className="container faq-layout">
          <div>
            <p className="eyebrow">A LITTLE CLARITY, BEFORE YOU GO</p>
            <h2>
              Every great journey
              <br />
              starts with <em>a question.</em>
            </h2>
            <p>
              We’re here to help you feel confident
              <br />
              about your next experience.
            </p>
            <Link href="/faq" className="text-link">
              See all frequently asked questions <ArrowUpRight size={16} />
            </Link>
          </div>
          <FAQ limit={5} />
        </div>
      </section>
      <CommunityBanner />
    </>
  );
}
