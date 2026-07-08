"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const u = (n: number) => `calc(var(--u) * ${n})`;
const CREAM = "#fff0e5";

// Card outer dimensions (Figma) and the fixed internal layout of every card.
// The three card frames never move — only the step contents cycle through
// them — so these offsets are identical for all cards.
const CARD = { w: 480, h: 720 };
// Positions/fonts are in the same canvas-u space as CARD, re-fitted to the
// 480×720 frame (scaled from the original 620.422×863.666 design).
const REL = {
  photo: { left: 72.96, top: 143.63, w: 320, h: 420 },
  label: { left: 342.64, top: 68.78, font: 10.83, pad: [7.74, 10.83], ls: 0.76 },
  title: { left: 54.31, top: 49.9, w: 331.65, font: 74.27, ls: -5.94 },
  // left matches photo.left so the body copy lines up with the photo above
  // it; w spans the rest of the card's width (CARD.w - left) instead of a
  // fixed figma width, so it uses the full available row. top sits exactly
  // 28 below the photo's bottom edge (photo.top + photo.h + 28).
  body: { left: 72.96, top: 591.63, w: 300, font: 12.38, pad: [7.74, 10.83], ls: 0.12 },
};

const STEPS = [
  {
    src: "/s5-step1.png",
    alt: "ANANDA pouches chilling in a cooler of ice",
    step: "[Step 01]",
    title: "Chill",
    body: "Submerge the pouch in ice or drop it in the freezer.",
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

// The three fixed frame positions, ordered front → left → right: a horizontal
// hand-of-cards fan, centered on the 1440 canvas. The side frames sit behind
// the front frame at 0.76 scale, tilted ∓8°; all fully opaque. Frames stay
// put — `x`/`y` are CSS left/top on the canvas (same card size for every
// frame, so equal `y` keeps the three centers on one line).
//
// Every frame always renders its full label/title/body (no side-frame hiding
// or clipping) — the front card's straight edge is what conceals the side
// frames' text. At this GAP (moved 20% closer than the original ±390) the
// front card's edge lands INSIDE the left frame's body box and the right
// frame's title box instead of past their far edge, so a sliver of that text
// is visibly exposed beside the front card. Accepted tradeoff for the
// tighter fan; see git history for the wider, fully-concealing spacing.
const SLOTS = [
  { x: 480, y: 1661, rotation: 0, scale: 1, z: 3 }, // front / center
  { x: 178, y: 1661, rotation: -20, scale: 0.76, z: 2 }, // left
  { x: 802, y: 1661, rotation: 20, scale: 0.76, z: 1 }, // right
];

const N = STEPS.length; // === SLOTS.length === 3
const HOLD = 3; // seconds the contents rest before the next cycle
const PHOTO_DUR = 0.7; // photo slide duration
const TEXT_DUR = 0.6; // text left-to-right reveal duration
const TEXT_DELAY = 0.15; // reveal starts just after the photo begins moving

// Per-frame photo slide axis, keyed by SLOTS index (front, left, right):
// the center card keeps the original top → bottom slide, while the side
// cards reveal toward the center — right → left on the left card, left →
// right on the right card. `enter` is also where the outgoing photo is
// parked after it exits, so it re-enters from the same side next cycle.
const REVEAL = [
  { prop: "yPercent", enter: -100, exit: 100 }, // front / center: top → bottom
  { prop: "xPercent", enter: 100, exit: -100 }, // left: right → left
  { prop: "xPercent", enter: -100, exit: 100 }, // right: left → right
] as const;

const CLIP_HIDDEN = "inset(0% 100% 0% 0%)"; // fully clipped from the right
const CLIP_SHOWN = "inset(0% 0% 0% 0%)";

// Frame f displays step ((f + tick) mod N) — every cycle the step contents
// advance one frame while the frames themselves stay put.
const stepOf = (frame: number, tick: number) => (frame + tick) % N;

export default function RitualCards() {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const layer = layerRef.current;
    const frames = cardRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (!layer || frames.length < N) return;

    const photosOf = (el: HTMLDivElement) => Array.from(el.querySelectorAll<HTMLElement>("[data-photo]"));
    const textsOf = (el: HTMLDivElement, k: number) =>
      Array.from(el.querySelectorAll<HTMLElement>(`[data-text-step="${k}"]`));

    // Seed content: frame f starts on step f; the other layers wait hidden
    // (photos parked at their frame's entry side, texts fully clipped).
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
        // Conveyor slide: the incoming photo enters from this frame's entry
        // side while the outgoing one exits the opposite side at the same speed.
        const { prop, enter, exit } = REVEAL[f];
        gsap.fromTo(photos[newK], { [prop]: enter }, { [prop]: 0, duration: PHOTO_DUR, ease: "power2.inOut" });
        gsap.to(photos[oldK], {
          [prop]: exit,
          duration: PHOTO_DUR,
          ease: "power2.inOut",
          onComplete: () => gsap.set(photos[oldK], { [prop]: enter }),
        });
        // Texts: the old step vanishes, the new one wipes in left → right.
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
      // No entrance, no cycle: drop the fan straight into place.
      frames.forEach((el, i) => gsap.set(el, { rotation: SLOTS[i].rotation, scale: SLOTS[i].scale, opacity: 1 }));
      return () => gsap.killTweensOf(frames);
    }

    // Seed the fan pose, hidden, ready for the entrance.
    frames.forEach((el, i) => gsap.set(el, { rotation: SLOTS[i].rotation, scale: SLOTS[i].scale, opacity: 0 }));

    const st = ScrollTrigger.create({
      trigger: layer,
      start: "top 85%",
      once: true,
      onEnter() {
        // Fan out: each frame starts gathered at the front slot, then spreads
        // to its own slot with the stagger.
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
          {/* Card silhouette (border stays put; only the contents cycle) */}
          <div style={{ position: "absolute", inset: 0, transform: "rotate(180deg)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/s5-card2.svg" alt="" className="block size-full" />
          </div>

          {/* Photo window — all step photos stacked; the active one slides in on
              each cycle along this frame's REVEAL axis (top-to-bottom on the
              center card, side-in-toward-center on the left/right cards) */}
          <div
            className="absolute overflow-hidden"
            style={{ left: u(REL.photo.left), top: u(REL.photo.top), width: u(REL.photo.w), height: u(REL.photo.h) }}
          >
            {/* No inline transform on the layers — the GSAP seed owns the
                REVEAL axis (x/yPercent) before the frame becomes visible (an
                inline transform would
                compound with it and strand the photo off-window). */}
            {STEPS.map((s) => (
              <div key={s.src} data-photo className="absolute inset-0">
                <Image src={s.src} alt={s.alt} fill sizes="40vw" className="object-cover" />
              </div>
            ))}
          </div>

          {/* Label, title, body — layered per step, revealed left → right.
              Every frame renders all three (the mild 9° tilt keeps the
              rotated corners from lifting past the front card's straight
              top/bottom edge, so the overlap covers side-frame text cleanly
              instead of leaking a mid-word fragment). */}
          <div
            className="absolute grid"
            style={{ left: u(REL.label.left), top: u(REL.label.top), padding: `${u(REL.label.pad[0])} ${u(REL.label.pad[1])}`, justifyItems: "end" }}
          >
            {STEPS.map((s, k) => (
              <p
                key={s.step}
                data-text-step={k}
                className="whitespace-nowrap uppercase"
                style={{ gridArea: "1 / 1", fontFamily: "var(--font-mono-label)", fontSize: u(REL.label.font), lineHeight: 0.87, letterSpacing: u(REL.label.ls), color: CREAM, clipPath: k === f ? CLIP_SHOWN : CLIP_HIDDEN }}
              >
                {s.step}
              </p>
            ))}
          </div>

          <div className="absolute grid" style={{ left: u(REL.title.left), top: u(REL.title.top), width: u(REL.title.w) }}>
            {STEPS.map((s, k) => (
              <p
                key={s.title}
                data-text-step={k}
                className="font-bold uppercase"
                style={{ gridArea: "1 / 1", fontFamily: "var(--font-display)", fontSize: u(REL.title.font), lineHeight: 1, letterSpacing: u(REL.title.ls), color: CREAM, clipPath: k === f ? CLIP_SHOWN : CLIP_HIDDEN }}
              >
                {s.title}
              </p>
            ))}
          </div>

          <div className="absolute grid" style={{ left: u(REL.body.left), top: u(REL.body.top), width: u(REL.body.w) }}>
            {STEPS.map((s, k) => (
              <p
                key={s.src}
                data-text-step={k}
                className="text-left"
                style={{ gridArea: "1 / 1", padding: `${u(REL.body.pad[0])} ${u(REL.body.pad[1])}`, fontFamily: "var(--font-body)", fontSize: u(REL.body.font), lineHeight: 1.6, letterSpacing: u(REL.body.ls), color: CREAM, clipPath: k === f ? CLIP_SHOWN : CLIP_HIDDEN }}
              >
                {s.body}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
