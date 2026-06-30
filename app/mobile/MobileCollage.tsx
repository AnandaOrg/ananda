"use client";

import { useEffect, useRef, useState } from "react";
import VerticalSlider from "../VerticalSlider";
import { usePinnedReveal } from "../usePinnedReveal";
import { mu, MU_VAR } from "./scale";

/**
 * Mobile section 3 — "What we're about". Mirrors the desktop pin mechanic: the
 * section pins and scrolling steps the framed photo gallery through its 5 images
 * via the slide reveal, then releases into Pathways. Stacked layout (photo on
 * top, copy below) on the 390px mobile frame. Scroll-driven only. (md:hidden)
 */

const PHOTOS = [
  { src: "/hero_3/1.png", alt: "ANANDA moment" },
  { src: "/hero_3/2.png", alt: "ANANDA moment" },
  { src: "/hero_3/3.png", alt: "ANANDA moment" },
  { src: "/hero_3/4.png", alt: "ANANDA moment" },
  { src: "/hero_3/5.png", alt: "ANANDA moment" },
];

/** Copy block — one-shot slide-in as the section enters, sized for the mobile frame. */
function MobileCopy() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let triggered = false;
    const check = () => {
      raf = 0;
      if (triggered) return;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        triggered = true;
        setVisible(true);
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div
      ref={ref}
      className="flex flex-col text-[#eb4638]"
      style={{
        gap: mu(10),
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : `translateY(${mu(24)})`,
        transition: "opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <p
        className="uppercase"
        style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(13), lineHeight: 0.87, letterSpacing: mu(1) }}
      >
        What we&apos;re about
      </p>
      <div style={{ fontFamily: "var(--font-body)", fontSize: mu(20), lineHeight: 1.45, letterSpacing: mu(0.2) }}>
        <p className="mb-0">Premium, bar-strength cocktails mixed for the makers, the movers, and the midnight sun.</p>
        <p>No glass, no pretense. Just pure, uninhibited joy - ready whenever and wherever you are.</p>
      </div>
    </div>
  );
}

export default function MobileCollage() {
  const sectionRef = useRef<HTMLElement>(null);
  const index = usePinnedReveal(sectionRef, PHOTOS.length);

  return (
    <section
      ref={sectionRef}
      className="relative flex w-full flex-col overflow-hidden bg-[#fff0e5] text-[#eb4638] md:hidden"
      style={{ height: "100svh", containerType: "inline-size", ...MU_VAR, padding: `${mu(28)} ${mu(20)}` }}
    >
      {/* Framed photo gallery — scroll-stepped */}
      <VerticalSlider
        images={PHOTOS}
        index={index}
        frame
        style={{ width: "100%", height: "56svh", marginBottom: mu(28) }}
      />

      {/* Copy */}
      <MobileCopy />

    </section>
  );
}
