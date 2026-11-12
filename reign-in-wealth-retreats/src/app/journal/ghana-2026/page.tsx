import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Camera } from "lucide-react";
import { CommunityBanner } from "@/components/site/PageIntro";
export const metadata: Metadata = {
  title: "The Ghana chapter · 2026",
  description:
    "The Ghana chapter of Reign in Wealth Retreats. Explore the vision and discover our upcoming Ghana 2027 retreat.",
};
export default function GhanaJournal() {
  return (
    <>
      <section className="retreat-hero journal-hero">
        <img src="/images/ghana.webp" alt="Black Star Gate in Accra, Ghana" />
        <div className="hero-shade" />
        <div className="container">
          <Link href="/journal" className="breadcrumb light">
            <ArrowLeft size={15} />
            Back to the journal
          </Link>
          <div className="retreat-hero-title">
            <p className="eyebrow light">THE TRAVEL JOURNAL / GHANA 2026</p>
            <h1>
              A connection to culture.<em>An invitation to more.</em>
            </h1>
          </div>
        </div>
      </section>
      <article className="journal-article section-space">
        <p className="eyebrow">GHANA, WEST AFRICA</p>
        <h2>
          A chapter rooted in
          <br />
          <em>connection and possibility.</em>
        </h2>
        <p className="lead-paragraph">
          Ghana 2026 is the first chapter in our retreat journal — a place to
          share the experiences, reflections, and connections that bring Reign
          in Wealth to life.
        </p>
        <p>
          Our vision for travel in Ghana brings culture and history into
          conversation with community, real estate exploration, and personal
          growth. It is an invitation to look more closely, listen with
          curiosity, and discover a wider view of the world.
        </p>
        <div className="journal-coming">
          <Camera size={27} />
          <div>
            <h3>The full story is on its way.</h3>
            <p>
              We’re curating the Ghana 2026 retreat photographs, highlights, and
              traveler reflections. Authentic event images and testimonials will
              appear here once approved for sharing.
            </p>
          </div>
        </div>
        <figure>
          <img
            src="/images/ghana-detail.webp"
            alt="Aerial view of the coast at Accra, Ghana"
            loading="lazy"
          />
          <figcaption>
            Destination photography from Ghana. This image is not a photograph
            of retreat participants.
          </figcaption>
        </figure>
        <h2>
          Your Ghana chapter
          <br />
          <em>could be next.</em>
        </h2>
        <p>
          Our next Ghana retreat is planned for August 5–15, 2027. Explore the
          upcoming experience and join the interest list for confirmed package
          details.
        </p>
        <Link className="button button-primary" href="/retreats/ghana-2027">
          Discover Ghana 2027 <ArrowUpRight size={17} />
        </Link>
      </article>
      <CommunityBanner />
    </>
  );
}
