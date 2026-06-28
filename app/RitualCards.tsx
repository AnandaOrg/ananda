"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const u = (n: number) => `calc(var(--u) * ${n})`;
const CREAM = "#fff0e5";

// Card outer dimensions (Figma) and the fixed internal layout of every card.
// Because a card is now a rigid unit (border + photo + text) that travels
// between slots as one piece, these offsets are identical for all cards.
const CARD = { w: 480, h: 720 };
// Positions/fonts are in the same canvas-u space as CARD, re-fitted to the
// 480×720 frame (scaled from the original 620.422×863.666 design).
const REL = {
  photo: { left: 72.96, top: 143.63, w: 320, h: 420 },
  label: { left: 342.64, top: 68.78, font: 10.83, pad: [7.74, 10.83], ls: 0.76 },
  title: { left: 54.31, top: 49.9, w: 331.65, font: 74.27, ls: -5.94 },
  body: { left: 119.04, top: 608.16, w: 310.24, font: 12.38, pad: [7.74, 10.83], ls: 0.12 },
};

const STEPS = [
  {
    src: "/s5-step1.png",
    alt: "ANANDA pouches chilling in a cooler of ice",
    step: "[Step 01]",
    title: "Chill",
    body: "Submerge the pouch in ice or drop it in the freezer. Let the sub-zero edge lock the real botanical juices and premium spirits into place.",
  },
  {
    src: "/s5-step2.png",
    alt: "Snapping open the high-flow cap",
    step: "[Step 02]",
    title: "Twist",
    body: "Snap open the high-flow cap. Ditch the bottle openers, the sticky counters, and the heavy glass.",
  },
  {
    src: "/s5-step3.png",
    alt: "Sipping an ANANDA pouch on the dancefloor",
    step: "[Step 03]",
    title: "Sip",
    body: "Sip it straight from the pouch on the dancefloor, or pour it over crushed ice under the sun. Be entirely right here, right now.",
  },
];

// The three stacked positions a card can occupy, ordered front → back.
// `z` controls paint order; faded slots sit behind the opaque front card.
// `fromRotation` is only the entrance flourish — cards rest upright (0°).
const SLOTS = [
  { left: 271.64, top: 1539.42, opacity: 1, z: 3, fromRotation: -5 }, // front
  { left: 500.94, top: 1673.63, opacity: 0.2, z: 2, fromRotation: 10 }, // middle
  { left: 738.19, top: 1778.84, opacity: 0.2, z: 1, fromRotation: -14 }, // back
];

const N = STEPS.length; // === SLOTS.length === 3
const HOLD = 3; // seconds a card rests in front before the next shuffle
const DUR = 0.9; // shuffle duration

// Each shuffle advances `tick`; the front card (slot 0) drops to the back.
// card i occupies slot ((i - tick) mod N): first→third, second→first, …
const slotOf = (cardIdx: number, tick: number) => ((cardIdx - tick) % N + N) % N;

export default function RitualCards() {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const layer = layerRef.current;
    const cards = cardRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (!layer || cards.length < N) return;

    // Figma px → device px. The layer spans the 1440-unit canvas, so one
    // design unit (`--u`) equals layerWidth / 1440. Recomputed on resize.
    const uPx = () => layer.offsetWidth / 1440;

    const placeXY = (el: HTMLDivElement, slotIdx: number, animate: boolean) => {
      const s = SLOTS[slotIdx];
      const px = uPx();
      const vars = { x: s.left * px, y: s.top * px, opacity: s.opacity };
      if (animate) gsap.to(el, { ...vars, duration: DUR, ease: "power2.inOut" });
      else gsap.set(el, vars);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let tick = 0;
    let dc: gsap.core.Tween | null = null;

    // Re-pin cards to their current slots after a viewport resize.
    const onResize = () => cards.forEach((el, i) => placeXY(el, slotOf(i, tick), false));
    const ro = new ResizeObserver(onResize);

    function shuffle() {
      tick = (tick + 1) % N;
      cards.forEach((el, i) => placeXY(el, slotOf(i, tick), true));
      // Swap paint order at the midpoint so the incoming card has cleared the
      // others before it rises — avoids a faded card flickering over the front.
      gsap.delayedCall(DUR / 2, () => {
        cards.forEach((el, i) => gsap.set(el, { zIndex: SLOTS[slotOf(i, tick)].z }));
      });
      dc = gsap.delayedCall(DUR + HOLD, shuffle);
    }

    if (reduce) {
      // No entrance, no loop: drop the stack straight into place.
      cards.forEach((el, i) => {
        gsap.set(el, { rotation: 0, scale: 1, zIndex: SLOTS[i].z });
        placeXY(el, i, false);
      });
      ro.observe(layer);
      return () => ro.disconnect();
    }

    // Seed each card at its slot, hidden, ready for the entrance.
    cards.forEach((el, i) => {
      placeXY(el, i, false);
      gsap.set(el, { opacity: 0, zIndex: SLOTS[i].z });
    });

    const st = ScrollTrigger.create({
      trigger: layer,
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

    ro.observe(layer);

    return () => {
      st.kill();
      dc?.kill();
      ro.disconnect();
      gsap.killTweensOf(cards);
    };
  }, []);

  return (
    <div ref={layerRef} className="absolute inset-0" style={{ pointerEvents: "none" }}>
      {STEPS.map((s, i) => (
        <div
          key={s.src}
          ref={el => { cardRefs.current[i] = el; }}
          className="absolute"
          style={{ left: 0, top: 0, width: u(CARD.w), height: u(CARD.h), opacity: 0 }}
        >
          {/* Card silhouette (border travels with the photo) */}
          <div style={{ position: "absolute", inset: 0, transform: "rotate(180deg)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/s5-card2.svg" alt="" className="block size-full" />
          </div>

          {/* Photo window */}
          <div
            className="absolute overflow-hidden"
            style={{ left: u(REL.photo.left), top: u(REL.photo.top), width: u(REL.photo.w), height: u(REL.photo.h) }}
          >
            <Image src={s.src} alt={s.alt} fill sizes="40vw" className="object-cover" />
          </div>

          {/* Step label */}
          <div className="absolute" style={{ left: u(REL.label.left), top: u(REL.label.top), padding: `${u(REL.label.pad[0])} ${u(REL.label.pad[1])}` }}>
            <p
              className="whitespace-nowrap uppercase"
              style={{ fontFamily: "var(--font-mono-label)", fontSize: u(REL.label.font), lineHeight: 0.87, letterSpacing: u(REL.label.ls), color: CREAM }}
            >
              {s.step}
            </p>
          </div>

          {/* Title */}
          <p
            className="absolute font-bold uppercase"
            style={{ left: u(REL.title.left), top: u(REL.title.top), width: u(REL.title.w), fontFamily: "var(--font-display)", fontSize: u(REL.title.font), lineHeight: 0.8, letterSpacing: u(REL.title.ls), color: CREAM }}
          >
            {s.title}
          </p>

          {/* Body */}
          <div className="absolute" style={{ left: u(REL.body.left), top: u(REL.body.top), width: u(REL.body.w) }}>
            <p
              className="text-right"
              style={{ padding: `${u(REL.body.pad[0])} ${u(REL.body.pad[1])}`, fontFamily: "var(--font-body)", fontSize: u(REL.body.font), lineHeight: 1.6, letterSpacing: u(REL.body.ls), color: CREAM }}
            >
              {s.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
