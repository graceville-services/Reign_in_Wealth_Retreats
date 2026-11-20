import imported from "./gallery-photos.json";

/**
 * Gallery content is curated and committed with the site; importing is an
 * explicit editorial step. Do not render remote Drive share URLs in production.
 */
export type GalleryPhoto = {
  src: string;
  album: string;
  alt: string;
  caption: string;
  location?: string;
  portrait?: boolean;
};

export const approvedGalleryPhotos: GalleryPhoto[] = imported as GalleryPhoto[];

/** Concept photography already bundled with the site, not photographs of guests. */
export const inspirationPhotos: GalleryPhoto[] = [
  {
    src: "/images/ghana.webp",
    album: "Ghana",
    alt: "Architectural landmark in Ghana",
    caption: "A wider world begins with a new perspective",
    location: "Ghana",
  },
  {
    src: "/images/zanzibar-coast.webp",
    album: "Zanzibar",
    alt: "Turquoise sea along the Zanzibar coastline",
    caption: "The beauty of slowing down",
    location: "Zanzibar, Tanzania",
  },
  {
    src: "/images/dubai-detail.webp",
    album: "Dubai",
    alt: "Warm skyline of Dubai at golden hour",
    caption: "Possibility beyond the familiar",
    location: "Dubai, UAE",
  },
  {
    src: "/images/ghana-detail.webp",
    album: "Ghana",
    alt: "Aerial view of the Ghanaian coast",
    caption: "A coast full of stories",
    location: "Ghana",
  },
  {
    src: "/images/hero-zanzibar.webp",
    album: "Zanzibar",
    alt: "Palm-fringed coastline in Zanzibar",
    caption: "Find room for wonder",
    location: "Zanzibar, Tanzania",
  },
  {
    src: "/images/dominican-republic.webp",
    album: "Dominican Republic",
    alt: "Tropical beachfront in the Dominican Republic",
    caption: "New horizons await",
    location: "Dominican Republic",
  },
  {
    src: "/images/dubai.webp",
    album: "Dubai",
    alt: "Dubai skyline and city waterfront",
    caption: "Where ambition meets imagination",
    location: "Dubai, UAE",
  },
  {
    src: "/images/experience.webp",
    album: "Zanzibar",
    alt: "Calm coastal setting and lush tropical scenery",
    caption: "Experience more of the world",
    location: "Destination inspiration",
  },
];
