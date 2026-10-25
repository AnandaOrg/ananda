"use client";

import { SkeletonImage } from "./MediaSkeleton";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LinkWrap, useMediaAsset } from "./MediaProvider";

gsap.registerPlugin(ScrollTrigger);

const u = (n: number) => `calc(var(--u) * ${n})`;
const CREAM = "#fff0e5";

const CARD = { w: 480, h: 720 };
const REL = {
  photo: { left: 72.96, top: 143.63, w: 320, h: 420 },
  label: { right: 54.31, top: 68.78, font: 10.83, pad: [7.74, 10.83], ls: 0.76 },
  title: { left: 54.31, top: 49.9, w: 331.65, font: 74.27, ls: -5.94, fontBg: 56, lsBg: -1.68 },
  body: { left: 72.96, top: 591.63, w: 300, font: 12.38, pad: [7.74, 10.83], ls: 0.12 },
};

const STEP_MEDIA = [
  { src: "/s5-step1.png", alt: "ANANDA pouches chilling in a cooler of ice" },
  { src: "/s5-step2.png", alt: "Snapping open the high-flow cap" },
  { src: "/s5-step3.png", alt: "Sipping an ANANDA pouch on the dancefloor" },
];

const SLOTS = [
  { x: 480, y: 671.14, rotation: 0, scale: 1, z: 3 },
  { x: 178, y: 671.14, rotation: -20, scale: 0.76, z: 2 },
  { x: 802, y: 671.14, rotation: 20, scale: 0.76, z: 1 },
];

const N = STEP_MEDIA.length;
const HOLD = 1;
const PHOTO_DUR = 0.6;
const TEXT_DUR = 0.5;
const TEXT_DELAY = 0.15;

const REVEAL = [
  { prop: "yPercent", enter: -100, exit: 100 },
  { prop: "xPercent", enter: 100, exit: -100 },
  { prop: "xPercent", enter: -100, exit: 100 },
] as const;

const CLIP_HIDDEN = "inset(0% 100% 0% 0%)";
const CLIP_SHOWN = "inset(0% 0% 0% 0%)";

const stepOf = (frame: number, tick: number) => (frame + tick) % N;

