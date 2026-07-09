"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AboutCopyBlock from "./AboutCopyBlock";
import VerticalSlider from "./VerticalSlider";
import { ABOUT_CARD } from "./configs";

gsap.registerPlugin(ScrollTrigger);

const u = (n: number) => `calc(var(--u) * ${n})`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Photo #0 is the pour image — the diamond grows and lands as this exact slide,
// so the hand-off from the traveling image into the gallery is invisible. Then
// continued scrolling steps through the remaining hero_3 photos.
const PHOTOS = [
  { src: "/hero_3/2.png", alt: "ANANDA moment" },
  { src: "/hero_3/3.png", alt: "ANANDA moment" },
  { src: "/hero_3/4.png", alt: "ANANDA moment" },
  { src: "/hero_3/5.png", alt: "ANANDA moment" },
];

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
 * Sections 2 + 3 as ONE pinned stage (desktop). The pour image holds inline as a
 * diamond in the heading, grows upright and centred, then travels to the gallery
 * card slot — while the "What we're about" copy fades in on the right. It lands
 * and cross-fades into the gallery's first photo (the same pour image, so the
 * hand-off is invisible); continued scrolling steps the gallery through the
 * remaining photos, THEN the pin releases into Pathways. One pin = nothing ever
 * "scrolls in". Desktop only. (Mobile uses MobileIntro / MobileCollage.)
 */
export default function DitchTheGlass() {
  const sectionRef = useRef<HTMLElement>(null);
  const placeholderRef = useRef<HTMLSpanElement>(null);
  const travelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    const placeholder = placeholderRef.current;
    const travel = travelRef.current;
    const inner = innerRef.current;
    const gallery = galleryRef.current;
    const copy = copyRef.current;
    if (!section || !placeholder || !travel || !inner || !gallery || !copy) return;

    const words = Array.from(section.querySelectorAll<HTMLElement>(".dtg-word"));

    let K0: Box = { left: 0, top: 0, w: 0, h: 0 }; // diamond, inline in the heading
    let K1: Box = { left: 0, top: 0, w: 0, h: 0 }; // grown upright square, centred
    let K2: Box = { left: 0, top: 0, w: 0, h: 0 }; // gallery card slot

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
      // grow, rotate, and travel all run together over one continuous window
      const gtP = smooth(clamp((prog - 0.03) / 0.29, 0, 1)); // 0.03 → 0.32
      const gP = gtP;
      const tP = gtP;

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
      const textFade = 1 - clamp((prog - 0.08) / 0.12, 0, 1);
      words.forEach((w) => { w.style.opacity = String(textFade); });

      // the copy fades + slides in on the right WHILE the image travels left
      const cP = smooth(clamp((prog - 0.20) / 0.14, 0, 1));
      copy.style.opacity = String(cP);
      copy.style.transform = `translateX(${lerp(-80, 0, cP)}px)`;

      // hand-off: the diamond fades out as the gallery fades in at the same slot.
      // Both show the pour image (PHOTOS[0]), so the swap is invisible.
      const handoff = clamp((prog - 0.32) / 0.06, 0, 1);
      travel.style.opacity = String(1 - handoff);
      gallery.style.opacity = String(handoff);

      // step the gallery through its photos over the rest of the pin
      const step = clamp(Math.floor(((prog - 0.38) / 0.62) * PHOTOS.length), 0, PHOTOS.length - 1);
      if (step !== indexRef.current) {
        indexRef.current = step;
        setIndex(step);
      }
    };

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=400%",
        pin: true,
        scrub: true,
        onUpdate: (self) => render(self.progress),
        onRefresh: (self) => { measure(); render(self.progress); },
      });
      measure();
      render(st.progress);
      return () => st.kill();
    });

    // Reduced motion: no pin/scroll-hijack — show the landed "about" layout
    // statically (gallery first photo + copy), with the heading/diamond hidden.
    mm.add("(min-width: 768px) and (prefers-reduced-motion: reduce)", () => {
      words.forEach((w) => { w.style.opacity = "0"; });
      travel.style.opacity = "0";
      gallery.style.opacity = "1";
      copy.style.opacity = "1";
      copy.style.transform = "none";
      return () => {};
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen items-center justify-center overflow-hidden bg-[#fff0e5] px-6 text-[#eb4638]"
      style={{ containerType: "inline-size", ["--u" as string]: "calc(100cqw / 1440)" }}
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

      {/* Gallery — pinned at the card slot; first photo is the pour image, so the
          traveling diamond lands straight onto it. Steps through the rest.
          duration={0.7} matches RitualCards' PHOTO_DUR — same conveyor reveal
          (incoming enters from above, outgoing keeps moving down and exits
          below, same power2.inOut ease) at the same speed. */}
      <div ref={galleryRef} data-dtg="gallery" className="absolute" style={{ ...ABOUT_CARD, opacity: 0, zIndex: 4 }}>
        <VerticalSlider images={PHOTOS} index={index} frame direction="down" conveyor duration={0.7} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Copy — upper right; fades + slides in as the image travels to the slot. */}
      <div
        ref={copyRef}
        style={{
          position: "absolute",
          left: u(965),
          top: u(92.16),
          width: u(401),
          zIndex: 4,
          opacity: 0,
          transform: "translateX(-80px)",
          willChange: "opacity, transform",
        }}
      >
        <AboutCopyBlock revealed />
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
          <video
            src="/videos/woman-drinking.mp4"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
