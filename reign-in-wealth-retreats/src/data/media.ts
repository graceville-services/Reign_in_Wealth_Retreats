import { approvedGalleryPhotos, featuredPhotos } from "./gallery";
import type { Retreat } from "@/lib/types";
export const destinationArtwork = {
  dubai: "/images/illustrations/dubai.svg",
  zanzibar: "/images/illustrations/zanzibar.svg",
  dominican: "/images/illustrations/dominican-republic.svg",
};
// Resolve old SQLite seed paths without changing bookings or owner-edited content.
const legacyImages: Record<string, string> = {
  "/images/dubai.webp": destinationArtwork.dubai,
  "/images/dubai-detail.webp": destinationArtwork.dubai,
  "/images/zanzibar.webp": destinationArtwork.zanzibar,
  "/images/hero-zanzibar.webp": destinationArtwork.zanzibar,
  "/images/zanzibar-coast.webp": destinationArtwork.zanzibar,
  "/images/experience.webp": destinationArtwork.zanzibar,
  "/images/dominican-republic.webp": destinationArtwork.dominican,
  "/images/ghana.webp": featuredPhotos.exploring.src,
  "/images/ghana-detail.webp": featuredPhotos.waterfall.src,
};
export function resolveRetreatMedia(retreat: Retreat): Retreat {
  const resolve = (src: string) => legacyImages[src] || src;
  return {
    ...retreat,
    image: resolve(retreat.image),
    heroImage: resolve(retreat.heroImage),
    gallery: Array.from(new Set(retreat.gallery.map(resolve))),
    hotelDescription:
      retreat.hotelDescription?.replace(
        "Destination photography is for inspiration and does not identify a contracted hotel.",
        "The imagery shown does not identify a contracted hotel.",
      ) ?? retreat.hotelDescription,
  };
}
export function isDestinationArtwork(src: string) {
  return src.startsWith("/images/illustrations/");
}
export function describeRetreatImage(src: string, destination: string) {
  return (
    approvedGalleryPhotos.find((photo) => photo.src === src)?.alt ||
    (isDestinationArtwork(src)
      ? `Original destination illustration inspired by ${destination}`
      : `${destination} retreat imagery`)
  );
}
export function retreatMediaCaption(images: string[]) {
  if (images.every(isDestinationArtwork))
    return "Original destination illustration. Accommodation and activity photographs will be shared with the confirmed retreat details.";
  if (
    images.every((src) =>
      approvedGalleryPhotos.some((photo) => photo.src === src),
    )
  )
    return "Photographs from our Ghana 2026 retreat. Activities and accommodation for the upcoming journey will be confirmed separately.";
  return "Retreat imagery. Please refer to the confirmed package for accommodation and activity details.";
}
