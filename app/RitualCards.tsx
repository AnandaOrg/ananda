"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const u = (n: number) => `calc(var(--u) * ${n})`;
const CREAM = "#fff0e5";

const REL = {
  photo: { left: 72.96,  top: 143.63 },
  label: { left: 442.87, top: 82.5   },
  title: { left: 70.2,   top: 59.85  },
  body:  { left: 153.87              },
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

// Ordered back→front so later elements paint on top
const CARDS = [
  { svg: "/s5-card2.svg", cardBox: { left: 738.19, top: 1778.84 }, bodyTop: 729.46, fromRotation: -14, targetOpacity: 0.2 },
  { svg: "/s5-card3.svg", cardBox: { left: 500.94, top: 1673.63 }, bodyTop: 729.46, fromRotation: 10,  targetOpacity: 0.2 },
  { svg: "/s5-card2.svg", cardBox: { left: 271.64, top: 1539.42 }, bodyTop: 735.46, fromRotation: -5,  targetOpacity: 1   },
];

const N_CARDS = CARDS.length;
const N_STEPS = STEPS.length;
const HOLD = 3;

// ci=0 (back) is 2 steps ahead of cur; ci=1 (middle) is 1 ahead; ci=2 (front) = cur
const stepOffset = (ci: number) => N_CARDS - 1 - ci;

export default function RitualCards() {
  const [cur, setCur] = useState(0);
  // Flat: index = cardIdx * N_STEPS + stepIdx
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs  = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (cards.length < N_CARDS) return;

    const cardPhotos = (ci: number) =>
      Array.from({ length: N_STEPS }, (_, si) => photoRefs.current[ci * N_STEPS + si])
        .filter((el): el is HTMLDivElement => el !== null);

    cards.forEach(el => gsap.set(el, { opacity: 0 }));

    let curIdx = 0;
    let dc: gsap.core.Tween | null = null;

    function startCycling() {
      for (let c = 0; c < N_CARDS; c++) {
        const photos = cardPhotos(c);
        const init = stepOffset(c) % N_STEPS;
        photos.forEach((p, si) =>
          gsap.set(p, si === init ? { y: "0%", zIndex: 1 } : { y: "100%", zIndex: 0 })
        );
      }
      schedule();
    }

    function schedule() {
      dc = gsap.delayedCall(HOLD, step);
    }

    function step() {
      for (let c = 0; c < N_CARDS; c++) {
        const photos = cardPhotos(c);
        const off    = stepOffset(c);
        const from   = (curIdx + off) % N_STEPS;
        const to     = (curIdx + 1 + off) % N_STEPS;

        gsap.set(photos[to], { y: "100%", zIndex: 2 });
        gsap.to(photos[to], {
          y: "0%",
          duration: 0.9,
          ease: "power2.inOut",
          // Only the last (front) card triggers the state update
          ...(c === N_CARDS - 1
            ? {
                onComplete() {
                  for (let k = 0; k < N_CARDS; k++) {
                    const kp  = cardPhotos(k);
                    const kOff = stepOffset(k);
                    gsap.set(kp[(curIdx + kOff) % N_STEPS],     { zIndex: 0 });
                    gsap.set(kp[(curIdx + 1 + kOff) % N_STEPS], { zIndex: 1 });
                  }
                  curIdx = (curIdx + 1) % N_STEPS;
                  setCur(curIdx);
                  schedule();
                },
              }
            : {}),
        });
      }
    }

    const st = ScrollTrigger.create({
      trigger: cards[N_CARDS - 1],
      start: "top 85%",
      once: true,
      onEnter() {
        cards.forEach((card, i) => {
          const { fromRotation, targetOpacity } = CARDS[i];
          gsap.fromTo(card,
            { rotation: fromRotation, opacity: 0, scale: 0.94 },
            {
              rotation: 0, opacity: targetOpacity, scale: 1,
              duration: 0.85, ease: "power3.out", delay: i * 0.14,
              ...(i === N_CARDS - 1 ? { onComplete: startCycling } : {}),
            }
          );
        });
      },
    });

    return () => {
      st.kill();
      dc?.kill();
      for (let c = 0; c < N_CARDS; c++) gsap.killTweensOf(cardPhotos(c));
    };
  }, []);

  return (
    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
      {CARDS.map((card, ci) => {
        const s = STEPS[(cur + stepOffset(ci)) % N_STEPS];
        return (
          <div
            key={ci}
            ref={el => { cardRefs.current[ci] = el; }}
            className="absolute"
            style={{
              left: u(card.cardBox.left),
              top: u(card.cardBox.top),
              width: u(620.422),
              height: u(863.666),
              opacity: 0,
              pointerEvents: ci === N_CARDS - 1 ? "auto" : "none",
            }}
          >
            {/* Card silhouette */}
            <div style={{ position: "absolute", inset: 0, transform: "rotate(180deg)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.svg} alt="" className="block size-full" />
            </div>

            {/* Photo window */}
            <div
              className="absolute overflow-hidden"
              style={{ left: u(REL.photo.left), top: u(REL.photo.top), width: u(464.322), height: u(576.4) }}
            >
              {STEPS.map((step, si) => (
                <div
                  key={step.src}
                  ref={el => { photoRefs.current[ci * N_STEPS + si] = el; }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <Image src={step.src} alt={step.alt} fill sizes="40vw" className="object-cover" />
                </div>
              ))}
            </div>

            {/* Step label */}
            <div className="absolute" style={{ left: u(REL.label.left), top: u(REL.label.top), padding: `${u(10)} ${u(14)}` }}>
              <p className="whitespace-nowrap uppercase"
                style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98), color: CREAM }}>
                {s.step}
              </p>
            </div>

            {/* Title */}
            <p className="absolute font-bold uppercase"
              style={{ left: u(REL.title.left), top: u(REL.title.top), width: u(428.674), fontFamily: "var(--font-display)", fontSize: u(96), lineHeight: 0.8, letterSpacing: u(-7.68), color: CREAM }}>
              {s.title}
            </p>

            {/* Body */}
            <div className="absolute" style={{ left: u(REL.body.left), top: u(card.bodyTop), width: u(401) }}>
              <p className="text-right"
                style={{ padding: `${u(10)} ${u(14)}`, fontFamily: "var(--font-body)", fontSize: u(16), lineHeight: 1.6, letterSpacing: u(0.16), color: CREAM }}>
                {s.body}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
