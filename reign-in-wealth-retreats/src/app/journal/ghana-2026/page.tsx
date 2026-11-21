import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CommunityBanner } from "@/components/site/PageIntro";
import { Photo } from "@/components/site/Photo";
import { featuredPhotos, galleryAlbums } from "@/data/gallery";
export const metadata: Metadata = {
  title: "The Ghana chapter · 2026",
  description:
    "Our Ghana retreat in photographs: arrival, giving back, shared meals, and moments of discovery with Reign in Wealth.",
  openGraph: { images: [{ url: "/images/retreats-share.jpg" }] },
};
export default function GhanaJournal() {
  return (
    <>
      <section className="retreat-hero journal-hero">
        <Photo
          photo={featuredPhotos.arrival}
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <div className="container">
          <Link href="/journal" className="breadcrumb light">
            <ArrowLeft size={15} /> Back to the journal
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
        <p className="eyebrow">GHANA, THROUGH OUR EYES</p>
        <h2>
          The places bring us here.
          <br />
          <em>The people stay with us.</em>
        </h2>
        <p className="lead-paragraph">
          Our Ghana chapter, told in the moments we brought home: the welcome,
          the conversations, time with our local hosts, and the wonder of seeing
          somewhere together.
        </p>
        <p>
          These photographs offer a glimpse into the Reign in Wealth experience.
          A shared meal becomes a conversation. A new place becomes a memory.
          And the journey becomes something to carry with you.
        </p>
        <div className="journal-album-grid">
          {galleryAlbums.map((album, index) => (
            <Link
              key={album.slug}
              href={`/gallery?album=${album.slug}#photographs`}
            >
              <Photo
                photo={album.image}
                sizes="(max-width: 640px) 92vw, 360px"
              />
              <span className="eyebrow">
                0{index + 1} / {album.name.toUpperCase()}
              </span>
              <h3>{album.label}</h3>
              <span className="text-link">
                Explore the collection <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
        <figure>
          <Photo
            photo={featuredPhotos.nature}
            sizes="(max-width: 800px) 92vw, 760px"
          />
          <figcaption>A moment of discovery from our Ghana retreat.</figcaption>
        </figure>
        <h2>
          Your Ghana chapter
          <br />
          <em>could be next.</em>
        </h2>
        <p>
          Explore our upcoming Ghana journey and join the interest list for
          confirmed package details.
        </p>
        <Link className="button button-primary" href="/retreats/ghana-2027">
          Discover the next Ghana retreat <ArrowUpRight size={17} />
        </Link>
      </article>
      <CommunityBanner />
    </>
  );
}
