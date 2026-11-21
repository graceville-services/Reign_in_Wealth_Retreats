import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Compass,
  Globe2,
  HeartHandshake,
} from "lucide-react";
import { getRetreats, getSettings } from "@/lib/server/data";
import { RetreatCard } from "@/components/site/RetreatCard";
import { HeroMedia } from "@/components/site/HeroMedia";
import { Photo } from "@/components/site/Photo";
import { featuredPhotos } from "@/data/gallery";
export default function Home() {
  const retreats = getRetreats();
  const settings = getSettings();
  return (
    <div className="home-overview">
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
            Extraordinary places. People who inspire you.
            <br />A journey that stays with you.
          </p>
          <div className="hero-buttons">
            <Link href="/retreats" className="button button-cream">
              Find your next retreat <ArrowUpRight size={17} />
            </Link>
            <Link href="/gallery" className="hero-text-link">
              See our journey <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="hero-bottom container">
          <a href="#overview" className="scroll-hint">
            <ArrowDown size={14} /> A little closer to our world
          </a>
          <Link href="/journal/ghana-2026" className="hero-location">
            <span className="location-dot" />
            <div>
              <span>FROM OUR RETREAT JOURNAL</span>
              <strong>
                Ghana, through our eyes <ArrowUpRight size={14} />
              </strong>
            </div>
          </Link>
        </div>
      </section>
      <div className="brand-values">
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
        </div>
      </div>
      <section className="overview-moments" id="overview">
        <div className="container">
          <div className="overview-heading">
            <div>
              <p className="eyebrow">A GLIMPSE OF THE EXPERIENCE</p>
              <h2>
                Beautiful places.
                <br />
                <em>Even better company.</em>
              </h2>
            </div>
            <div>
              <p>
                Culture, connection, and room to grow. Our Ghana moments offer a
                glimpse of what it means to travel with Reign in Wealth.
              </p>
              <Link href="/experience" className="text-link">
                Discover the experience <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <div className="overview-photo-grid">
            <Link
              href="/gallery?album=arrival#photographs"
              className="overview-photo overview-photo-wide"
            >
              <Photo
                photo={featuredPhotos.arrival}
                sizes="(max-width: 640px) 92vw, 46vw"
              />
              <div>
                <span>01 / CONNECTION</span>
                <h3>Arrive as you are.</h3>
              </div>
              <ArrowUpRight size={21} />
            </Link>
            <Link
              href="/gallery?album=explore-ghana#photographs"
              className="overview-photo"
            >
              <Photo
                photo={featuredPhotos.waterfall}
                sizes="(max-width: 640px) 44vw, 23vw"
              />
              <div>
                <span>02 / DISCOVERY</span>
                <h3>Go a little further.</h3>
              </div>
              <ArrowUpRight size={21} />
            </Link>
            <Link
              href="/gallery?album=giving-back#photographs"
              className="overview-photo"
            >
              <Photo
                photo={featuredPhotos.community}
                sizes="(max-width: 640px) 44vw, 23vw"
              />
              <div>
                <span>03 / PURPOSE</span>
                <h3>Leave with more.</h3>
              </div>
              <ArrowUpRight size={21} />
            </Link>
          </div>
          <div className="overview-caption">
            <span>Photographs from our Ghana retreat · 2026</span>
            <Link href="/gallery" className="text-link">
              View the full gallery <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <section className="upcoming-section section-space">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE UPCOMING COLLECTION</p>
              <h2>
                Your next <em>chapter.</em>
              </h2>
            </div>
            <Link href="/retreats" className="text-link">
              Explore all retreats <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="retreat-grid retreat-grid-four">
            {retreats.slice(0, 4).map((retreat, index) => (
              <RetreatCard key={retreat.id} retreat={retreat} index={index} />
            ))}
          </div>
        </div>
      </section>
      <section className="overview-invitation">
        <div className="container">
          <div>
            <p className="eyebrow light">YOUR WORLD, A LITTLE WIDER</p>
            <h2>
              Come for the journey.
              <br />
              <em>Stay for the connection.</em>
            </h2>
          </div>
          <div>
            <Link className="button button-cream" href="/community">
              Join our global community <ArrowUpRight size={17} />
            </Link>
            <Link className="text-link light" href="/about">
              The vision behind Reign in Wealth <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
