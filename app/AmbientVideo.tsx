"use client";

import { useEffect, useRef, useState } from "react";
import MediaSkeleton, { useMediaLoaded } from "./MediaSkeleton";

/** `skeleton` renders a MediaSkeleton sibling (absolute inset-0 in the parent) until
 *  the first frame is available — the parent must be positioned. */
export default function AmbientVideo({
  src,
  children,
  skeleton,
  ...props
}: React.VideoHTMLAttributes<HTMLVideoElement> & { skeleton?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const { loaded, mediaRef, onLoadedData, onError } = useMediaLoaded();
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

  const video = (
    <video
      ref={(el) => { ref.current = el; mediaRef(el); }}
      muted
      loop
      playsInline
      preload="none"
      {...props}
      onLoadedData={(e) => { onLoadedData(); props.onLoadedData?.(e); }}
      onError={(e) => { onError(); props.onError?.(e); }}
      src={shouldLoad ? src : undefined}
    >
      {shouldLoad ? children : null}
    </video>
  );

  if (!skeleton) return video;
  return (
    <>
      <MediaSkeleton hidden={loaded} />
      {video}
    </>
  );
}
