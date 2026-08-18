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
// GROW_END went 0.98vh → 0.686vh → 0.4802vh → 0.20vh over three passes (see
// git history) — 0.20vh still wasn't reliably a single scroll/swipe on a real
// device, so this cuts it much harder: the grow+rotate window is now 0.08vh
// — about 60-75px on a typical phone, well under even a light scroll tick.
// The pin's own length (`end` below) is trimmed by the same 0.12vh saved, so
// the gallery hand-off/step-through phase keeps its original absolute scroll
// pacing — only the rotation got shorter. HANDOFF keeps the same 0.01 lead
// over GROW_END so the diamond-to-gallery crossfade still overlaps.
//
// NOTE: this is still a continuous-scrub distance, not a hard gesture lock —
// it's a very-likely bet, not a guarantee, for the same reason the pre-lock
// gallery stepping wasn't: a small enough scroll input can still land short
// of it. A true guarantee would mean giving this phase the same lock/atomic-
// jump treatment as attachLockedGalleryStepper (see lockedGalleryStepper.ts)
// — deliberately not done here yet since that mechanism just broke gallery
// stepping in production and the fix for that hasn't been confirmed working.
const GROW_END = 0.0421; // diamond finishes rotating + growing here
const HANDOFF = 0.0321; // gallery becomes visible just before the diamond hides

// Where the gallery's auto-advancing slideshow (see GALLERY_AUTOPLAY_MS
// below) starts — deliberately LATER than GROW_END, not right at it, so the
// slides don't start changing themselves while the diamond-grow animation or
// the copy fade-in (which finishes GROW_END + 0.1 later) are still visibly
// resolving. Scrolling itself is never intercepted on mobile — the user can
// keep scrolling through and past the gallery at any speed; the slideshow
// just runs on its own clock underneath.
const GALLERY_STEP_START = 0.15;
// One slide's full on-screen time: the 2s reveal wipe (VerticalSlider's
// `duration`) plus a beat to actually look at the photo before the next one
// starts painting over it.
const GALLERY_AUTOPLAY_MS = 4000;

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

      // 4) Which slide is showing past this point is driven by the autoplay
      // timer below (see GALLERY_AUTOPLAY_MS), not derived from `prog` —
      // scroll itself is left completely alone here.
    };

    // Auto-advances `index` on a clock once the pin's progress enters the
    // gallery zone (GALLERY_STEP_START); stops the instant it leaves (scrolled
    // back above it, or the pin has fully released past prog 1). Scroll is
    // never intercepted — the user can scroll through the whole zone without
    // waiting to see every slide, unlike the old one-per-gesture lock.
    let autoplayId: ReturnType<typeof setInterval> | null = null;
    const inGalleryZone = (prog: number) => prog >= GALLERY_STEP_START && prog < 1;
    const syncAutoplay = (prog: number) => {
      if (inGalleryZone(prog)) {
        if (autoplayId) return;
        autoplayId = setInterval(() => {
          indexRef.current = (indexRef.current + 1) % GALLERY.length;
          setIndex(indexRef.current);
        }, GALLERY_AUTOPLAY_MS);
      } else if (autoplayId) {
        clearInterval(autoplayId);
        autoplayId = null;
      }
    };

    const mm = gsap.matchMedia();
    mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=190%", // 202% minus the 12% (0.12vh) trimmed to hit the harder one-scroll GROW_END cut above
        pin: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => { render(self.progress); syncAutoplay(self.progress); },
        onRefresh: (self) => { render(self.progress); syncAutoplay(self.progress); },
      });
      render(st.progress);
      syncAutoplay(st.progress);
      return () => {
        if (autoplayId) clearInterval(autoplayId);
        st.kill();
      };
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
      {/* Eyebrow — left-aligned with the heading below. */}
      <p
        className="dtg-word absolute whitespace-nowrap uppercase"
        style={{
          left: mu(60),
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

      {/* Heading — one word per line, each line still flush left against the
          others (no per-line text-align change). EN keeps the fixed 60mu
          inset box (design intent, matches the Figma frame). BG's line
          lengths vary far more (ЗА vs ДВИЖЕНИЕ.) than EN's, so a fixed-width
          box left ~37mu of dead space on its right that made the whole block
          read as pushed left — BG instead gets an auto (shrink-to-fit) width
          box, sized to its longest line and centered as a UNIT via
          left:50%+translateX(-50%), so the block sits centered with equal
          gaps on both sides while every line inside it stays left-aligned
          relative to the others. Anek Kannada 700, line-height 80%,
          letter-spacing -8%. Per-locale size: the design's 106 fits EN's
          "Liquid"/"Move." but not BG's "БЛАЖЕНСТВО." */}
      <h2
        className="absolute font-bold uppercase"
        style={{
          top: mu(100),
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: locale === "bg" ? mu(48) : mu(106),
          lineHeight: 0.8,
          // Golos (BG) needs looser tracking than Anek's design value.
          letterSpacing: locale === "bg" ? "-0.03em" : "-0.08em",
          ...(locale === "bg"
            ? { left: "50%", transform: "translateX(-50%)" }
            : { left: mu(60), width: mu(270) }),
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
        <VerticalSlider images={GALLERY} index={index} frame reveal duration={2} eagerCount={2} style={{ width: "100%", height: "100%" }} />
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
        {/* BG runs the copy-brief sizing (16 → 18mu, box widened for the
            three-paragraph copy); EN keeps the original two paragraphs. */}
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            fontSize: locale === "bg" ? mu(18) : mu(16),
            lineHeight: 1.3,
            letterSpacing: mu(0.2),
            color: "var(--terracotta)",
            maxWidth: locale === "bg" ? mu(280) : mu(250),
          }}
        >
          <p className="mb-0">{tAbout("p1")}</p>
          <p className={tAbout.has("p3") ? "mb-0" : undefined}>{tAbout("p2")}</p>
          {tAbout.has("p3") && <p>{tAbout("p3")}</p>}
        </div>
      </div>
    </section>
  );
}
