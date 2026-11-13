"use client";

import { SkeletonImage } from "../MediaSkeleton";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mu, MU_VAR } from "./scale";
import { LinkWrap, useMediaAsset } from "../MediaProvider";

gsap.registerPlugin(ScrollTrigger);

const STEP_MEDIA = [
  { src: "/s5-step1.png", altKey: "step1" },
  { src: "/s5-step2.png", altKey: "step2" },
  { src: "/s5-step3.png", altKey: "step3" },
];

const CARD = { w: 342.303, h: 491.887 };

const N = STEP_MEDIA.length;
const HOLD = 1.1;
const PHOTO_DUR = 0.5;
const TEXT_DUR = 0.4;
const TEXT_DELAY = 0.14;

const CLIP_HIDDEN = "inset(-50% 100% -50% 0%)";
const CLIP_SHOWN = "inset(-50% 0% -50% 0%)";

export default function MobileRitual() {
  const t = useTranslations("ritual");
  const bg = useLocale() === "bg";
  const tA11y = useTranslations("a11y");
  const cardMask = useMediaAsset("/s5-card2.svg");
  // STEP_MEDIA is a fixed-length (3) module-level array — calling the hook
  // unrolled per index keeps this within the rules of hooks.
  const stepMedia = [useMediaAsset(STEP_MEDIA[0].src), useMediaAsset(STEP_MEDIA[1].src), useMediaAsset(STEP_MEDIA[2].src)];
  const steps = STEP_MEDIA.map((m, i) => ({
    ...m,
    alt: tA11y(m.altKey),
    url: stepMedia[i].url,
    active: stepMedia[i].active,
    link: stepMedia[i].link,
    step: t(`step${i + 1}.label`),
    title: t(`step${i + 1}.title`),
    body: t.raw(`step${i + 1}.body`),
  }));

  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const photos = Array.from(card.querySelectorAll<HTMLElement>("[data-photo]"));
    const textsOf = (k: number) => Array.from(card.querySelectorAll<HTMLElement>(`[data-text-step="${k}"]`));

    photos.forEach((ph, k) => gsap.set(ph, { yPercent: k === 0 ? 0 : -100 }));
    for (let k = 0; k < N; k++) gsap.set(textsOf(k), { clipPath: k === 0 ? CLIP_SHOWN : CLIP_HIDDEN });

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let tick = 0;
    let dc: gsap.core.Tween | null = null;

    function cycle() {
      const oldK = tick;
      tick = (tick + 1) % N;
      const newK = tick;
      gsap.fromTo(photos[newK], { yPercent: -100 }, { yPercent: 0, duration: PHOTO_DUR, ease: "power2.inOut" });
      gsap.to(photos[oldK], {
        yPercent: 100,
        duration: PHOTO_DUR,
        ease: "power2.inOut",
        onComplete: () => gsap.set(photos[oldK], { yPercent: -100 }),
      });
      gsap.set(textsOf(oldK), { clipPath: CLIP_HIDDEN });
      gsap.fromTo(
        textsOf(newK),
        { clipPath: CLIP_HIDDEN },
        { clipPath: CLIP_SHOWN, duration: TEXT_DUR, ease: "power2.out", delay: TEXT_DELAY }
      );
      dc = gsap.delayedCall(PHOTO_DUR + HOLD, cycle);
    }

    if (reduce) {
      gsap.set(card, { opacity: 1 });
      return () => gsap.killTweensOf([card, ...photos]);
    }

    const st = ScrollTrigger.create({
      trigger: card,
      start: "top 85%",
      once: true,
      onEnter() {
        gsap.fromTo(
          card,
          { scale: 0.94, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            onComplete: () => { dc = gsap.delayedCall(HOLD, cycle); },
          }
        );
      },
    });

    return () => {
      st.kill();
      dc?.kill();
      gsap.killTweensOf([card, ...photos]);
      for (let k = 0; k < N; k++) gsap.killTweensOf(textsOf(k));
    };
  }, []);

  return (
    <section className="flex w-full justify-center overflow-hidden bg-[#fff0e5] md:hidden">
      <div className="w-full" style={{ containerType: "inline-size" }}>
        <div className="flex flex-col items-start" style={{ ...MU_VAR, padding: `${mu(30)} ${mu(24)} ${mu(60)}`, gap: mu(43.333) }}>
          <div className="flex flex-col items-start uppercase text-[#eb4638]" style={{ gap: mu(16) }}>
            <p
              className="whitespace-nowrap"
              style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}
              dangerouslySetInnerHTML={{ __html: t.raw("eyebrow") }}
            />
            <p
              className="font-bold"
              style={{ fontFamily: "var(--font-display)", fontSize: mu(64), lineHeight: 0.8, letterSpacing: mu(bg ? -1.92 : -5.12), width: mu(276.93) }}
              dangerouslySetInnerHTML={{ __html: t.raw("title") }}
            />
          </div>

          <div ref={cardRef} className="relative" style={{ width: mu(CARD.w), height: mu(CARD.h), opacity: 0 }}>
            {cardMask.active && (
              <div className="absolute inset-0" style={{ transform: "rotate(180deg)" }}>
                <img src={cardMask.url} alt="" className="block size-full" />
              </div>
            )}

            <div
              className="absolute flex flex-col items-start"
              style={{ left: mu(38.72), top: mu(37.62), width: mu(260.411), gap: mu(11.22) }}
            >
              <div className="flex w-full items-baseline justify-between uppercase text-[#fff0e5]">
                <div className="grid">
                  {steps.map((s, k) => (
                    <p
                      key={k}
                      data-text-step={k}
                      className="font-bold"
                      style={{ gridArea: "1 / 1", fontFamily: "var(--font-display)", fontSize: mu(bg ? 32 : 39.949), lineHeight: 0.8, letterSpacing: mu(bg ? -0.96 : -3.196), clipPath: k === 0 ? CLIP_SHOWN : CLIP_HIDDEN }}
                      dangerouslySetInnerHTML={{ __html: s.title }}
                    />
                  ))}
                </div>
                <div className="grid" style={{ justifyItems: "end" }}>
                  {steps.map((s, k) => (
                    <p
                      key={k}
                      data-text-step={k}
                      className="whitespace-nowrap"
                      style={{ gridArea: "1 / 1", fontFamily: "var(--font-mono-label)", fontSize: mu(12.484), lineHeight: 0.87, letterSpacing: mu(0.8739), clipPath: k === 0 ? CLIP_SHOWN : CLIP_HIDDEN }}
                      dangerouslySetInnerHTML={{ __html: s.step }}
                    />
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden" style={{ width: mu(260), height: mu(322.759) }}>
                {steps.map((s) => (
                  <div key={s.src} data-photo className="absolute inset-0">
                    {s.active ? (
                      <LinkWrap href={s.link} fill>
                        <SkeletonImage src={s.url} alt={s.alt} fill sizes="60vw" className="object-cover" />
                      </LinkWrap>
                    ) : (
                      <div className="absolute inset-0" style={{ backgroundColor: "#fff0e5" }} />
                    )}
                  </div>
                ))}
              </div>

              <div className="grid" style={{ width: mu(260) }}>
                {steps.map((s, k) => (
                  <p
                    key={s.src}
                    data-text-step={k}
                    style={{ gridArea: "1 / 1", fontFamily: "var(--font-body)", fontSize: mu(12), lineHeight: 1.6, letterSpacing: mu(0.12), color: "#fff0e5", clipPath: k === 0 ? CLIP_SHOWN : CLIP_HIDDEN }}
                    dangerouslySetInnerHTML={{ __html: s.body }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
