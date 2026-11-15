import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro, CommunityBanner } from "@/components/site/PageIntro";
export const metadata: Metadata = {
  title: "The travel journal",
  description:
    "Destination inspiration and the stories behind Reign in Wealth Retreats, starting with our Ghana chapter.",
};
export default function JournalPage() {
  return (
    <>
      <PageIntro
        eyebrow="THE TRAVEL JOURNAL"
        title="The places. The people."
        italic="The perspective."
        description="A collection of chapters from our world — and an invitation to imagine your own."
      />
      <section className="section-space section-top-small">
        <div className="container">
          <Link className="journal-feature" href="/journal/ghana-2026">
            <div className="journal-image">
              <img src="/images/ghana.webp" alt="Ghana destination landscape" />
              <span>THE GHANA CHAPTER / 2026</span>
            </div>
            <div className="journal-copy">
              <p className="eyebrow">GHANA, WEST AFRICA</p>
              <h2>
                Culture. Community.
                <br />
                <em>A wider world.</em>
              </h2>
              <p>
                Discover the spirit behind our Ghana chapter: a connection to
                heritage, purpose, and possibility.
              </p>
              <span className="text-link">
                Explore the chapter <ArrowUpRight size={17} />
              </span>
              <p className="journal-note">
                The full retreat recap is being curated. Images shown are
                destination photography.
              </p>
            </div>
          </Link>
          <div className="journal-next">
            <p className="eyebrow">THE NEXT CHAPTERS</p>
            <h2>
              The story <em>continues.</em>
            </h2>
            <div className="journal-next-grid">
              <Link href="/retreats/dubai-2026">
                <img
                  src="/images/dubai.webp"
                  alt="Dubai skyline"
                  loading="lazy"
                />
                <span>
                  Dubai <ArrowUpRight size={19} />
                </span>
              </Link>
              <Link href="/retreats/zanzibar-2027">
                <img
                  src="/images/hero-zanzibar.webp"
                  alt="Zanzibar coastline"
                  loading="lazy"
                />
                <span>
                  Zanzibar <ArrowUpRight size={19} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="container" style={{paddingBottom: "90px"}}><Link href="/gallery" className="button button-primary">Explore the photo gallery <ArrowUpRight size={17} /></Link></section>
      <CommunityBanner />
    </>
  );
}
