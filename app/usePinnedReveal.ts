"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ABOUT_REVEAL_STEP_VH } from "./configs";

gsap.registerPlugin(ScrollTrigger);

/**
 * Pins `sectionRef` to the viewport and maps scroll progress across that pin to a
 * discrete image index in `[0, count - 1]`. As the user scrolls while pinned, the
 * returned `index` advances one step at a time (and reverses on scroll-up) — the
 * caller feeds it to a controlled `VerticalSlider` so each step plays the slide
 * reveal. After the last index the pin releases into the next section.
 *
 * Honours `prefers-reduced-motion`: no pin, no scroll-hijack — `index` stays 0.
 *
 * @param sectionRef the element to pin (must size to one viewport).
 * @param count number of images / steps.
 * @returns the active step index.
 */
export function usePinnedReveal(
  sectionRef: React.RefObject<HTMLElement | null>,
  count: number,
): number {
  const [index, setIndex] = useState(0);
  // Keep the latest index out of the effect's dep array so the ScrollTrigger is
  // created once; we read/compare via a ref to avoid stale closures.
  const indexRef = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || count < 1) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stepPx = () => window.innerHeight * ABOUT_REVEAL_STEP_VH;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${stepPx() * count}`,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const next = Math.min(count - 1, Math.floor(self.progress * count));
        if (next !== indexRef.current) {
          indexRef.current = next;
          setIndex(next);
        }
      },
    });

    return () => st.kill();
  }, [sectionRef, count]);

  return index;
}
