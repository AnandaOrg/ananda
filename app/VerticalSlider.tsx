"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
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
  /** Slide-in transition duration in seconds. Default 0.9. */
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
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Refs so the one-shot effect always reads current prop values
  const intervalRef = useRef(interval);
  const durationRef = useRef(duration);
  useEffect(() => { intervalRef.current = interval; }, [interval]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  useEffect(() => {
    // Filter to actual elements — populated before effects run (React contract)
    const els = slideRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (els.length < 2) return;

    // Slide 0 visible; all others parked below the container (clipped by overflow:hidden)
    gsap.set(els[0], { y: "0%", zIndex: 1 });
    els.slice(1).forEach(el => gsap.set(el, { y: "100%", zIndex: 0 }));

    let cur = 0;
    let dc: gsap.core.Tween | null = null;

    function schedule() {
      dc = gsap.delayedCall(intervalRef.current / 1000, step);
    }

    function step() {
      const nxt = (cur + 1) % els.length;
      const curEl = els[cur];
      const nxtEl = els[nxt];

      // Park incoming below, then slide it up
      gsap.set(nxtEl, { y: "100%", zIndex: 2 });
      gsap.to(nxtEl, {
        y: "0%",
        duration: durationRef.current,
        ease: "power2.inOut",
        onComplete() {
          gsap.set(curEl, { zIndex: 0 });
          gsap.set(nxtEl, { zIndex: 1 });
          cur = nxt;
          schedule();
        },
      });
    }

    schedule();

    return () => {
      dc?.kill();
      gsap.killTweensOf(els);
    };
  }, []); // one-shot: refs are populated, interval/duration read via refs

  if (images.length === 0) return null;

  return (
    <div className={className} style={{ position: "relative", overflow: "hidden", ...style }}>
      {images.map((img, i) => (
        <div
          key={img.src}
          ref={el => { slideRefs.current[i] = el; }}
          style={{ position: "absolute", inset: 0 }}
        >
          <div style={{ position: "absolute", inset: 0, ...(frame ? FRAME_MASK : {}) }}>
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="75vw"
              style={{ objectFit: "cover" }}
              priority={i === 0}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
