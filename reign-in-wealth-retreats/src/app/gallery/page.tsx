import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Camera, ArrowDownRight } from "lucide-react";
import { GalleryExplorer } from "@/components/site/GalleryExplorer";
import { Photo } from "@/components/site/Photo";
import {
  approvedGalleryPhotos,
  featuredPhotos,
  galleryAlbums,
} from "@/data/gallery";
export const metadata: Metadata = {
  title: "The gallery · Our Ghana retreat in photographs",
  description:
    "Explore our Ghana retreat through arrival, community visits, shared meals, and moments of discovery. The Reign in Wealth photo journal.",
  openGraph: { images: [{ url: "/images/retreats-share.jpg" }] },
};
export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ album?: string | string[] }>;
}) {
  const query = await searchParams;
  const initialAlbum =
    galleryAlbums.find((item) => item.slug === query.album)?.name || "All";
  return (
    <>
      <section className="photo-gallery-hero">
        <Photo
          photo={featuredPhotos.exploring}
          className="photo-gallery-hero-media"
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
        />
        <div className="photo-gallery-hero-shade" />
        <div className="container photo-gallery-hero-content">
          <p className="eyebrow light">
            <span className="small-rule" /> THE GHANA COLLECTION · 2026
          </p>
          <h1>
            The people.
            <br />
            <em>The moments.</em>
          </h1>
          <p>
            A warm welcome. A shared table. A little wonder along the way. Step
            inside our journey.
          </p>
          <a className="photo-gallery-discover" href="#photographs">
            Explore the photographs <ArrowDownRight size={18} />
          </a>
        </div>
        <span className="photo-gallery-hero-index">
          REIGN IN WEALTH / THROUGH OUR EYES
        </span>
      </section>
      <section className="section-space gallery-main" id="photographs">
        <div className="container">
          <div className="gallery-section-intro">
            <div>
              <p className="eyebrow">THE STORIES, FRAME BY FRAME</p>
              <h2>
                A life well travelled.
                <br />
                <em>Beautifully remembered.</em>
              </h2>
            </div>
            <div className="gallery-section-side">
              <p>
                From our first gathering to the places we explored together.
                Choose a collection, or wander through every moment.
              </p>
              <span className="gallery-editorial-marker">
                <Camera size={15} /> {approvedGalleryPhotos.length} PHOTOGRAPHS
                · FOUR COLLECTIONS
              </span>
            </div>
          </div>
          <GalleryExplorer
            images={approvedGalleryPhotos}
            initialAlbum={initialAlbum}
          />
        </div>
      </section>
      <section className="gallery-story-cta">
        <div className="container gallery-story-cta-inner">
          <div>
            <p className="eyebrow light">MAKE YOUR OWN MEMORIES</p>
            <h2>
              Your next story
              <br />
              <em>starts somewhere new.</em>
            </h2>
          </div>
          <Link className="button button-cream" href="/retreats">
            Explore upcoming retreats <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
