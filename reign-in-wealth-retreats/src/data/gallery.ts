import imported from "./gallery-photos.json";

/** Owner-supplied photographs, published as local, metadata-free WebP assets. */
export type GalleryPhoto = {
  src: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  thumbnailWidth?: number;
  album: string;
  alt: string;
  caption: string;
  location?: string;
  portrait?: boolean;
};
export const approvedGalleryPhotos: GalleryPhoto[] = imported as GalleryPhoto[];
function photo(name: string): GalleryPhoto {
  const match = approvedGalleryPhotos.find((item) =>
    item.src.endsWith(`/${name}.webp`),
  );
  if (!match) throw new Error(`Missing curated photograph: ${name}`);
  return match;
}
export const featuredPhotos = {
  arrival: photo("arrival-edi-14-2"),
  conversation: photo("arrival-edi-7-2"),
  waterfall: photo("explore-edi-1"),
  exploring: photo("explore-bk7a1549"),
  nature: photo("explore-bk7a1538"),
  community: photo("community-edi-12"),
  giving: photo("community-edi-3"),
  table: photo("community-edi-37"),
  meal: photo("community-edi-46"),
};
export const galleryAlbums = [
  {
    name: "Arrival & connection",
    slug: "arrival",
    label: "A warm welcome",
    image: featuredPhotos.arrival,
  },
  {
    name: "Giving back",
    slug: "giving-back",
    label: "Travel with purpose",
    image: featuredPhotos.community,
  },
  {
    name: "Around the table",
    slug: "around-the-table",
    label: "Good food. Better company.",
    image: featuredPhotos.table,
  },
  {
    name: "Explore Ghana",
    slug: "explore-ghana",
    label: "Make room for wonder",
    image: featuredPhotos.waterfall,
  },
];
