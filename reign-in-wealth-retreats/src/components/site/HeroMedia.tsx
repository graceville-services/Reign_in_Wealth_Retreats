"use client";
import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
export function HeroMedia({ video }: { video: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  if (!video)
    return (
      <img
        src="/images/hero-zanzibar.webp"
        alt="Turquoise water and the palm-fringed coast of Zanzibar"
        className="hero-image"
        fetchPriority="high"
        width="1920"
        height="1280"
      />
    );
  return (
    <>
      <video
        ref={ref}
        className="hero-image"
        poster="/images/hero-zanzibar.webp"
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
        onClick={() => (playing ? ref.current?.pause() : ref.current?.play())}
        aria-label={
          playing ? "Pause destination film" : "Play destination film"
        }
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
        <span>{playing ? "Pause film" : "Play film"}</span>
      </button>
    </>
  );
}
