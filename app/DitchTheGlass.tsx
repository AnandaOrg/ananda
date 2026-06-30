"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import pourPhoto from "../public/ananda-pour.png";
import { ABOUT_CARD } from "./configs";

gsap.registerPlugin(ScrollTrigger);

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Box = { left: number; top: number; w: number; h: number };
const lerpBox = (a: Box, b: Box, t: number): Box => ({
  left: lerp(a.left, b.left, t),
  top: lerp(a.top, b.top, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
});
const vToPx = (v: string, w: number, h: number) =>
  v.endsWith("vw") ? (parseFloat(v) / 100) * w : (parseFloat(v) / 100) * h;

/**
 * Section 2 — "Liquid Bliss. Mixed to Move." A pinned stage: the pour image holds
 * inline as a diamond in the heading, grows upright and centred, then travels to
 * the gallery's card slot (the same box AboutCollage pins into) and fades out as
 * the pin releases — handing off to the AboutCollage gallery (Section 3) that
 * scrolls in next. Desktop only. (Mobile uses MobileIntro / MobileCollage.)
 */
export default function DitchTheGlass() {
  const sectionRef = useRef<HTMLElement>(null);
  const placeholderRef = useRef<HTMLSpanElement>(null);
  const travelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const placeholder = placeholderRef.current;
    const travel = travelRef.current;
    const inner = innerRef.current;
    if (!section || !placeholder || !travel || !inner) return;

    const words = Array.from(section.querySelectorAll<HTMLElement>(".dtg-word"));

    let K0: Box = { left: 0, top: 0, w: 0, h: 0 }; // diamond, inline in the heading
    let K1: Box = { left: 0, top: 0, w: 0, h: 0 }; // grown upright square, centred
    let K2: Box = { left: 0, top: 0, w: 0, h: 0 }; // gallery card slot (AboutCollage)

    const measure = () => {
      const s = section.getBoundingClientRect();
      const p = placeholder.getBoundingClientRect();
      K0 = { left: p.left - s.left, top: p.top - s.top, w: p.width, h: p.height };
      const side = s.height * 0.8;
      K1 = { left: (s.width - side) / 2, top: (s.height - side) / 2, w: side, h: side };
      K2 = {
        left: vToPx(ABOUT_CARD.left, s.width, s.height),
        top: vToPx(ABOUT_CARD.top, s.width, s.height),
        w: vToPx(ABOUT_CARD.width, s.width, s.height),
        h: vToPx(ABOUT_CARD.height, s.width, s.height),
      };
    };

    const render = (prog: number) => {
      const gP = smooth(clamp((prog - 0.10) / 0.35, 0, 1)); // grow:   0.10 → 0.45
      const tP = smooth(clamp((prog - 0.45) / 0.37, 0, 1)); // travel: 0.45 → 0.82

      const box = lerpBox(lerpBox(K0, K1, gP), K2, tP);
      travel.style.left = `${box.left}px`;
      travel.style.top = `${box.top}px`;
      travel.style.width = `${box.w}px`;
      travel.style.height = `${box.h}px`;

      const rot = 45 * (1 - gP);
      travel.style.transform = `rotate(${rot}deg)`;
      inner.style.transform = `rotate(${-rot}deg) scale(${lerp(1.5, 1, gP)})`;
      // adopt the curved photo-card frame as it heads for the slot
      travel.style.maskImage = tP > 0 ? "url(/m-photo-card.svg)" : "none";
      travel.style.setProperty("-webkit-mask-image", tP > 0 ? "url(/m-photo-card.svg)" : "none");

      // heading fades out as the image grows
      const textFade = 1 - clamp((prog - 0.18) / 0.18, 0, 1);
      words.forEach((w) => { w.style.opacity = String(textFade); });

      // the diamond fades out at the end — handing off to AboutCollage below
      const handoff = clamp((prog - 0.82) / 0.18, 0, 1);
      travel.style.opacity = String(1 - handoff);
    };

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=180%",
        pin: true,
        scrub: true,
        onUpdate: (self) => render(self.progress),
        onRefresh: (self) => { measure(); render(self.progress); },
      });
      measure();
      render(st.progress);
      return () => st.kill();
    });

    // Reduced motion: no pin/scroll-hijack — show the heading with the diamond
    // resting inline; AboutCollage shows statically below.
    mm.add("(min-width: 768px) and (prefers-reduced-motion: reduce)", () => {
      measure();
      render(0);
      return () => {};
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen items-center justify-center overflow-hidden bg-[#fff0e5] px-6 text-[#eb4638]"
    >
      <div className="flex flex-col items-center text-center">
        <p
          className="dtg-word mb-[clamp(1.5rem,4vw,3.5rem)] text-[14px] uppercase leading-[0.87] tracking-[0.98px]"
          style={{ fontFamily: "var(--font-mono-label)", willChange: "opacity" }}
        >
          [01] Ditch the glass
        </p>

        <h2
          className="text-[clamp(2.75rem,12.5vw,180px)] font-bold uppercase leading-[0.8] tracking-[-0.08em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="dtg-word block" style={{ willChange: "opacity" }}>Liquid Bliss.</span>
          <span className="flex items-center justify-center gap-[0.2em]">
            <span className="dtg-word" style={{ willChange: "opacity" }}>Mixed to</span>
            {/* Reserves the inline gap; the traveling image overlays it at rest. */}
            <span ref={placeholderRef} className="inline-block size-[1.2em] shrink-0" aria-hidden />
            <span className="dtg-word" style={{ willChange: "opacity" }}>Move.</span>
          </span>
        </h2>
      </div>

      {/* Traveling pour image — diamond → grown → gallery card slot, then fades. */}
      <div
        ref={travelRef}
        data-dtg="travel"
        className="pointer-events-none absolute overflow-hidden"
        style={{
          zIndex: 5,
          willChange: "left, top, width, height, transform, opacity",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        <div ref={innerRef} className="absolute inset-0" style={{ willChange: "transform" }}>
          <Image src={pourPhoto} alt="Pouring an ANANDA cocktail" fill sizes="50vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}
