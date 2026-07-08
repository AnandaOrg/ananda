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
  /** Milliseconds each slide stays visible. Default 3200. Ignored when `index` is set. */
  interval?: number;
  /** Slide-in transition duration in seconds. Default 0.9. */
  duration?: number;
  /** Apply the /m-photo-card.svg curved frame mask. Default false. */
  frame?: boolean;
  /**
   * Where incoming slides enter from. "up" (default): the incoming slide rises
   * from below; "down": it descends from above. The reverse step mirrors it.
   */
  direction?: "up" | "down";
  /**
   * Controlled mode. When provided, the timer autoplay is disabled and the slider
   * animates to this index — incoming slides over the current one on increase,
   * the current slide moves away to reveal the previous one on decrease (so
   * scroll-up reverses cleanly). Omit for self-driven autoplay.
   */
  index?: number;
  /**
   * Conveyor transition (controlled mode only): the outgoing slide keeps
   * moving in the same direction and exits opposite the incoming slide's
   * entry point, both at once — matching RitualCards' photo reveal — instead
   * of the default "cover" transition where the incoming slide slides over a
   * stationary outgoing one. Default false.
   */
  conveyor?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function VerticalSlider({
  images,
  interval = 3200,
  duration = 0.9,
  frame = false,
  direction = "up",
  index,
  conveyor = false,
  className,
  style,
}: Props) {
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const controlled = index !== undefined;

  // Refs so the one-shot effect always reads current prop values
  const intervalRef = useRef(interval);
  const durationRef = useRef(duration);
  const directionRef = useRef(direction);
  const conveyorRef = useRef(conveyor);
  useEffect(() => { intervalRef.current = interval; }, [interval]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { conveyorRef.current = conveyor; }, [conveyor]);

  // Off-screen parking spot for hidden slides: below for "up", above for "down".
  const off = () => (directionRef.current === "down" ? "-100%" : "100%");
  // The opposite park spot — where a conveyor exit heads toward.
  const oppositeOff = () => (directionRef.current === "down" ? "100%" : "-100%");

  // Tracks the visible slide across renders for controlled stepping.
  const curRef = useRef(0);

  // Initial stacking: first slide shown, the rest parked off-screen (clipped
  // by overflow:hidden).
  useEffect(() => {
    const els = slideRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (els.length < 1) return;
    gsap.set(els[0], { y: "0%", zIndex: 1 });
    els.slice(1).forEach(el => gsap.set(el, { y: off(), zIndex: 0 }));
    curRef.current = 0;
  }, []);

  // Autoplay — only when uncontrolled.
  useEffect(() => {
    if (controlled) return;
    const els = slideRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (els.length < 2) return;

    let dc: gsap.core.Tween | null = null;

    function schedule() {
      dc = gsap.delayedCall(intervalRef.current / 1000, step);
    }

    function step() {
      const cur = curRef.current;
      const nxt = (cur + 1) % els.length;
      const curEl = els[cur];
      const nxtEl = els[nxt];

      // Park incoming off-screen, then slide it in
      gsap.set(nxtEl, { y: off(), zIndex: 2 });
      gsap.to(nxtEl, {
        y: "0%",
        duration: durationRef.current,
        ease: "power2.inOut",
        onComplete() {
          gsap.set(curEl, { zIndex: 0 });
          gsap.set(nxtEl, { zIndex: 1 });
          curRef.current = nxt;
          schedule();
        },
      });
    }

    schedule();

    return () => {
      dc?.kill();
      gsap.killTweensOf(els);
    };
  }, [controlled]);

  // Controlled stepping — animate to `index`, reversible.
  useEffect(() => {
    if (!controlled) return;
    const els = slideRefs.current.filter((el): el is HTMLDivElement => el !== null);
    const next = Math.max(0, Math.min(els.length - 1, index ?? 0));
    const cur = curRef.current;
    if (next === cur || !els[next] || !els[cur]) return;

    const curEl = els[cur];
    const nxtEl = els[next];
    const forward = next > cur;

    if (conveyorRef.current) {
      // Conveyor: incoming enters from this step's entry side while the
      // outgoing keeps moving the same way and exits the opposite side —
      // both at once, mirroring RitualCards' photo reveal.
      const entry = forward ? off() : oppositeOff();
      const exit = forward ? oppositeOff() : off();
      gsap.set(nxtEl, { y: entry, zIndex: 2 });
      gsap.set(curEl, { zIndex: 1 });
      gsap.to(nxtEl, { y: "0%", duration: durationRef.current, ease: "power2.inOut", onComplete() { gsap.set(nxtEl, { zIndex: 1 }); } });
      gsap.to(curEl, {
        y: exit,
        duration: durationRef.current,
        ease: "power2.inOut",
        onComplete() { gsap.set(curEl, { y: entry, zIndex: 0 }); },
      });
      curRef.current = next;
      return;
    }

    if (forward) {
      // Forward: incoming slides in over the current slide.
      gsap.set(nxtEl, { y: off(), zIndex: 2 });
      gsap.to(nxtEl, {
        y: "0%",
        duration: durationRef.current,
        ease: "power2.inOut",
        onComplete() {
          gsap.set(curEl, { y: off(), zIndex: 0 });
          gsap.set(nxtEl, { zIndex: 1 });
        },
      });
    } else {
      // Reverse: target sits beneath, current moves away to reveal it.
      gsap.set(nxtEl, { y: "0%", zIndex: 1 });
      gsap.set(curEl, { zIndex: 2 });
      gsap.to(curEl, {
        y: off(),
        duration: durationRef.current,
        ease: "power2.inOut",
        onComplete() {
          gsap.set(curEl, { zIndex: 0 });
        },
      });
    }
    curRef.current = next;
  }, [index, controlled]);

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
