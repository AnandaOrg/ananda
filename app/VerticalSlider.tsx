"use client";

import Image from "next/image";
import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

export interface SliderImage {
  src: string;
  alt: string;
}

const FRAME_MASK: React.CSSProperties = {
  maskImage: "url(/m-photo-card.svg)",
  WebkitMaskImage: "url(/m-photo-card.svg)",
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
};

interface Props {
  images: SliderImage[];
  /** Milliseconds each slide stays visible. Default 3200. */
  interval?: number;
  /** Slide transition duration in seconds. Default 0.9. */
  duration?: number;
  /** Apply the /m-photo-card.svg curved frame mask. Default false. */
  frame?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function VerticalSlider({
  images,
  interval = 3200,
  duration = 0.9,
  frame = false,
  className,
  style,
}: Props) {
  const activeRef = useRef(0);
  const animatingRef = useRef(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Position all slides: index 0 visible (y=0), rest waiting below (y=100%)
  useEffect(() => {
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, { y: i === 0 ? "0%" : "100%" });
    });
  }, [images]);

  const advance = useCallback(() => {
    if (animatingRef.current || images.length < 2) return;
    animatingRef.current = true;

    const cur = activeRef.current;
    const nxt = (cur + 1) % images.length;

    const curEl = slideRefs.current[cur];
    const nxtEl = slideRefs.current[nxt];
    if (!curEl || !nxtEl) { animatingRef.current = false; return; }

    // Snap next slide to starting position below the viewport
    gsap.set(nxtEl, { y: "100%" });

    gsap.timeline({
      onComplete() {
        // Park the old slide below so it's ready for next use
        gsap.set(curEl, { y: "100%" });
        activeRef.current = nxt;
        animatingRef.current = false;
      },
    })
      .to(curEl, { y: "-100%", duration, ease: "power2.inOut" }, 0)
      .to(nxtEl, { y: "0%",    duration, ease: "power2.inOut" }, 0);
  }, [images.length, duration]);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(advance, interval);
    return () => clearInterval(id);
  }, [advance, interval]);

  if (images.length === 0) return null;

  return (
    <div
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      {images.map((img, i) => (
        <div
          key={img.src}
          ref={el => { slideRefs.current[i] = el; }}
          style={{
            position: "absolute", inset: 0, willChange: "transform",
            ...(frame ? FRAME_MASK : {}),
          }}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="75vw"
            style={{ objectFit: "cover" }}
            priority={i === 0}
          />
        </div>
      ))}
    </div>
  );
}
