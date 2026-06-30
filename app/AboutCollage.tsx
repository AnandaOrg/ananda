"use client";

import { useRef } from "react";
import AboutCopyBlock from "./AboutCopyBlock";
import VerticalSlider from "./VerticalSlider";
import { usePinnedReveal } from "./usePinnedReveal";
import { ABOUT_CARD } from "./configs";

const u = (n: number) => `calc(var(--u) * ${n})`;

// Photo #1 is the pour image — DitchTheGlass's diamond grows and travels into
// this exact slot showing the same image, so the hand-off is seamless. Scrolling
// then steps on through the hero_3 gallery photos.
const PHOTOS = [
  { src: "/hero_3/1.png", alt: "ANANDA moment" },
  { src: "/hero_3/2.png", alt: "ANANDA moment" },
  { src: "/hero_3/3.png", alt: "ANANDA moment" },
  { src: "/hero_3/4.png", alt: "ANANDA moment" },
  { src: "/hero_3/5.png", alt: "ANANDA moment" },
];

/**
 * Section 3 — "What we're about". Pins to the viewport; scrolling steps the
 * framed photo gallery (left) through its 5 images one at a time via the slide
 * reveal, while the copy (right) holds. After the last image the pin releases
 * into the Pathways section. Scroll-driven only — no autoplay. (desktop; md+)
 */
export default function AboutCollage() {
  const sectionRef = useRef<HTMLElement>(null);
  const index = usePinnedReveal(sectionRef, PHOTOS.length);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[#fff0e5] text-[#eb4638]"
      style={{
        height: "100svh",
        containerType: "inline-size",
        ["--u" as string]: "calc(100cqw / 1440)",
      }}
    >
      {/* Framed photo gallery — left, scroll-stepped */}
      <VerticalSlider
        images={PHOTOS}
        index={index}
        frame
        style={{ position: "absolute", ...ABOUT_CARD }}
      />

      {/* Copy — upper right */}
      <AboutCopyBlock style={{ position: "absolute", left: u(965), top: u(92.16), width: u(401) }} />
    </section>
  );
}
