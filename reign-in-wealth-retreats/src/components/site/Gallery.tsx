"use client";
import { useEffect, useRef, useState } from "react";
import { Expand, X, ArrowLeft, ArrowRight } from "lucide-react";
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
      dialog.current?.showModal();
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
            aria-label={`View ${title} destination photograph ${i + 1}`}
          >
            <img
              src={src}
              alt={`${title} destination inspiration ${i + 1}`}
              loading="lazy"
            />
            <Expand size={17} />
          </button>
        ))}
      </div>
      <p className="image-caption">
        Destination photography for inspiration. Confirmed accommodation and
        retreat images will be shared with the final package.
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
              alt={`${title} destination photograph ${selected + 1}`}
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
