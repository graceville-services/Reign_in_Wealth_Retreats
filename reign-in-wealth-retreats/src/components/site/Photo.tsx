import type { ImgHTMLAttributes } from "react";
import type { GalleryPhoto } from "@/data/gallery";
type Props = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet" | "alt"
> & { photo: GalleryPhoto };
/** Pre-sized files avoid an image-processing dependency on shared hosting. */
export function Photo({
  photo,
  sizes = "(max-width: 640px) 100vw, 50vw",
  ...props
}: Props) {
  const responsive =
    photo.thumbnail &&
    photo.thumbnailWidth &&
    photo.width &&
    photo.thumbnailWidth < photo.width;
  return (
    <img
      src={photo.src}
      srcSet={
        responsive
          ? `${photo.thumbnail} ${photo.thumbnailWidth}w, ${photo.src} ${photo.width}w`
          : undefined
      }
      sizes={responsive ? sizes : undefined}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
