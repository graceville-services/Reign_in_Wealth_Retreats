"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, X, Camera, MapPin } from "lucide-react";
import { galleryAlbums, type GalleryPhoto } from "@/data/gallery";
import { Photo } from "./Photo";

export function GalleryExplorer({
  images,
  initialAlbum = "All",
}: {
  images: GalleryPhoto[];
  initialAlbum?: string;
}) {
  const [album, setAlbum] = useState(initialAlbum);
  const [visibleCount, setVisibleCount] = useState(24);
  const [selected, setSelected] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const albums = useMemo(
    () => ["All", ...Array.from(new Set(images.map((p) => p.album)))],
    [images],
  );
  const filtered = useMemo(
    () => (album === "All" ? images : images.filter((p) => p.album === album)),
    [images, album],
  );
  const shown = filtered.slice(0, visibleCount);
  useEffect(() => {
    setAlbum(initialAlbum);
    setVisibleCount(24);
    setSelected(null);
  }, [initialAlbum]);

  const chooseAlbum = (value: string) => {
    setAlbum(value);
    setVisibleCount(24);
    setSelected(null);
    const url = new URL(window.location.href);
    const slug = galleryAlbums.find((item) => item.name === value)?.slug;
    if (slug) url.searchParams.set("album", slug);
    else url.searchParams.delete("album");
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected !== null) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      if (dialog.open) dialog.close();
      document.body.style.overflow = "";
      lastTriggerRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  const move = (direction: number) => {
    if (!filtered.length) return;
    setSelected((current) =>
      current === null
        ? 0
        : (current + direction + filtered.length) % filtered.length,
    );
  };

  return (
    <div className="gallery-explorer">
      <div className="gallery-toolbar">
        <div
          className="gallery-filters"
          role="group"
          aria-label="Filter photographs by collection"
        >
          {albums.map((value) => (
            <button
              key={value}
              type="button"
              className={`gallery-filter ${album === value ? "is-active" : ""}`}
              aria-pressed={album === value}
              onClick={() => chooseAlbum(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <span className="gallery-count" role="status" aria-live="polite">
          <Camera size={16} aria-hidden="true" /> {filtered.length}{" "}
          {filtered.length === 1 ? "photograph" : "photographs"}
        </span>
      </div>
      <div className="gallery-photo-grid">
        {shown.map((photo, index) => (
          <button
            className={`gallery-photo-card ${photo.portrait ? "gallery-photo-portrait" : ""}`}
            type="button"
            key={`${photo.src}-${index}`}
            aria-label={`Open photograph: ${photo.alt}`}
            onClick={(event) => {
              lastTriggerRef.current = event.currentTarget;
              setSelected(index);
            }}
          >
            <Photo
              photo={photo}
              sizes="(max-width: 420px) 92vw, (max-width: 900px) 46vw, 31vw"
              loading={index < 4 ? "eager" : "lazy"}
            />
            <span className="gallery-photo-shade" aria-hidden="true" />
            <span className="gallery-photo-label">
              <small>{photo.album.toUpperCase()}</small>
              <strong>{photo.caption}</strong>
            </span>
            <Expand
              size={21}
              className="gallery-expand-icon"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      {shown.length < filtered.length && (
        <div className="gallery-load-more">
          <button
            className="button button-outline"
            type="button"
            onClick={() => setVisibleCount((n) => n + 24)}
          >
            Show more photographs <ArrowRight size={17} />
          </button>
        </div>
      )}
      <dialog
        ref={dialogRef}
        className="gallery-fullscreen"
        aria-label="Photo gallery viewer"
        onCancel={(event) => {
          event.preventDefault();
          setSelected(null);
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) setSelected(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
        }}
      >
        <button
          type="button"
          className="gallery-fullscreen-close"
          aria-label="Close photo viewer"
          onClick={() => setSelected(null)}
        >
          <X size={24} />
        </button>
        {selected !== null && filtered[selected] && (
          <div className="gallery-fullscreen-content">
            <div className="gallery-fullscreen-media">
              <img src={filtered[selected].src} alt={filtered[selected].alt} />
            </div>
            <div className="gallery-fullscreen-info">
              <button
                type="button"
                aria-label="Previous photograph"
                onClick={() => move(-1)}
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <span>
                  {selected + 1} / {filtered.length} ·{" "}
                  {filtered[selected].album}
                </span>
                <strong>{filtered[selected].caption}</strong>
                {filtered[selected].location && (
                  <small>
                    <MapPin size={13} /> {filtered[selected].location}
                  </small>
                )}
              </div>
              <button
                type="button"
                aria-label="Next photograph"
                onClick={() => move(1)}
              >
                <ArrowRight size={22} />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
