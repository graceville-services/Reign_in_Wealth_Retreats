import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Globe2, Compass, HeartHandshake } from "lucide-react";
import { getSettings } from "@/lib/server/data";
import { CommunityBanner } from "@/components/site/PageIntro";
export const metadata: Metadata = {
  title: "Our story & founder",
  description:
    "Meet Kimona Hanson, The Millionaire Chick, and discover the vision behind Reign in Wealth Retreats.",
};
export default function AboutPage() {
  const s = getSettings();
  return (
    <>
      <section className="about-hero section-space">
        <div className="container about-grid">
          <div className="about-portrait">
            {s.founderImage ? (
              <img
                src={s.founderImage}
                alt="Kimona Hanson, founder of Reign in Wealth Retreats"
              />
            ) : (
              <div className="founder-editorial">
                <div className="editorial-orbit" />
                <p className="eyebrow light">THE VISION BEHIND THE JOURNEY</p>
                <span className="editorial-monogram">KH</span>
                <h2>Kimona Hanson</h2>
                <p>The Millionaire Chick</p>
                <span className="editorial-caption">
                  FAITH · VISION · GLOBAL POSSIBILITY
                </span>
              </div>
            )}
          </div>
          <div className="about-intro">
            <p className="eyebrow">MEET OUR FOUNDER</p>
            <h1>
              A global vision.
              <br />
              <em>A personal purpose.</em>
            </h1>
            <p className="lead-paragraph">
              Meet Kimona Hanson.
              <br />
              The Millionaire Chick.
            </p>
            <p>
              Entrepreneur, global Realtor, investor, wealth strategist,
              speaker, and faith-driven visionary. Kimona believes that exposure
              changes perspective — and that travel can open doors to
              extraordinary opportunities.
            </p>
            <p>
              Reign in Wealth Retreats brings that belief to life through
              meaningful global connections, cultural exploration, and
              experiences that invite people to think beyond what they already
              know.
            </p>
            <Link href="/retreats" className="button button-primary">
              Experience the vision <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="about-mission section-space">
        <div className="container intro-grid">
          <div>
            <p className="eyebrow">WHY WE EXIST</p>
            <h2>
              Open the world.
              <br />
              <em>Open a possibility.</em>
            </h2>
          </div>
          <div className="intro-copy">
            <p>
              Some of our most meaningful growth happens when we step into a new
              environment, listen to another story, or meet someone who sees
              possibility where we once saw limits.
            </p>
            <p>
              Our mission is to create that space: a thoughtfully curated global
              community where luxury travel, purpose, culture, faith, and
              wealth-building education come together.
            </p>
            <p>
              For entrepreneurs, professionals, investors, and people ready for
              a wider life, the invitation is simple: come curious. Connect
              deeply. Experience more.
            </p>
          </div>
        </div>
      </section>
      <section className="section-space">
        <div className="container">
          <p className="eyebrow">PART OF A GREATER STORY</p>
          <div className="section-heading">
            <h2>
              A distinct journey.
              <br />
              <em>A shared vision.</em>
            </h2>
            <p>
              Reign in Wealth Retreats is a distinct business
              <br />
              within The Millionaire Chick brand family.
            </p>
          </div>
          <div className="brand-family">
            <div>
              <Globe2 size={27} />
              <h3>The Millionaire Chick</h3>
              <p>
                The founder brand, connecting global wealth, entrepreneurship,
                and lifestyle.
              </p>
              {s.parentBrandUrl && (
                <a
                  className="text-link"
                  href={s.parentBrandUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explore the parent brand <ArrowUpRight size={15} />
                </a>
              )}
            </div>
            <div>
              <Compass size={27} />
              <h3>Reign in Wealth Retreats</h3>
              <p>
                Luxury international travel, cultural discovery, meaningful
                connection, and investment exposure.
              </p>
              <Link className="text-link" href="/experience">
                Explore our experience <ArrowUpRight size={15} />
              </Link>
            </div>
            <div>
              <HeartHandshake size={27} />
              <h3>A wider community</h3>
              <p>
                Connected by a vision that includes wealth education,
                conferences, real estate, media, faith, and community.
              </p>
              <Link className="text-link" href="/community">
                Join the community <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <CommunityBanner />
    </>
  );
}
