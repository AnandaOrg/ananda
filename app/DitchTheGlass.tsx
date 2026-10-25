"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AboutCopyBlock from "./AboutCopyBlock";
import VerticalSlider from "./VerticalSlider";
import { ABOUT_CARD } from "./configs";
import { useExtraMedia, useManagedMaskUrl, useMediaAsset } from "./MediaProvider";
import { HERO_KNOWN_PATHS } from "./hero-media";
import MediaSkeleton, { useMediaLoaded } from "./MediaSkeleton";

gsap.registerPlugin(ScrollTrigger);

const u = (n: number) => `calc(var(--u) * ${n})`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const VIDEO_SRC = "/videos/woman-drinking.mp4";

const GALLERY_CYCLE_S = 1.5;

// One-shot entrance (no pin, no scrub — the page never stops under this
// section): the heading → diamond-travel → gallery/copy choreography plays
// once, over ENTRANCE_S seconds of wall-clock time, when the section scrolls
// into view. render()'s sub-phases are written against the old scrubbed
// 0→1 progress where everything completed by 0.38 (the end of the gallery
// handoff) — tweening prog to PROG_DONE instead of 1 keeps those phase
// proportions spread across the whole entrance.
const ENTRANCE_S = 1.6
const PROG_DONE = 0.38;

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
const coverScale = (w: number, h: number, rotDeg: number) => {
  const rad = (rotDeg * Math.PI) / 180;
  const ratio = w > 0 && h > 0 ? Math.max(w / h, h / w) : 1;
  return Math.cos(rad) + (ratio + 0.02) * Math.sin(rad);
};

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

  const frameMaskUrl = useManagedMaskUrl("/m-photo-card.svg");
  const frameMaskUrlRef = useRef(frameMaskUrl);
  useEffect(() => { frameMaskUrlRef.current = frameMaskUrl; }, [frameMaskUrl]);

  const { loaded: travelLoaded, onLoadedData: onTravelLoaded } = useMediaLoaded();

  // PHOTOS is a fixed-length (4) module-level array — calling the hook unrolled
  // per index keeps this within the rules of hooks.
  const photoAssets = [useMediaAsset(PHOTOS[0].src), useMediaAsset(PHOTOS[1].src), useMediaAsset(PHOTOS[2].src), useMediaAsset(PHOTOS[3].src)];
  const knownPhotos = PHOTOS.map((p, i) => ({ ...p, src: photoAssets[i].url, link: photoAssets[i].link, active: photoAssets[i].active })).filter(
    (p) => p.active
  );
  const extraPhotos = useExtraMedia("hero", HERO_KNOWN_PATHS);
  const photos = [...knownPhotos, ...extraPhotos];
  const photosLengthRef = useRef(photos.length);
  useEffect(() => { photosLengthRef.current = photos.length; }, [photos.length]);

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

    let K0: Box = { left: 0, top: 0, w: 0, h: 0 };
    let K1: Box = { left: 0, top: 0, w: 0, h: 0 };
    let K2: Box = { left: 0, top: 0, w: 0, h: 0 };

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
      const gtP = smooth(clamp((prog - 0.03) / 0.29, 0, 1));
      const gP = gtP;
      const tP = gtP;

      const box = lerpBox(lerpBox(K0, K1, gP), K2, tP);
      travel.style.left = `${box.left}px`;
      travel.style.top = `${box.top}px`;
      travel.style.width = `${box.w}px`;
      travel.style.height = `${box.h}px`;

      const handoff = smooth(clamp((prog - 0.32) / 0.06, 0, 1));

      const rot = 45 * (1 - gP);
      travel.style.transform = `rotate(${rot}deg)`;
      const fill = Math.max(lerp(1.5, 1, gP), coverScale(box.w, box.h, rot));
      inner.style.transform = `rotate(${-rot}deg) scale(${fill.toFixed(4)})`;
      const maskUrl = frameMaskUrlRef.current;
      const maskValue = tP > 0 && maskUrl ? `url(${maskUrl})` : "none";
      travel.style.maskImage = maskValue;
      travel.style.setProperty("-webkit-mask-image", maskValue);
      if (video) {
        if (handoff > 0) { if (!video.paused) video.pause(); }
        else if (video.paused) { void video.play().catch(() => {}); }
      }
      travel.style.opacity = handoff >= 1 ? "0" : "1";

      const textFade = 1 - clamp((prog - 0.08) / 0.12, 0, 1);
      words.forEach((w) => { w.style.opacity = String(textFade); });

      const cP = smooth(clamp((prog - 0.20) / 0.14, 0, 1));
      copy.style.opacity = String(cP);
      copy.style.transform = `translateX(${lerp(-80, 0, cP)}px)`;

      gallery.style.opacity = handoff > 0 ? "1" : "0";
      gallery.style.clipPath = `inset(0 0 ${(1 - handoff) * 100}% 0)`;
    };

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      if (video && !video.src) {
        video.src = VIDEO_SRC;
        video.load();
      }
      const state = { prog: 0 };
      measure();
      render(0);
      const tween = gsap.to(state, {
        prog: PROG_DONE,
        duration: ENTRANCE_S,
        ease: "power2.inOut",
        onUpdate: () => render(state.prog),
        scrollTrigger: { trigger: section, start: "top 60%", once: true },
      });
      const onResize = () => { measure(); render(state.prog); };
      window.addEventListener("resize", onResize);

      let dc: gsap.core.Tween | null = null;
      const cycle = () => {
        setIndex((i) => (i + 1) % photosLengthRef.current);
        dc = gsap.delayedCall(GALLERY_CYCLE_S, cycle);
      };
      const io = new IntersectionObserver(([entry]) => {
        dc?.kill();
        dc = entry.isIntersecting ? gsap.delayedCall(GALLERY_CYCLE_S, cycle) : null;
      });
      io.observe(section);

      return () => {
        window.removeEventListener("resize", onResize);
        io.disconnect();
        dc?.kill();
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

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
          dangerouslySetInnerHTML={{ __html: t.raw("eyebrow") }}
        />

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
            <span ref={placeholderRef} className="inline-block size-[1.2em] shrink-0" aria-hidden />
            <span className="dtg-word" style={{ willChange: "opacity" }}>{t("line2b")}</span>
          </span>
        </h2>
      </div>

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
        <VerticalSlider images={photos} index={index} frame reveal loop duration={1.6} style={{ width: "100%", height: "100%" }} />
      </div>

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
          <MediaSkeleton hidden={travelLoaded} />
          <video
            onLoadedData={onTravelLoaded}
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
