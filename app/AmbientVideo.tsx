"use client";

import { useEffect, useRef, useState } from "react";

export default function AmbientVideo({
  src,
  children,
  ...props
}: React.VideoHTMLAttributes<HTMLVideoElement>) {
  const ref = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    let onScreen = false;
    const onPlay = () => {
      if (!onScreen) v.pause();
    };
    v.addEventListener("play", onPlay);
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) {
          setShouldLoad(true);
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { rootMargin: "50% 0px" }
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.removeEventListener("play", onPlay);
    };
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    const v = ref.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [shouldLoad]);

  return (
    <video ref={ref} muted loop playsInline preload="none" {...props} src={shouldLoad ? src : undefined}>
      {shouldLoad ? children : null}
    </video>
  );
}
