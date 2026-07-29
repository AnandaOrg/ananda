"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import VerticalSlider from "../VerticalSlider";
import { mu, MU_VAR } from "./scale";

gsap.registerPlugin(ScrollTrigger);

/**
 * Mobile sections 2 + 3 as ONE pinned stage (Figma 184:1157). Mirrors desktop
 * `DitchTheGlass`: the left-aligned "Liquid Bliss. Built for Freedom." heading
 * holds a drinking-clip diamond; on scroll the heading fades while
 * the diamond ROTATES upright and GROWS into the gallery's first-slide box, hands
 * off into the framed `VerticalSlider` (same image → invisible swap), which then
 * steps through the hero photos with the "What we're about" copy below. One pin =
 * nothing "scrolls in". Mobile only. (md:hidden)
 */

const RED = "#eb4638";
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
// Minimum scale for counter-rotated content to fully COVER its w×h frame at
// `rotDeg`: cosθ + (long/short ratio)·sinθ, padded a hair so antialiasing never
// shows a hairline at the corners (same fix as desktop DitchTheGlass — the
// aesthetic 1.5→1 zoom alone dips below this mid-transition and exposed the
// clip's flat edges inside the rotated frame as "cut corners").
const coverScale = (w: number, h: number, rotDeg: number) => {
  const rad = (rotDeg * Math.PI) / 180;
  const ratio = w > 0 && h > 0 ? Math.max(w / h, h / w) : 1;
  return Math.cos(rad) + (ratio + 0.02) * Math.sin(rad);
};

// Gallery slides — the diamond grows into slide 0, so the hand-off is seamless.
const GALLERY = [
  { src: "/hero_3/1.png", alt: "ANANDA moment" },
  { src: "/hero_3/2.png", alt: "ANANDA moment" },
  { src: "/hero_3/3.png", alt: "ANANDA moment" },
  { src: "/hero_3/4.png", alt: "ANANDA moment" },
  { src: "/hero_3/5.png", alt: "ANANDA moment" },
];

// Same curved frame mask VerticalSlider uses (frame prop), scaled 100% 100% so it
// fits the diamond at every size — a rounded diamond while small/rotated, the
// exact gallery frame once grown upright.
const FRAME_MASK: React.CSSProperties = {
  maskImage: "url(/m-photo-card.svg)",
  WebkitMaskImage: "url(/m-photo-card.svg)",
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
};

// Diamond — a 45°-rotated square (desktop's rotate + counter-rotate technique so
// it spins AND grows). Centred on the Figma diamond box (left 102.79 / top 268.78
// / 152×145.517); the square's diagonal === the box width (152).
const DIAMOND_BOX = { left: 102.79, top: 268.78, w: 152, h: 145.51693725585938 };
const DIAMOND_SIDE = DIAMOND_BOX.w / Math.SQRT2; // ≈107.48 → diagonal = 152
const DIAMOND_CX = DIAMOND_BOX.left + DIAMOND_BOX.w / 2;
const DIAMOND_CY = DIAMOND_BOX.top + DIAMOND_BOX.h / 2;

// Gallery slider box (also the diamond's grow target): section padding 20 / 28,
// width 100% of the padded container (390 − 2·20 = 350 mu), height 56svh.
const GALLERY_LEFT_MU = 20;
const GALLERY_TOP_MU = 28;
const GALLERY_W_MU = 390 - 2 * 20; // 350
const GALLERY_H_SVH = 0.56;
const muPx = (n: number, vw: number) => (n / 390) * vw;

// Choreography boundaries (fractions of the pin's scroll progress).
const GROW_END = 0.35; // diamond finishes rotating + growing here
const HANDOFF = 0.34; // gallery becomes visible just before the diamond hides