export default function RitualCards() {
  const t = useTranslations("ritual");
  const bg = useLocale() === "bg";
  const cardMask = useMediaAsset("/s5-card2.svg");
  // STEP_MEDIA is a fixed-length (3) module-level array — calling the hook
  // unrolled per index keeps this within the rules of hooks.
  const stepMedia = [useMediaAsset(STEP_MEDIA[0].src), useMediaAsset(STEP_MEDIA[1].src), useMediaAsset(STEP_MEDIA[2].src)];
  const steps = STEP_MEDIA.map((m, i) => ({
    ...m,
    url: stepMedia[i].url,
    active: stepMedia[i].active,
    link: stepMedia[i].link,
    step: t.raw(`step${i + 1}.label`),
    title: t.raw(`step${i + 1}.title`),
    body: t.raw(`step${i + 1}.body`),
  }));

  const layerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const layer = layerRef.current;
    const frames = cardRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (!layer || frames.length < N) return;

    const photosOf = (el: HTMLDivElement) => Array.from(el.querySelectorAll<HTMLElement>("[data-photo]"));
    const textsOf = (el: HTMLDivElement, k: number) =>
      Array.from(el.querySelectorAll<HTMLElement>(`[data-text-step="${k}"]`));

    frames.forEach((el, f) => {
      const { prop, enter } = REVEAL[f];
      photosOf(el).forEach((ph, k) => gsap.set(ph, { [prop]: k === f ? 0 : enter }));
      for (let k = 0; k < N; k++) gsap.set(textsOf(el, k), { clipPath: k === f ? CLIP_SHOWN : CLIP_HIDDEN });
    });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let tick = 0;
    let dc: gsap.core.Tween | null = null;

    function cycle() {
      const prev = tick;
      tick = (tick + 1) % N;
      frames.forEach((el, f) => {
        const oldK = stepOf(f, prev);
        const newK = stepOf(f, tick);
        const photos = photosOf(el);
        const { prop, enter, exit } = REVEAL[f];
        gsap.fromTo(photos[newK], { [prop]: enter }, { [prop]: 0, duration: PHOTO_DUR, ease: "power2.inOut" });
        gsap.to(photos[oldK], {
          [prop]: exit,
          duration: PHOTO_DUR,
          ease: "power2.inOut",
          onComplete: () => gsap.set(photos[oldK], { [prop]: enter }),
        });
        gsap.set(textsOf(el, oldK), { clipPath: CLIP_HIDDEN });
        gsap.fromTo(
          textsOf(el, newK),
          { clipPath: CLIP_HIDDEN },
          { clipPath: CLIP_SHOWN, duration: TEXT_DUR, ease: "power2.out", delay: TEXT_DELAY }
        );
      });
      dc = gsap.delayedCall(PHOTO_DUR + HOLD, cycle);
    }

    if (reduce) {
      frames.forEach((el, i) => gsap.set(el, { rotation: SLOTS[i].rotation, scale: SLOTS[i].scale, opacity: 1 }));
      return () => gsap.killTweensOf(frames);
    }

    frames.forEach((el, i) => gsap.set(el, { rotation: SLOTS[i].rotation, scale: SLOTS[i].scale, opacity: 0 }));

    const st = ScrollTrigger.create({
      trigger: layer,
      start: "top 85%",
      once: true,
      onEnter() {
        const px = layer.offsetWidth / 1440;
        frames.forEach((el, i) => {
          const slot = SLOTS[i];
          gsap.fromTo(
            el,
            { x: (SLOTS[0].x - slot.x) * px, y: (SLOTS[0].y - slot.y) * px, rotation: 0, scale: slot.scale * 0.9, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: slot.rotation,
              scale: slot.scale,
              opacity: 1,
              duration: 0.85,
              ease: "power3.out",
              delay: i * 0.14,
              ...(i === N - 1 ? { onComplete: () => { dc = gsap.delayedCall(HOLD, cycle); } } : {}),
            }
          );
        });
      },
    });

    return () => {
      st.kill();
      dc?.kill();
      gsap.killTweensOf(frames);
      frames.forEach((el) => {
        gsap.killTweensOf(photosOf(el));
        for (let k = 0; k < N; k++) gsap.killTweensOf(textsOf(el, k));
      });
    };
  }, []);

  return (
    <div ref={layerRef} className="absolute inset-0" style={{ pointerEvents: "none" }}>
      {SLOTS.map((slot, f) => (
        <div
          key={slot.x}
          ref={el => { cardRefs.current[f] = el; }}
          className="absolute"
          style={{ left: u(slot.x), top: u(slot.y), width: u(CARD.w), height: u(CARD.h), opacity: 0, zIndex: slot.z }}
        >
          {cardMask.active && (
            <div style={{ position: "absolute", inset: 0, transform: "rotate(180deg)" }}>
              <img src={cardMask.url} alt="" className="block size-full" />
            </div>
          )}

          <div
            className="absolute overflow-hidden"
            style={{ left: u(REL.photo.left), top: u(REL.photo.top), width: u(REL.photo.w), height: u(REL.photo.h) }}
          >
            {steps.map((s) => (
              <div key={s.src} data-photo className="absolute inset-0">
                {s.active ? (
                  <LinkWrap href={s.link} fill>
                    <SkeletonImage src={s.url} alt={s.alt} fill sizes="40vw" className="object-cover" />
                  </LinkWrap>
                ) : (
                  <div className="absolute inset-0" style={{ backgroundColor: CREAM }} />
                )}
              </div>
            ))}
          </div>

          <div
            className="absolute grid"
            style={{ right: u(REL.label.right), top: u(REL.label.top), padding: `${u(REL.label.pad[0])} ${u(REL.label.pad[1])}`, justifyItems: "end" }}
          >
            {steps.map((s, k) => (
              <p
                key={k}
                data-text-step={k}
                className="whitespace-nowrap uppercase"
                style={{ gridArea: "1 / 1", fontFamily: "var(--font-mono-label)", fontSize: u(REL.label.font), lineHeight: 0.87, letterSpacing: u(REL.label.ls), color: CREAM, clipPath: k === f ? CLIP_SHOWN : CLIP_HIDDEN }}
                dangerouslySetInnerHTML={{ __html: s.step }}
              />
            ))}
          </div>

          <div className="absolute grid" style={{ left: u(REL.title.left), top: u(REL.title.top), width: u(REL.title.w) }}>
            {steps.map((s, k) => (
              <p
                key={k}
                data-text-step={k}
                className="font-bold uppercase"
                style={{ gridArea: "1 / 1", fontFamily: "var(--font-display)", fontSize: u(bg ? REL.title.fontBg : REL.title.font), lineHeight: 1, letterSpacing: u(bg ? REL.title.lsBg : REL.title.ls), color: CREAM, clipPath: k === f ? CLIP_SHOWN : CLIP_HIDDEN }}
                dangerouslySetInnerHTML={{ __html: s.title }}
              />
            ))}
          </div>

          <div className="absolute grid" style={{ left: u(REL.body.left), top: u(REL.body.top), width: u(REL.body.w) }}>
            {steps.map((s, k) => (
              <p
                key={s.src}
                data-text-step={k}
                className="text-left"
                style={{ gridArea: "1 / 1", padding: `${u(REL.body.pad[0])} ${u(REL.body.pad[1])}`, fontFamily: "var(--font-body)", fontSize: u(REL.body.font), lineHeight: 1.6, letterSpacing: u(REL.body.ls), color: CREAM, clipPath: k === f ? CLIP_SHOWN : CLIP_HIDDEN }}
                dangerouslySetInnerHTML={{ __html: s.body }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
