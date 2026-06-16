"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { mu, MU_VAR, maskStyle } from "./scale";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Mobile section 2 — "Ditch the glass" / LIQUID BLISS (Figma 184:1157). */
export default function MobileIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const diamondRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const diamond = diamondRef.current;
    if (!section || !diamond) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const centerY = rect.top + rect.height / 2;
      const p = clamp(1 - centerY / vh, 0, 1);

      const scale = 1 + p * 5;
      const rotate = 45 - p * 45;

      diamond.style.transform = `rotate(${rotate}deg) scale(${scale})`;
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
    <section ref={sectionRef} className="flex w-full justify-center bg-[#fff0e5] md:hidden">
      <div className="w-full max-w-[430px]" style={{ containerType: "inline-size" }}>
        <div
          className="flex items-center justify-center"
          style={{ ...MU_VAR, padding: `${mu(80)} ${mu(60)}` }}
        >
          <div className="flex flex-col items-center" style={{ gap: mu(24) }}>
            <div style={{ padding: `${mu(6.728)} ${mu(9.419)}` }}>
              <p
                className="whitespace-nowrap uppercase text-[#eb4638]"
                style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}
              >
                [01] Ditch the glass
              </p>
            </div>

            {/* Headline + inline diamond */}
            <div className="relative" style={{ width: mu(276.699) }}>
              <p
                className="font-bold uppercase text-[#eb4638]"
                style={{ fontFamily: "var(--font-display)", fontSize: mu(106), lineHeight: 0.8, letterSpacing: mu(-8.48), whiteSpace: "pre-wrap" }}
              >
                {"LIQUID BLISS.\nMIXED TO        MOVE."}
              </p>
              <div
                className="absolute flex items-center justify-center"
                style={{ left: mu(101.74 - 29.84), top: mu(218.32 - 26.63), width: mu(213.794), height: mu(213.794) }}
              >
                <div
                  ref={diamondRef}
                  style={{ transform: "rotate(45deg)", willChange: "transform" }}
                >
                  <div
                    className="relative overflow-hidden"
                    style={{ width: mu(140.805), height: mu(161.545), ...maskStyle("/m-diamond.svg", 154.104, 147.531, 29.843, 26.627) }}
                  >
                    <Image src="/ananda-pour.png" alt="Pouring an ANANDA cocktail" fill sizes="60vw" className="object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
