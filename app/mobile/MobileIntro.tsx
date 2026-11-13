"use client";

import { SkeletonImage } from "../MediaSkeleton";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import VerticalSlider, { frameMaskStyle } from "../VerticalSlider";
import { mu, MU_VAR } from "./scale";
import { useExtraMedia, useManagedMaskUrl, useMediaAsset } from "../MediaProvider";
import { HERO_KNOWN_PATHS } from "../hero-media";

gsap.registerPlugin(ScrollTrigger);

const RED = "#eb4638";
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const coverScale = (w: number, h: number, rotDeg: number) => {
  const rad = (rotDeg * Math.PI) / 180;
  const ratio = w > 0 && h > 0 ? Math.max(w / h, h / w) : 1;
  return Math.cos(rad) + (ratio + 0.02) * Math.sin(rad);
};

const GALLERY = [
  { src: "/hero_3/1.png", alt: "ANANDA moment" },
  { src: "/hero_3/2.png", alt: "ANANDA moment" },
  { src: "/hero_3/3.png", alt: "ANANDA moment" },
  { src: "/hero_3/4.png", alt: "ANANDA moment" },
  { src: "/hero_3/5.png", alt: "ANANDA moment" },
];

const DIAMOND_BOX = { left: 102.79, top: 268.78, w: 152, h: 145.51693725585938 };
const DIAMOND_SIDE = DIAMOND_BOX.w / Math.SQRT2;
const DIAMOND_CX = DIAMOND_BOX.left + DIAMOND_BOX.w / 2;
const DIAMOND_CY = DIAMOND_BOX.top + DIAMOND_BOX.h / 2;

const GALLERY_LEFT_MU = 20;
const GALLERY_TOP_MU = 28;
const GALLERY_W_MU = 390 - 2 * 20;
const GALLERY_H_SVH = 0.56;
const muPx = (n: number, vw: number) => (n / 390) * vw;

// Entrance choreography: a ONE-SHOT timeline (not scroll-scrubbed, no pin —
// see the ScrollTrigger below) that plays once as the section scrolls into
// view. `prog` here is driven by a plain tween from 0→1 over ENTRANCE_S
// seconds of wall-clock time, not by how far the user has scrolled — the
// page never stops moving under it. GROW_END/HANDOFF are fractions of that
// timeline, not of a scroll distance.
const ENTRANCE_S = 1.6;
const GROW_END = 0.55; // diamond finishes rotating + growing here
const HANDOFF = 0.45; // gallery becomes visible just before the diamond hides
// Gallery photos change on their own clock — see VerticalSlider's `interval`
// prop below — completely decoupled from scroll and from the entrance timeline.
const GALLERY_AUTOPLAY_MS = 1600;

export default function MobileIntro() {
  const t = useTranslations("hero");
  const tAbout = useTranslations("about");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();
  const headingWords = [...t("line1").split(" "), ...t("line2a").split(" "), t("line2b")];

  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  const frameMaskUrl = useManagedMaskUrl("/m-photo-card.svg");
  // GALLERY is a fixed-length (5) module-level array — calling the hook unrolled
  // per index keeps this within the rules of hooks.
  const galleryAssets = [
    useMediaAsset(GALLERY[0].src),
    useMediaAsset(GALLERY[1].src),
    useMediaAsset(GALLERY[2].src),
    useMediaAsset(GALLERY[3].src),
    useMediaAsset(GALLERY[4].src),
  ];
  const knownGallery = GALLERY.map((g, i) => ({ ...g, alt: tA11y("heroPhoto"), src: galleryAssets[i].url, link: galleryAssets[i].link, active: galleryAssets[i].active })).filter(
    (g) => g.active
  );
  const extraGallery = useExtraMedia("hero", HERO_KNOWN_PATHS);
  const gallery = [...knownGallery, ...extraGallery];
  const diamondPhoto = knownGallery[0] ?? { ...GALLERY[0], alt: tA11y("heroPhoto") };

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

      const fade = 1 - clamp(prog / 0.35, 0, 1);
      words.forEach((el) => { el.style.opacity = String(fade); });

      gallery.style.opacity = prog >= HANDOFF ? "1" : "0";
      frame.style.opacity = prog >= GROW_END ? "0" : "1";
      copy.style.opacity = String(clamp((prog - GROW_END) / 0.25, 0, 1));
    };

    const mm = gsap.matchMedia();
    mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
      // No pin, no scroll-scrub: the whole diamond-grow → gallery hand-off
      // plays ONCE, over ENTRANCE_S seconds of wall-clock time, the instant
      // the section scrolls into view — the page keeps scrolling normally
      // the whole time (zero stickiness). Gallery photos change on their own
      // clock (VerticalSlider's `interval` below), independent of this.
      const obj = { prog: 0 };
      render(0);
      const tween = gsap.to(obj, {
        prog: 1,
        duration: ENTRANCE_S,
        ease: "power2.inOut",
        onUpdate: () => render(obj.prog),
        scrollTrigger: { trigger: section, start: "top 75%", once: true },
      });
      return () => tween.kill();
    });

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
        dangerouslySetInnerHTML={{ __html: t.raw("eyebrow") }}
      />

      <h2
        className="absolute font-bold uppercase"
        style={{
          top: mu(100),
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: locale === "bg" ? mu(48) : mu(106),
          lineHeight: 0.8,
          letterSpacing: locale === "bg" ? "-0.03em" : "-0.08em",
          ...(locale === "bg"
            ? { left: "50%", transform: "translateX(-50%)" }
            : { left: mu(60), width: mu(270) }),
        }}
      >
        {headingWords.map((word, i) => (
          <span key={i} className="dtg-word block" style={{ willChange: "opacity" }}>{word}</span>
        ))}
      </h2>

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
        <VerticalSlider images={gallery} interval={GALLERY_AUTOPLAY_MS} frame eagerCount={2} style={{ width: "100%", height: "100%" }} />
      </div>

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
          ...frameMaskStyle(frameMaskUrl),
          willChange: "transform, width, height, left, top, opacity",
        }}
      >
        <div ref={innerRef} className="absolute inset-0" style={{ transform: "rotate(-45deg) scale(1.5)", willChange: "transform" }}>
          <SkeletonImage
            src={diamondPhoto.src}
            alt={diamondPhoto.alt}
            fill
            sizes="75vw"
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      </div>

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
          dangerouslySetInnerHTML={{ __html: tAbout.raw("eyebrow") }}
        />
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
          <p className="mb-0" dangerouslySetInnerHTML={{ __html: tAbout.raw("p1") }} />
          <p className={tAbout.has("p3") ? "mb-0" : undefined} dangerouslySetInnerHTML={{ __html: tAbout.raw("p2") }} />
          {tAbout.has("p3") && <p dangerouslySetInnerHTML={{ __html: tAbout.raw("p3") }} />}
        </div>
      </div>
    </section>
  );
}
