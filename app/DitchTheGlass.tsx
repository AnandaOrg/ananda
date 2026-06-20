"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import pourPhoto from "../public/ananda-pour.png";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function DitchTheGlass() {
  const sectionRef = useRef<HTMLElement>(null);
  const diamondRef = useRef<HTMLSpanElement>(null);
  const imageWrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const diamond = diamondRef.current;
    const imageWrap = imageWrapRef.current;
    if (!section || !diamond || !imageWrap) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // track section center so animation runs while the diamond is actually visible
      const centerY = rect.top + rect.height / 2;
      const p = clamp(1 - centerY / vh, 0, 1);

      const scale = 1 + p * 5;
      const rotate = 45 - p * 45;

      diamond.style.transform = `rotate(${rotate}deg) scale(${scale})`;
      imageWrap.style.transform = `rotate(${-rotate}deg) scale(1.5)`;

      // Fade out pour photo as section 3 enters view
      const fade = p < 0.65 ? 1 : Math.max(0, 1 - (p - 0.65) / 0.35);
      imageWrap.style.opacity = String(fade);
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
    <section
      ref={sectionRef}
      className="hidden min-h-screen items-center justify-center overflow-hidden bg-[#fff0e5] px-6 py-24 md:flex"
    >
      <div className="flex flex-col items-center text-center text-[#eb4638]">
        <p
          className="mb-[clamp(1.5rem,4vw,3.5rem)] text-[14px] uppercase leading-[0.87] tracking-[0.98px]"
          style={{ fontFamily: "var(--font-mono-label)" }}
        >
          [01] Ditch the glass
        </p>

        <h2
          className="text-[clamp(2.75rem,12.5vw,180px)] font-bold uppercase leading-[0.8] tracking-[-0.08em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="block">Liquid Bliss.</span>
          <span className="flex items-center justify-center gap-[0.2em]">
            <span>Mixed to</span>

            <span
              ref={diamondRef}
              className="relative inline-block size-[1.2em] shrink-0 overflow-hidden"
              style={{ willChange: "transform", transform: "rotate(45deg) scale(1)" }}
            >
              <span
                ref={imageWrapRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  willChange: "transform",
                  transform: "rotate(-45deg) scale(1.5)",
                }}
              >
                <Image
                  src={pourPhoto}
                  alt="Pouring an ANANDA cocktail"
                  fill
                  sizes="(max-width: 768px) 40vw, 320px"
                  className="object-cover"
                />
              </span>
            </span>

            <span>Move.</span>
          </span>
        </h2>
      </div>
    </section>
  );
}
