"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mu, MU_VAR } from "./scale";

gsap.registerPlugin(ScrollTrigger);

/**
 * Mobile section — "The RITUAL". Unlike the desktop `RitualCards` fan, the
 * mobile design shows a single static card. The card enters once on scroll
 * (0.85s power3.out fade/scale, ScrollTrigger start "top 85%", once), then the
 * step contents cycle through it every 3s with the same effects as desktop:
 * the incoming photo slides in top-to-bottom (conveyor style) and the
 * title/label/caption wipe in left → right (clip-path).
 * Respects prefers-reduced-motion: card drops in static, no cycling.
 */

// Photo + alt per step; labels/titles/bodies come from the locale dictionary
// (messages/*.json, `ritual.step*`). TODO: /s5-step2.png (Twist) is due for a
// replacement photo — swap the asset in public/ when the client sends it
// (the same file is used by the desktop RitualCards).
const STEP_MEDIA = [
  { src: "/s5-step1.png", alt: "ANANDA pouches chilling in a cooler of ice" },
  { src: "/s5-step2.png", alt: "Snapping open the high-flow cap" },
  { src: "/s5-step3.png", alt: "Sipping an ANANDA pouch on the dancefloor" },
];

const CARD = { w: 342.303, h: 491.887 }; // single card (390-frame units)

const N = STEP_MEDIA.length;
const HOLD = 2; // seconds the contents rest before the next cycle
const PHOTO_DUR = 0.7; // photo top-to-bottom slide duration
const TEXT_DUR = 0.6; // text left-to-right reveal duration
const TEXT_DELAY = 0.15; // reveal starts just after the photo begins moving

// Left→right wipe. Top/bottom insets are negative so the clip rectangle extends
// beyond the text box vertically — otherwise the tight line-height 0.8 title
// (whose caps overflow their own box) gets its tops clipped.
const CLIP_HIDDEN = "inset(-50% 100% -50% 0%)"; // fully clipped from the right
const CLIP_SHOWN = "inset(-50% 0% -50% 0%)";

