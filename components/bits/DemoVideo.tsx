"use client";

import { useEffect, useRef, useState } from "react";

type Source = { src: string; type: string };

/**
 * A muted looping recording over its poster. Nothing downloads until the card
 * nears the screen; it plays while at least 40% visible and pauses otherwise.
 * It fades in once actually playing, so the poster shows until then. With
 * reduced motion it never loads and the poster stays.
 */
export function DemoVideo({ sources, className = "" }: { sources: Source[]; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLoad(true);
        near.disconnect();
      },
      { rootMargin: "300px 0px" },
    );
    const visible = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.4) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: [0, 0.4] },
    );
    near.observe(video);
    visible.observe(video);
    return () => {
      near.disconnect();
      visible.disconnect();
    };
  }, []);

  useEffect(() => {
    // Sources were just added: start fetching, and play if already in view.
    if (!load) return;
    const video = ref.current!;
    video.load();
    const rect = video.getBoundingClientRect();
    const shown = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
    if (shown >= rect.height * 0.4) video.play().catch(() => {});
  }, [load]);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setPlaying(true)}
      className={`demo-video ${playing ? "opacity-100" : "opacity-0"} ${className}`}
    >
      {load && sources.map((source) => <source key={source.src} src={source.src} type={source.type} />)}
    </video>
  );
}
