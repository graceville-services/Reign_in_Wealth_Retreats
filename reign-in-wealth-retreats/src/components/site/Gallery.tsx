"use client";
import { useEffect, useRef, useState } from "react";
import { Expand, X, ArrowLeft, ArrowRight } from "lucide-react";
import { describeRetreatImage, retreatMediaCaption } from "@/data/media";
export function Gallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (selected !== null) {
      if (dialog.current && !dialog.current.open) dialog.current.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
      lastTrigger.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);
  const move = (d: number) =>
    setSelected((v) =>
      v === null ? 0 : (v + d + images.length) % images.length,
    );
  return (
    <>
      <div className="destination-gallery">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            onClick={(e) => {
              lastTrigger.current = e.currentTarget;
              setSelected(i);
            }}
            aria-label={`View ${title} image ${i + 1}`}
          >
            <img
              src={src}
              alt={describeRetreatImage(src, title)}
              loading="lazy"
            />
            <Expand size={17} />
          </button>
        ))}
      </div>
      <p className="image-caption">
        {retreatMediaCaption(images)}
      </p>
      <dialog
        ref={dialog}
        className="gallery-dialog"
        aria-label={`${title} destination gallery`}
        onCancel={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setSelected(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") move(-1);
          if (e.key === "ArrowRight") move(1);
        }}
      >
        <button
          className="gallery-close"
          onClick={() => setSelected(null)}
          aria-label="Close gallery"
        >
          <X />
        </button>
        {selected !== null && (
          <>
            <img
              src={images[selected]}
              alt={describeRetreatImage(images[selected], title)}
            />
            <div className="gallery-controls">
              <button onClick={() => move(-1)} aria-label="Previous photograph">
                <ArrowLeft />
              </button>
              <span>
                {selected + 1} / {images.length} · {title}
              </span>
              <button onClick={() => move(1)} aria-label="Next photograph">
                <ArrowRight />
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
