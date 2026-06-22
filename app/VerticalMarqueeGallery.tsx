"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import styles from "./VerticalMarqueeGallery.module.css";

export interface MarqueeImage {
  src: string;
  alt: string;
}

interface Props {
  images: MarqueeImage[];
  /** Pixels per second. Default 40. */
  speed?: number;
  /** Scroll direction. Default "up". */
  direction?: "up" | "down";
  /** Gap in px between images. Default 12. */
  gap?: number;
  /** Pause animation on hover. Default true. */
  pauseOnHover?: boolean;
  /**
   * Display height of each image slot in px. Default 200.
   * next/image requires explicit container height when using fill mode.
   */
  imageHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function VerticalMarqueeGallery({
  images,
  speed = 40,
  direction = "up",
  gap = 12,
  pauseOnHover = true,
  imageHeight = 200,
  className,
  style,
}: Props) {
  const firstCopyRef = useRef<HTMLDivElement>(null);
  const [halfHeight, setHalfHeight] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);

  useLayoutEffect(() => {
    const el = firstCopyRef.current;
    if (!el) return;

    const measure = () => setHalfHeight(el.offsetHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [images, gap, imageHeight]);

  const shouldAnimate = images.length > 1 && halfHeight !== null && halfHeight > 0;
  const duration = shouldAnimate ? halfHeight / speed : 0;

  // Animation class is a plain global class name (defined in globals.css).
  // CSS Module keyframe scoping is unreliable in Next.js 16 App Router —
  // globals.css guarantees the @keyframes are always available before paint.
  const animateClass = shouldAnimate
    ? direction === "up"
      ? "vmg-animate-up"
      : "vmg-animate-down"
    : "";

  const trackClass = [
    styles.track,
    animateClass,
    hovered && pauseOnHover ? styles.paused : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={style}
      onMouseEnter={pauseOnHover ? () => setHovered(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setHovered(false) : undefined}
    >
      <div
        className={trackClass}
        style={shouldAnimate ? { animationDuration: `${duration}s` } : undefined}
      >
        {/* Primary copy — measured by ResizeObserver */}
        <div ref={firstCopyRef}>
          <ImageList images={images} imageHeight={imageHeight} gap={gap} priorityCount={2} />
        </div>

        {/* Duplicate — aria-hidden so screen readers don't read images twice */}
        <div aria-hidden="true">
          <ImageList images={images} imageHeight={imageHeight} gap={gap} priorityCount={0} />
        </div>
      </div>
    </div>
  );
}

interface ImageListProps {
  images: MarqueeImage[];
  imageHeight: number;
  gap: number;
  priorityCount: number;
}

function ImageList({ images, imageHeight, gap, priorityCount }: ImageListProps) {
  return (
    <>
      {images.map((img, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            width: "100%",
            height: imageHeight,
            marginBottom: gap,
          }}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
            priority={i < priorityCount}
          />
        </div>
      ))}
    </>
  );
}
