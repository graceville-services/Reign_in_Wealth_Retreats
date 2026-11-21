"use client";
import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { featuredPhotos } from "@/data/gallery";
import { Photo } from "./Photo";
export function HeroMedia({ video }: { video: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  if (!video)
    return (
      <Photo
        photo={featuredPhotos.waterfall}
        className="hero-image"
        sizes="(max-width: 640px) 100vw, 58vw"
        loading="eager"
        fetchPriority="high"
      />
    );
  return (
    <>
      <video
        ref={ref}
        className="hero-image"
        poster={featuredPhotos.waterfall.src}
        muted
        loop
        playsInline
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={video} />
      </video>
      <button
        className="hero-video-toggle"
        onClick={() => {
          if (playing) ref.current?.pause();
          else void ref.current?.play().catch(() => setPlaying(false));
        }}
        aria-label={playing ? "Pause retreat film" : "Play retreat film"}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
        <span>{playing ? "Pause film" : "Play film"}</span>
      </button>
    </>
  );
}
