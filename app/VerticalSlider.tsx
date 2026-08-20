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
  interval?: number;
  duration?: number;
  frame?: boolean;
  direction?: "up" | "down";
  index?: number;
  conveyor?: boolean;
  reveal?: boolean;
  loop?: boolean;
  eagerCount?: number;
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
  reveal = false,
  loop = false,
  eagerCount = 1,
  className,
  style,
}: Props) {
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const controlled = index !== undefined;

  const intervalRef = useRef(interval);
  const durationRef = useRef(duration);
  const directionRef = useRef(direction);
  const conveyorRef = useRef(conveyor);
  const revealRef = useRef(reveal);
  const loopRef = useRef(loop);
  useEffect(() => { intervalRef.current = interval; }, [interval]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { conveyorRef.current = conveyor; }, [conveyor]);
  useEffect(() => { revealRef.current = reveal; }, [reveal]);
  useEffect(() => { loopRef.current = loop; }, [loop]);

  const off = () => (directionRef.current === "down" ? "-100%" : "100%");
  const oppositeOff = () => (directionRef.current === "down" ? "100%" : "-100%");

  const curRef = useRef(0);
  const pendingIndexRef = useRef(0);
  const animatingRef = useRef(false);

  useEffect(() => {
    const els = slideRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (els.length < 1) return;
    if (revealRef.current) {
      gsap.set(els, { y: "0%", clipPath: "inset(0 0 0% 0)", zIndex: 0 });
      gsap.set(els[0], { zIndex: 1 });
    } else {
      gsap.set(els[0], { y: "0%", zIndex: 1 });
      els.slice(1).forEach(el => gsap.set(el, { y: off(), zIndex: 0 }));
    }
    curRef.current = 0;
  }, []);

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

  useEffect(() => {
    if (!controlled) return;
    const els = slideRefs.current.filter((el): el is HTMLDivElement => el !== null);
    pendingIndexRef.current = Math.max(0, Math.min(els.length - 1, index ?? 0));
    if (animatingRef.current) return;

    function runStep() {
      const els = slideRefs.current.filter((el): el is HTMLDivElement => el !== null);
      const cur = curRef.current;
      const next = pendingIndexRef.current;
      if (next === cur || !els[next] || !els[cur]) return;

      animatingRef.current = true;
      const curEl = els[cur];
      const nxtEl = els[next];
      const forward = loopRef.current || next > cur;

      const finish = () => {
        curRef.current = next;
        animatingRef.current = false;
        if (pendingIndexRef.current !== next) runStep();
      };

      if (revealRef.current) {
        if (forward) {
          gsap.set(nxtEl, { y: "0%", clipPath: "inset(0 0 100% 0)", zIndex: 2 });
          gsap.set(curEl, { zIndex: 1 });
          gsap.to(nxtEl, {
            clipPath: "inset(0 0 0% 0)",
            duration: durationRef.current,
            ease: "power2.inOut",
            onComplete() { gsap.set(nxtEl, { zIndex: 1 }); gsap.set(curEl, { zIndex: 0 }); finish(); },
          });
        } else {
          gsap.set(nxtEl, { y: "0%", clipPath: "inset(0 0 0% 0)", zIndex: 1 });
          gsap.set(curEl, { zIndex: 2 });
          gsap.to(curEl, {
            clipPath: "inset(0 0 100% 0)",
            duration: durationRef.current,
            ease: "power2.inOut",
            onComplete() { gsap.set(curEl, { zIndex: 0 }); finish(); },
          });
        }
        return;
      }

      if (conveyorRef.current) {
        const entry = forward ? off() : oppositeOff();
        const exit = forward ? oppositeOff() : off();
        let remaining = 2;
        const complete = () => { remaining -= 1; if (remaining === 0) finish(); };
        gsap.set(nxtEl, { y: entry, zIndex: 2 });
        gsap.set(curEl, { zIndex: 1 });
        gsap.to(nxtEl, { y: "0%", duration: durationRef.current, ease: "power2.inOut", onComplete() { gsap.set(nxtEl, { zIndex: 1 }); complete(); } });
        gsap.to(curEl, {
          y: exit,
          duration: durationRef.current,
          ease: "power2.inOut",
          onComplete() { gsap.set(curEl, { y: entry, zIndex: 0 }); complete(); },
        });
        return;
      }

      if (forward) {
        gsap.set(nxtEl, { y: off(), zIndex: 2 });
        gsap.to(nxtEl, {
          y: "0%",
          duration: durationRef.current,
          ease: "power2.inOut",
          onComplete() {
            gsap.set(curEl, { y: off(), zIndex: 0 });
            gsap.set(nxtEl, { zIndex: 1 });
            finish();
          },
        });
      } else {
        gsap.set(nxtEl, { y: "0%", zIndex: 1 });
        gsap.set(curEl, { zIndex: 2 });
        gsap.to(curEl, {
          y: off(),
          duration: durationRef.current,
          ease: "power2.inOut",
          onComplete() {
            gsap.set(curEl, { zIndex: 0 });
            finish();
          },
        });
      }
    }

    runStep();
  }, [index, controlled]);

  if (images.length === 0) return null;

  return (
    <div className={className} style={{ position: "relative", overflow: "hidden", ...(frame ? FRAME_MASK : {}), ...style }}>
      {images.map((img, i) => (
        <div
          key={img.src}
          ref={el => { slideRefs.current[i] = el; }}
          style={{ position: "absolute", inset: 0 }}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="75vw"
            style={{ objectFit: "cover" }}
            priority={i === 0}
            loading={i > 0 && i < eagerCount ? "eager" : undefined}
          />
        </div>
      ))}
    </div>
  );
}
