"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { mu, MU_VAR } from "./scale";

/**
 * Mobile section — "The RITUAL". The single card auto-cycles through the three
 * steps (Chill → Twist → Sip) every few seconds, the photo sliding up on each
 * change — the mobile counterpart to the desktop 3-card cycle (RitualCards).
 * Respects prefers-reduced-motion: when set it stays on the static Chill card.
 */

const STEPS = [
  { src: "/s5-step1.png", alt: "ANANDA pouches chilling in a cooler of ice", step: "[Step 01]", title: "Chill", body: "Submerge the pouch in ice or drop it in the freezer." },
  { src: "/s5-step2.png", alt: "Snapping open the high-flow cap", step: "[Step 02]", title: "Twist", body: "Snap open the high-flow cap. No openers, no glass." },
  { src: "/s5-step3.png", alt: "Sipping an ANANDA pouch on the dancefloor", step: "[Step 03]", title: "Sip", body: "Sip it straight from the pouch, or pour it over crushed ice." },
];

const HOLD = 3;

export default function MobileRitual() {
  const [cur, setCur] = useState(0);
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const photos = photoRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (photos.length < STEPS.length) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    photos.forEach((p, i) => gsap.set(p, i === 0 ? { yPercent: 0, zIndex: 1 } : { yPercent: 100, zIndex: 0 }));

    let idx = 0;
    let dc: gsap.core.Tween | null = null;

    const schedule = () => { dc = gsap.delayedCall(HOLD, advance); };
    function advance() {
      const to = (idx + 1) % STEPS.length;
      setCur(to);
      gsap.set(photos[to], { yPercent: 100, zIndex: 2 });
      gsap.to(photos[to], {
        yPercent: 0,
        duration: 0.9,
        ease: "power2.inOut",
        onComplete() {
          photos.forEach((p, i) => gsap.set(p, { zIndex: i === to ? 1 : 0 }));
          idx = to;
          schedule();
        },
      });
    }
    schedule();

    return () => {
      dc?.kill();
      gsap.killTweensOf(photos);
    };
  }, []);

  const s = STEPS[cur];
  return (
    <section className="flex w-full justify-center bg-[#fff0e5] md:hidden">
      <div className="w-full max-w-[430px]" style={{ containerType: "inline-size" }}>
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

          {/* Step card — cycles Chill → Twist → Sip */}
          <div className="relative" style={{ width: mu(342.303), height: mu(491.887) }}>
            <div className="absolute inset-0" style={{ transform: "rotate(180deg)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/s5-card2.svg" alt="" className="block size-full" />
            </div>
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
                {STEPS.map((stp, i) => (
                  <div
                    key={stp.src}
                    ref={(el) => { photoRefs.current[i] = el; }}
                    className="absolute inset-0"
                    style={{ transform: i === 0 ? "translateY(0%)" : "translateY(100%)" }}
                  >
                    <Image src={stp.src} alt={stp.alt} fill sizes="60vw" className="object-cover" />
                  </div>
                ))}
              </div>
              <p
                style={{ fontFamily: "var(--font-body)", fontSize: mu(12), lineHeight: 1.6, letterSpacing: mu(0.12), color: "#fff0e5", width: mu(215.05) }}
              >
                {s.body}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
