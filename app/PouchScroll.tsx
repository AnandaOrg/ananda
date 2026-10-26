"use client";

import { useEffect, useRef } from "react";
import { SkeletonImg } from "./MediaSkeleton";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const u = (n: number) => `calc(var(--u) * ${n})`;

export default function PouchScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rotateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const el = rotateRef.current;
    if (!wrap || !el) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const centerY = rect.top + rect.height / 2;
      const p = clamp(1 - centerY / vh, 0, 1);
      el.style.transform = `rotate(${158.5 + p * 360}deg)`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      style={{
        left: `calc(50% - ${u(190.37)})`,
        top: `calc(50% + ${u(1013.66)})`,
        width: u(390.15),
        height: u(477.453),
      }}
    >
      <div ref={rotateRef} style={{ transform: "rotate(158.5deg)", willChange: "transform" }}>
        <div
          className="relative overflow-hidden"
          style={{
            width: u(257.084),
            height: u(411.893),
            boxShadow: `${u(11)} ${u(8)} ${u(28.7)} 0 rgba(0,0,0,0.25)`,
          }}
        >
          <SkeletonImg
            src="/c-pouch.png"
            alt="ANANDA cocktail pouch"
            sizes="35vw"
            className="absolute max-w-none"
            style={{ width: "177.86%", height: "111.18%", left: "-40.81%", top: "-7.3%" }}
          />
        </div>
      </div>
    </div>
  );
}
