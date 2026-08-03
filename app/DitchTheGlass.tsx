"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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

const VIDEO_SRC = "/videos/woman-drinking.mp4";

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
// Minimum scale for counter-rotated content to fully COVER its w×h frame at
// `rotDeg`: cosθ + (long/short ratio)·sinθ, padded a hair so antialiasing never
// shows a hairline at the corners. The aesthetic 1.5→1 zoom dips below this
// mid-transition (≈1.25 at 22.5° where ≥1.31 is required), which exposed the
// video's flat edges inside the rotated frame as "cut corners".
const coverScale = (w: number, h: number, rotDeg: number) => {
  const rad = (rotDeg * Math.PI) / 180;
  const ratio = w > 0 && h > 0 ? Math.max(w / h, h / w) : 1;
  return Math.cos(rad) + (ratio + 0.02) * Math.sin(rad);
};

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
  const t = useTranslations("hero");
  const locale = useLocale();
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

    const video = inner.querySelector<HTMLVideoElement>("video");
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

      // hand-off conveyor: the pour video and the gallery's first photo run the
      // SAME move as every later gallery step — no cross-dissolve. The video
      // wipes downward out of the (fixed, masked) card window while photo #0
      // descends into it from above, both eased together. direction="down" ⇒
      // incoming enters from the top, outgoing exits the bottom.
      const handoff = smooth(clamp((prog - 0.32) / 0.06, 0, 1));

      const rot = 45 * (1 - gP);
      travel.style.transform = `rotate(${rot}deg)`;
      const fill = Math.max(lerp(1.5, 1, gP), coverScale(box.w, box.h, rot));
      inner.style.transform = `rotate(${-rot}deg) scale(${fill.toFixed(4)})`;
      // adopt the curved photo-card frame as it heads for the slot
      travel.style.maskImage = tP > 0 ? "url(/m-photo-card.svg)" : "none";
      travel.style.setProperty("-webkit-mask-image", tP > 0 ? "url(/m-photo-card.svg)" : "none");
      // The video sits STILL beneath the incoming photo — it never slides. It
      // freezes the instant the reveal starts (so it isn't playing behind the
      // wipe) and is dropped once the photo has fully covered it.
      if (video) {
        if (handoff > 0) { if (!video.paused) video.pause(); }
        else if (video.paused) { void video.play().catch(() => {}); }
      }
      travel.style.opacity = handoff >= 1 ? "0" : "1";

      // heading fades out as the image grows
      const textFade = 1 - clamp((prog - 0.08) / 0.12, 0, 1);
      words.forEach((w) => { w.style.opacity = String(textFade); });

      // the copy fades + slides in on the right WHILE the image travels left
      const cP = smooth(clamp((prog - 0.20) / 0.14, 0, 1));
      copy.style.opacity = String(cP);
      copy.style.transform = `translateX(${lerp(-80, 0, cP)}px)`;

      // hand-off: the first photo is revealed IN PLACE over the frozen video,
      // wiping top→bottom (the bottom inset shrinks to 0), so nothing floats
      // above the slot and the video never moves — it is simply covered.
      gallery.style.opacity = handoff > 0 ? "1" : "0";
      gallery.style.clipPath = `inset(0 0 ${(1 - handoff) * 100}% 0)`;

      // step the gallery through its photos over the rest of the pin
      const step = clamp(Math.floor(((prog - 0.38) / 0.62) * PHOTOS.length), 0, PHOTOS.length - 1);
      if (step !== indexRef.current) {
        indexRef.current = step;
        setIndex(step);
      }
    };

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      // Only the desktop, motion-enabled variant ever plays this scene, so
      // only it should ever fetch the clip — attaching `src` here (instead of
      // as a static JSX attribute) means the mobile twin's `hidden md:block`
      // wrapper actually stops the download, not just the paint.
      if (video && !video.src) {
        video.src = VIDEO_SRC;
        video.load();
      }
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
      gallery.style.clipPath = "inset(0 0 0% 0)";
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
          {t("eyebrow")}
        </p>

        {/* Per-locale sizing: the BG line is wider than EN's "Mixed to ◆ Move."
            — the clamp shrinks for BG so the diamond line always fits the
            viewport. BG also relaxes the -0.08em Anek tracking: Golos glyphs
            fill their advance widths, so the design tracking crushes them. */}
        <h2
          className="font-bold uppercase leading-[0.8]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: locale === "bg" ? "clamp(2rem, 7.3vw, 105px)" : "clamp(2.75rem, 12.5vw, 180px)",
            letterSpacing: locale === "bg" ? "-0.03em" : "-0.08em",
          }}
        >
          <span className="dtg-word block" style={{ willChange: "opacity" }}>{t("line1")}</span>
          <span className="flex items-center justify-center gap-[0.2em]">
            <span className="dtg-word" style={{ willChange: "opacity" }}>{t("line2a")}</span>
            {/* Reserves the inline gap; the traveling image overlays it at rest. */}
            <span ref={placeholderRef} className="inline-block size-[1.2em] shrink-0" aria-hidden />
            <span className="dtg-word" style={{ willChange: "opacity" }}>{t("line2b")}</span>
          </span>
        </h2>
      </div>

      {/* Gallery — pinned at the card slot. The pour video is revealed over by
          the first photo (top→bottom, see render), and every following photo
          steps with the SAME top→bottom reveal (`reveal` mode): each new photo
          is painted over the current one from the top edge down, current held
          still beneath. duration={0.7} matches the hand-off feel. */}
      <div
        ref={galleryRef}
        data-dtg="gallery"
        className="absolute"
        style={{
          ...ABOUT_CARD,
          opacity: 0,
          zIndex: 6,
          clipPath: "inset(0 0 100% 0)",
          willChange: "clip-path, opacity",
        }}
      >
        <VerticalSlider images={PHOTOS} index={index} frame reveal duration={0.7} style={{ width: "100%", height: "100%" }} />
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
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