export default function MobileIntro() {
  const t = useTranslations("hero");
  const tAbout = useTranslations("about");
  const locale = useLocale();
  // One word per heading line, derived from the same strings desktop uses.
  const headingWords = [...t("line1").split(" "), ...t("line2a").split(" "), t("line2b")];

  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const inner = innerRef.current;
    const gallery = galleryRef.current;
    const copy = copyRef.current;
    if (!section || !frame || !inner || !gallery || !copy) return;

    const words = Array.from(section.querySelectorAll<HTMLElement>(".dtg-word"));
    const startLeftMu = DIAMOND_CX - DIAMOND_SIDE / 2;
    const startTopMu = DIAMOND_CY - DIAMOND_SIDE / 2;

    const render = (prog: number) => {
      // 1) Diamond rotates 45°→0° and grows (top-left anchored) into the gallery
      //    box, content counter-rotated upright with fill-scale 1.5→1.
      const pg = smooth(clamp(prog / GROW_END, 0, 1));
      const vw = window.innerWidth;
      const startSide = muPx(DIAMOND_SIDE, vw);
      const w = lerp(startSide, muPx(GALLERY_W_MU, vw), pg);
      const h = lerp(startSide, GALLERY_H_SVH * window.innerHeight, pg);
      const left = lerp(muPx(startLeftMu, vw), muPx(GALLERY_LEFT_MU, vw), pg);
      const top = lerp(muPx(startTopMu, vw), muPx(GALLERY_TOP_MU, vw), pg);
      const rot = 45 * (1 - pg);
      frame.style.width = `${w}px`;
      frame.style.height = `${h}px`;
      frame.style.left = `${left}px`;
      frame.style.top = `${top}px`;
      frame.style.transform = `rotate(${rot}deg)`;
      const fill = Math.max(lerp(1.5, 1, pg), coverScale(w, h, rot));
      inner.style.transform = `rotate(${-rot}deg) scale(${fill.toFixed(3)})`;

      // 2) Heading fades out as the image takes over.
      const fade = 1 - clamp(prog / 0.2, 0, 1);
      words.forEach((el) => { el.style.opacity = String(fade); });

      // 3) Hand-off: the gallery (same slide 0 image/box/frame) appears just
      //    before the diamond hides, so the swap is invisible.
      gallery.style.opacity = prog >= HANDOFF ? "1" : "0";
      frame.style.opacity = prog >= GROW_END ? "0" : "1";
      copy.style.opacity = String(clamp((prog - GROW_END) / 0.1, 0, 1));

      // 4) Step the gallery through its slides over the rest of the pin.
      const step = clamp(
        Math.floor(((prog - GROW_END) / (1 - GROW_END)) * GALLERY.length),
        0,
        GALLERY.length - 1,
      );
      if (step !== indexRef.current) {
        indexRef.current = step;
        setIndex(step);
      }
    };

    const mm = gsap.matchMedia();
    mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=350%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => render(self.progress),
        onRefresh: (self) => render(self.progress),
      });
      render(st.progress);
      return () => st.kill();
    });

    // Reduced motion: no pin/scroll-hijack — show the landed gallery layout
    // (heading + diamond hidden, gallery + copy visible).
    mm.add("(max-width: 767px) and (prefers-reduced-motion: reduce)", () => {
      words.forEach((el) => { el.style.opacity = "0"; });
      frame.style.opacity = "0";
      gallery.style.opacity = "1";
      copy.style.opacity = "1";
      return () => {};
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] w-full overflow-hidden bg-[#fff0e5] md:hidden"
      style={{ containerType: "inline-size", ...MU_VAR, color: RED }}
    >
      {/* Eyebrow — right edge aligns with the heading's right margin. */}
      <p
        className="dtg-word absolute whitespace-nowrap uppercase"
        style={{
          right: mu(60),
          top: mu(72),
          fontFamily: "var(--font-mono-label)",
          fontSize: mu(12),
          lineHeight: 0.87,
          letterSpacing: mu(0.84),
          willChange: "opacity",
        }}
      >
        {t("eyebrow")}
      </p>

      {/* Heading — one word per line, left aligned. Anek Kannada 700,
          line-height 80%, letter-spacing -8%, 60px horizontal insets.
          Per-locale size: the design's 106 fits "Liquid"/"Move." but not
          "Freedom." (or the longer BG words), so the size steps down with
          the widest word of each locale. */}
      <h2
        className="absolute font-bold uppercase"
        style={{
          left: mu(60),
          top: mu(100),
          width: mu(270),
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: locale === "bg" ? mu(56) : mu(80),
          lineHeight: 0.8,
          letterSpacing: "-0.08em",
        }}
      >
        {/* Keyed by line index (not word) so a locale switch updates the text
            in place — the pinned effect holds refs to these spans. */}
        {headingWords.map((word, i) => (
          <span key={i} className="dtg-word block" style={{ willChange: "opacity" }}>{word}</span>
        ))}
      </h2>

      {/* Framed gallery — pinned at the slider box; revealed at the hand-off and
          stepped through its slides. Same first image/box/frame as the diamond. */}
      <div
        ref={galleryRef}
        className="absolute"
        style={{
          left: mu(GALLERY_LEFT_MU),
          top: mu(GALLERY_TOP_MU),
          width: mu(GALLERY_W_MU),
          height: `${GALLERY_H_SVH * 100}svh`,
          opacity: 0,
          zIndex: 4,
          willChange: "opacity",
        }}
      >
        <VerticalSlider images={GALLERY} index={index} frame reveal duration={0.7} eagerCount={2} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Drinking clip — diamond frame rotates AND grows into the gallery box;
          content stays upright. Initial (pre-JS) pose = the small 45° diamond. */}
      <div
        ref={frameRef}
        className="absolute"
        style={{
          left: mu(DIAMOND_CX - DIAMOND_SIDE / 2),
          top: mu(DIAMOND_CY - DIAMOND_SIDE / 2),
          width: mu(DIAMOND_SIDE),
          height: mu(DIAMOND_SIDE),
          transform: "rotate(45deg)",
          zIndex: 5,
          ...FRAME_MASK,
          willChange: "transform, width, height, left, top, opacity",
        }}
      >
        <div ref={innerRef} className="absolute inset-0" style={{ transform: "rotate(-45deg) scale(1.5)", willChange: "transform" }}>
          <Image
            src={GALLERY[0].src}
            alt={GALLERY[0].alt}
            fill
            sizes="75vw"
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      </div>

      {/* "What we're about" — below the gallery; fades in at the hand-off. */}
      <div
        ref={copyRef}
        className="absolute flex flex-col"
        style={{
          left: mu(GALLERY_LEFT_MU),
          top: `calc(${GALLERY_H_SVH * 100}svh + ${mu(GALLERY_TOP_MU * 2)})`,
          width: mu(GALLERY_W_MU),
          gap: mu(19),
          opacity: 0,
          zIndex: 4,
          willChange: "opacity",
        }}
      >
        <p
          className="uppercase"
          style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(13), lineHeight: 0.87, letterSpacing: mu(1), color: "var(--terracotta)" }}
        >
          {tAbout("eyebrow")}
        </p>
        {/* 16 → 18mu per the copy brief ("increase font size"); box widened
            to keep a similar rag with the new three-paragraph copy. */}
        <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: mu(18), lineHeight: 1.3, letterSpacing: mu(0.2), color: "var(--terracotta)", maxWidth: mu(280) }}>
          <p className="mb-0">{tAbout("p1")}</p>
          <p className="mb-0">{tAbout("p2")}</p>
          <p>{tAbout("p3")}</p>
        </div>
      </div>
    </section>
  );
}
