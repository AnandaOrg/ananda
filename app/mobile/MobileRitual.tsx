"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mu, MU_VAR } from "./scale";

gsap.registerPlugin(ScrollTrigger);

/**
 * Mobile section — "The RITUAL" (Figma 184:2999). Mirrors the desktop
 * `RitualCards` exactly: the three step-cards sit fanned in a stack (front sharp,
 * the other two faded behind), enter with a staggered rotate/scale/fade
 * (0.85s power3.out, ScrollTrigger start "top 85%", once), then auto-shuffle —
 * the front card drops to the back and the next rises every cycle (0.9s
 * power2.inOut, 3s hold). Only the fan geometry is compressed to the 390px frame.
 * Respects prefers-reduced-motion: stack drops in static, no shuffle.
 */

const STEPS = [
  { src: "/s5-step1.png", alt: "ANANDA pouches chilling in a cooler of ice", step: "[Step 01]", title: "Chill", body: "Submerge the pouch in ice or drop it in the freezer." },
  { src: "/s5-step2.png", alt: "Snapping open the high-flow cap", step: "[Step 02]", title: "Twist", body: "Snap open the high-flow cap. No openers, no glass." },
  { src: "/s5-step3.png", alt: "Sipping an ANANDA pouch on the dancefloor", step: "[Step 03]", title: "Sip", body: "Sip it straight from the pouch, or pour it over crushed ice." },
];

const CARD = { w: 342.303, h: 491.887 }; // single card (390-frame units)

// The three stacked positions a card can occupy, ordered front → back. Offsets
// are compressed for mobile so the fan fits 390px; `fromRotation` is the entrance
// flourish only (cards rest upright). Mirrors the desktop SLOTS structure.
const SLOTS = [
  { x: 0, y: 0, opacity: 1, z: 3, fromRotation: -5 },   // front
  { x: 14, y: 40, opacity: 0.2, z: 2, fromRotation: 10 }, // middle
  { x: 28, y: 80, opacity: 0.2, z: 1, fromRotation: -14 }, // back
];

const STACK_W = CARD.w + SLOTS[SLOTS.length - 1].x; // widest fan extent
const STACK_H = CARD.h + SLOTS[SLOTS.length - 1].y;

const N = STEPS.length; // === SLOTS.length === 3
const HOLD = 3; // seconds a card rests in front before the next shuffle
const DUR = 0.9; // shuffle duration

// Each shuffle advances `tick`; the front card (slot 0) drops to the back.
const slotOf = (cardIdx: number, tick: number) => ((cardIdx - tick) % N + N) % N;

export default function MobileRitual() {
  const stackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const stack = stackRef.current;
    const cards = cardRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (!stack || cards.length < N) return;

    // Figma px → device px. The stack spans STACK_W design units.
    const uPx = () => stack.offsetWidth / STACK_W;

    const placeXY = (el: HTMLDivElement, slotIdx: number, animate: boolean) => {
      const s = SLOTS[slotIdx];
      const px = uPx();
      const vars = { x: s.x * px, y: s.y * px, opacity: s.opacity };
      if (animate) gsap.to(el, { ...vars, duration: DUR, ease: "power2.inOut" });
      else gsap.set(el, vars);
    };

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let tick = 0;
    let dc: gsap.core.Tween | null = null;

    const onResize = () => cards.forEach((el, i) => placeXY(el, slotOf(i, tick), false));
    const ro = new ResizeObserver(onResize);

    function shuffle() {
      tick = (tick + 1) % N;
      cards.forEach((el, i) => placeXY(el, slotOf(i, tick), true));
      // Swap paint order at the midpoint so the incoming card has cleared the
      // others before it rises.
      gsap.delayedCall(DUR / 2, () => {
        cards.forEach((el, i) => gsap.set(el, { zIndex: SLOTS[slotOf(i, tick)].z }));
      });
      dc = gsap.delayedCall(DUR + HOLD, shuffle);
    }

    if (reduce) {
      cards.forEach((el, i) => {
        gsap.set(el, { rotation: 0, scale: 1, zIndex: SLOTS[i].z });
        placeXY(el, i, false);
      });
      ro.observe(stack);
      return () => ro.disconnect();
    }

    // Seed each card at its slot, hidden, ready for the entrance.
    cards.forEach((el, i) => {
      placeXY(el, i, false);
      gsap.set(el, { opacity: 0, zIndex: SLOTS[i].z });
    });

    const st = ScrollTrigger.create({
      trigger: stack,
      start: "top 85%",
      once: true,
      onEnter() {
        cards.forEach((el, i) => {
          const slot = SLOTS[i];
          gsap.fromTo(
            el,
            { rotation: slot.fromRotation, scale: 0.94, opacity: 0 },
            {
              rotation: 0,
              scale: 1,
              opacity: slot.opacity,
              duration: 0.85,
              ease: "power3.out",
              delay: i * 0.14,
              ...(i === N - 1 ? { onComplete: () => { dc = gsap.delayedCall(HOLD, shuffle); } } : {}),
            }
          );
        });
      },
    });

    ro.observe(stack);

    return () => {
      st.kill();
      dc?.kill();
      ro.disconnect();
      gsap.killTweensOf(cards);
    };
  }, []);

  return (
    <section className="flex w-full justify-center overflow-hidden bg-[#fff0e5] md:hidden">
      <div className="w-full" style={{ containerType: "inline-size" }}>
        <div className="flex flex-col items-start" style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)}`, gap: mu(43.333) }}>
          {/* Heading */}
          <div className="flex flex-col items-start uppercase text-[#eb4638]" style={{ gap: mu(16) }}>
            <p
              className="whitespace-nowrap"
              style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}
            >
              [03] How it works
            </p>
            <p
              className="font-bold"
              style={{ fontFamily: "var(--font-display)", fontSize: mu(64), lineHeight: 0.8, letterSpacing: mu(-5.12), width: mu(276.93) }}
            >
              The Ritual
            </p>
          </div>

          {/* Card stack — three step-cards fanned behind each other, shuffling */}
          <div ref={stackRef} className="relative" style={{ width: mu(STACK_W), height: mu(STACK_H) }}>
            {STEPS.map((s, i) => (
              <div
                key={s.src}
                ref={(el) => { cardRefs.current[i] = el; }}
                className="absolute"
                style={{ left: 0, top: 0, width: mu(CARD.w), height: mu(CARD.h), opacity: 0 }}
              >
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
                    <p className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: mu(39.949), lineHeight: 0.8, letterSpacing: mu(-3.196) }}>
                      {s.title}
                    </p>
                    <p className="whitespace-nowrap" style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12.484), lineHeight: 0.87, letterSpacing: mu(0.8739) }}>
                      {s.step}
                    </p>
                  </div>
                  <div className="relative overflow-hidden" style={{ width: mu(260), height: mu(322.759) }}>
                    <Image src={s.src} alt={s.alt} fill sizes="60vw" className="object-cover" />
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: mu(12), lineHeight: 1.6, letterSpacing: mu(0.12), color: "#fff0e5", width: mu(215.05) }}>
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
