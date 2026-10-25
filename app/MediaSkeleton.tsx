"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useEffect, useState, type CSSProperties, type ImgHTMLAttributes } from "react";

/** A hung request never leaves a permanent skeleton over a photo. */
const STUCK_MS = 10_000;

type MediaEl = HTMLImageElement | HTMLVideoElement | null;

/** Tracks whether one piece of media has loaded. Spread the returned handlers onto the
 *  `<img>` / `<Image>` / `<video>` and pass `mediaRef` as its `ref` (compose it when the
 *  element already has one): the ref catches media that finished before hydration
 *  (`img.complete`, `video.readyState`), so cached assets never flash a skeleton.
 *  Errors also clear the skeleton — it indicates loading, not outcome. */
export function useMediaLoaded() {
  const [loaded, setLoaded] = useState(false);

  const done = useCallback(() => setLoaded(true), []);

  const mediaRef = useCallback(
    (el: MediaEl) => {
      if (!el) return;
      const ready = el instanceof HTMLImageElement ? el.complete && el.naturalWidth > 0 : el.readyState >= 2;
      if (ready) done();
    },
    [done],
  );

  useEffect(() => {
    if (loaded) return;
    const t = window.setTimeout(done, STUCK_MS);
    return () => window.clearTimeout(t);
  }, [loaded, done]);

  return { loaded, mediaRef, onLoad: done, onError: done, onLoadedData: done };
}

/** The placeholder layer: `absolute inset-0` *above* the media inside its wrapper, so
 *  it inherits the wrapper's size, crop, radius and mask and reveals the loaded media
 *  with a fade. Terracotta at 38% with a single diagonal wave (see `.media-skeleton`
 *  in globals.css). Never catches clicks; fades out and unmounts once `hidden`. */
export default function MediaSkeleton({ hidden, className, style }: { hidden: boolean; className?: string; style?: CSSProperties }) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!hidden) return;
    const t = window.setTimeout(() => setGone(true), 450);
    return () => window.clearTimeout(t);
  }, [hidden]);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      className={`media-skeleton${hidden ? " media-skeleton-out" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    />
  );
}

/** `<Image fill …/>` with a skeleton over it until it loads. Drop-in replacement inside
 *  any sized, positioned wrapper. */
export function SkeletonImage({ alt, ...props }: ImageProps) {
  const { loaded, mediaRef, onLoad, onError } = useMediaLoaded();
  return (
    <>
      <MediaSkeleton hidden={loaded} />
      <Image
        {...props}
        alt={alt}
        ref={mediaRef}
        onLoad={(e) => { onLoad(); props.onLoad?.(e); }}
        onError={(e) => { onError(); props.onError?.(e); }}
      />
    </>
  );
}

/** Plain `<img>` variant, for the crop-positioned photos. */
export function SkeletonImg({ alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const { loaded, mediaRef, onLoad, onError } = useMediaLoaded();
  return (
    <>
      <MediaSkeleton hidden={loaded} />
      <img
        {...props}
        alt={alt}
        ref={mediaRef}
        onLoad={(e) => { onLoad(); props.onLoad?.(e); }}
        onError={(e) => { onError(); props.onError?.(e); }}
      />
    </>
  );
}
