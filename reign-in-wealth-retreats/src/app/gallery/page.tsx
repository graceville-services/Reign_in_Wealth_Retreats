import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Camera, ArrowDownRight } from "lucide-react";
import { GalleryExplorer } from "@/components/site/GalleryExplorer";
import { CommunityBanner } from "@/components/site/PageIntro";
import { approvedGalleryPhotos, inspirationPhotos } from "@/data/gallery";

export const metadata: Metadata = {
  title: "The gallery · Travel stories in photographs",
  description: "A visual journal of Reign in Wealth Retreats and destinations that inspire our global community.",
  openGraph: { images: [{ url: "/images/ghana-detail.webp" }] },
};

export default function GalleryPage() {
  const hasRetreatPhotos = approvedGalleryPhotos.length > 0;
  const images = hasRetreatPhotos ? approvedGalleryPhotos : inspirationPhotos;
  const heroImage = hasRetreatPhotos ? approvedGalleryPhotos[0].src : "/images/ghana-detail.webp";

  return (
    <>
      <section className="photo-gallery-hero">
        <img className="photo-gallery-hero-media" src={heroImage} alt={hasRetreatPhotos ? "Reign in Wealth Retreats photography" : "Ghanaian coastline, destination inspiration"} />
        <div className="photo-gallery-hero-shade" />
        <div className="container photo-gallery-hero-content">
          <p className="eyebrow light"><span className="small-rule" /> THE REIGN IN WEALTH VISUAL JOURNAL</p>
          <h1>Places we explore.<br /><em>Moments we keep.</em></h1>
          <p>Travel is more than somewhere you go. It&apos;s the perspective, the connections, and the stories you carry home.</p>
          <a className="photo-gallery-discover" href="#photographs">Explore the photographs <ArrowDownRight size={18} /></a>
        </div>
        <span className="photo-gallery-hero-index">A WORLD OF POSSIBILITY &nbsp; / &nbsp; THE GALLERY</span>
      </section>

      <section className="section-space gallery-main" id="photographs">
        <div className="container">
          <div className="gallery-section-intro">
            <div>
              <p className="eyebrow">THE STORIES, FRAME BY FRAME</p>
              <h2>{hasRetreatPhotos ? <>A life well travelled.<br /><em>Beautifully remembered.</em></> : <>The world awaits.<br /><em>Take a closer look.</em></>}</h2>
            </div>
            <div className="gallery-section-side">
              <p>{hasRetreatPhotos ? "A collection of photographs chosen from our international retreat experiences. Every journey leaves a story worth sharing." : "A first look at the places that inspire our journeys. Our original retreat photography will appear here after the images have been reviewed and approved."}</p>
              <span className="gallery-editorial-marker"><Camera size={15} /> {hasRetreatPhotos ? "THE RETREAT COLLECTION" : "CURATED DESTINATION PHOTOGRAPHY"}</span>
            </div>
          </div>
          {!hasRetreatPhotos && (
            <div className="gallery-photo-disclaimer">
              The images below are destination inspiration, not photographs of our past retreat participants. Our Ghana 2026 photo collection is being curated.
            </div>
          )}
          <GalleryExplorer images={images} isInspiration={!hasRetreatPhotos} />
        </div>
      </section>
      <section className="gallery-story-cta">
        <div className="container gallery-story-cta-inner">
          <div>
            <p className="eyebrow light">MAKE YOUR OWN MEMORIES</p>
            <h2>Your next story<br /><em>starts somewhere new.</em></h2>
          </div>
          <Link className="button button-cream" href="/retreats">Explore upcoming retreats <ArrowUpRight size={18} /></Link>
        </div>
      </section>
      <CommunityBanner />
    </>
  );
}