export default function MobileRitual() {
  const t = useTranslations("ritual");
  const bg = useLocale() === "bg";
  const steps = STEP_MEDIA.map((m, i) => ({
    ...m,
    step: t(`step${i + 1}.label`),
    title: t(`step${i + 1}.title`),
    body: t(`step${i + 1}.body`),
  }));

  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const photos = Array.from(card.querySelectorAll<HTMLElement>("[data-photo]"));
    const textsOf = (k: number) => Array.from(card.querySelectorAll<HTMLElement>(`[data-text-step="${k}"]`));

    // Seed content: start on step 0; the other layers wait hidden (photos
    // parked above the clip window, texts fully clipped).
    photos.forEach((ph, k) => gsap.set(ph, { yPercent: k === 0 ? 0 : -100 }));
    for (let k = 0; k < N; k++) gsap.set(textsOf(k), { clipPath: k === 0 ? CLIP_SHOWN : CLIP_HIDDEN });

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let tick = 0;
    let dc: gsap.core.Tween | null = null;

    function cycle() {
      const oldK = tick;
      tick = (tick + 1) % N;
      const newK = tick;
      // Conveyor slide: the incoming photo enters from the top while the
      // outgoing one exits through the bottom at the same speed.
      gsap.fromTo(photos[newK], { yPercent: -100 }, { yPercent: 0, duration: PHOTO_DUR, ease: "power2.inOut" });
      gsap.to(photos[oldK], {
        yPercent: 100,
        duration: PHOTO_DUR,
        ease: "power2.inOut",
        onComplete: () => gsap.set(photos[oldK], { yPercent: -100 }),
      });
      // Texts: the old step vanishes, the new one wipes in left → right.
      gsap.set(textsOf(oldK), { clipPath: CLIP_HIDDEN });
      gsap.fromTo(
        textsOf(newK),
        { clipPath: CLIP_HIDDEN },
        { clipPath: CLIP_SHOWN, duration: TEXT_DUR, ease: "power2.out", delay: TEXT_DELAY }
      );
      dc = gsap.delayedCall(PHOTO_DUR + HOLD, cycle);
    }

    if (reduce) {
      // No entrance, no cycle: drop the card straight into place.
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
        {/* Top padding 30mu (was 60) — tightened with MobileAbout's bottom
            padding so the mandala → "THE RITUAL" seam isn't a dead zone;
            bottom stays 60mu. */}
        <div className="flex flex-col items-start" style={{ ...MU_VAR, padding: `${mu(30)} ${mu(24)} ${mu(60)}`, gap: mu(43.333) }}>
          {/* Heading */}
          <div className="flex flex-col items-start uppercase text-[#eb4638]" style={{ gap: mu(16) }}>
            <p
              className="whitespace-nowrap"
              style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}
            >
              {t("eyebrow")}
            </p>
            <p
              className="font-bold"
              style={{ fontFamily: "var(--font-display)", fontSize: mu(64), lineHeight: 0.8, letterSpacing: mu(bg ? -1.92 : -5.12), width: mu(276.93) }}
            >
              {t("title")}
            </p>
          </div>

          {/* Single static card — the step contents cycle through it */}
          <div ref={cardRef} className="relative" style={{ width: mu(CARD.w), height: mu(CARD.h), opacity: 0 }}>
            {/* Card silhouette */}
            <div className="absolute inset-0" style={{ transform: "rotate(180deg)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/s5-card2.svg" alt="" className="block size-full" />
            </div>

            {/* Card content */}
            <div
              className="absolute flex flex-col items-start"
              style={{ left: mu(38.72), top: mu(37.62), width: mu(260.411), gap: mu(11.22) }}
            >
              <div className="flex w-full items-end justify-between uppercase text-[#fff0e5]">
                {/* Title — layered per step, revealed left → right. BG titles
                    ("ЗАВЪРТНИ") are longer and share this row with the wider
                    "[СТЪПКА 0X]" label, so BG steps down to keep the pair
                    inside the card. */}
                <div className="grid">
                  {steps.map((s, k) => (
                    <p
                      key={k}
                      data-text-step={k}
                      className="font-bold"
                      style={{ gridArea: "1 / 1", fontFamily: "var(--font-display)", fontSize: mu(bg ? 32 : 39.949), lineHeight: 0.8, letterSpacing: mu(bg ? -0.96 : -3.196), clipPath: k === 0 ? CLIP_SHOWN : CLIP_HIDDEN }}
                    >
                      {s.title}
                    </p>
                  ))}
                </div>
                {/* Step label — layered per step, revealed left → right */}
                <div className="grid" style={{ justifyItems: "end" }}>
                  {steps.map((s, k) => (
                    <p
                      key={k}
                      data-text-step={k}
                      className="whitespace-nowrap"
                      style={{ gridArea: "1 / 1", fontFamily: "var(--font-mono-label)", fontSize: mu(12.484), lineHeight: 0.87, letterSpacing: mu(0.8739), clipPath: k === 0 ? CLIP_SHOWN : CLIP_HIDDEN }}
                    >
                      {s.step}
                    </p>
                  ))}
                </div>
              </div>

              {/* Photo window — all step photos stacked; the active one slides top-to-bottom on each cycle */}
              <div className="relative overflow-hidden" style={{ width: mu(260), height: mu(322.759) }}>
                {/* No inline transform on the layers — the GSAP seed owns
                    yPercent before the card becomes visible (an inline
                    translateY would compound with it and strand the photo
                    off-window). */}
                {steps.map((s) => (
                  <div key={s.src} data-photo className="absolute inset-0">
                    <Image src={s.src} alt={s.alt} fill sizes="60vw" className="object-cover" />
                  </div>
                ))}
              </div>

              {/* Body — layered per step, revealed left → right */}
              <div className="grid" style={{ width: mu(215.05) }}>
                {steps.map((s, k) => (
                  <p
                    key={s.src}
                    data-text-step={k}
                    style={{ gridArea: "1 / 1", fontFamily: "var(--font-body)", fontSize: mu(12), lineHeight: 1.6, letterSpacing: mu(0.12), color: "#fff0e5", clipPath: k === 0 ? CLIP_SHOWN : CLIP_HIDDEN }}
                  >
                    {s.body}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
