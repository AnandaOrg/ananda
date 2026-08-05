"use client";

import { useTranslations } from "next-intl";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Hero scroll cue — mouse-outline icon whose two halves erase/redraw
 * around a drifting trackball dot, plus a nudging label, bottom-center of
 * the splash section. Click/Enter scrolls one viewport down (the splash is
 * exactly `h-screen`, so `window.innerHeight` always lands on the next
 * section, whichever of its desktop/mobile twins is visible). The motion
 * is pure CSS (`.scroll-cue-*` in globals.css, killed under
 * prefers-reduced-motion) — only the click handler needs JS. 1:1 port of
 * hexagoncircle's "CSS Site Scroll Micro Animation"
 * (https://codepen.io/hexagoncircle/pen/aZWOdE) — same paths, timing and
 * easing, recolored to this site's cream (#fff0e5).
 */
export default function ScrollCue() {
  const t = useTranslations("splash");

  const handleClick = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("scrollDown")}
      className="absolute bottom-8 left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 md:bottom-10"
    >
      <div aria-hidden="true" className="scroll-cue-icon relative h-20 w-12">
        {/* Ghost outline — the full pill, always faintly visible underneath
            the two halves that erase/redraw on top of it. */}
        <svg viewBox="0 0 54.9 91" fill="none" className="absolute inset-0 h-full w-full">
          <path
            d="M27.4,3.6L27.4,3.6C14.2,3.6,3.5,14.3,3.5,27.5v36c0,13.2,10.7,23.9,23.9,23.9h0c13.2,0,23.9-10.7,23.9-23.9v-36C51.4,14.3,40.7,3.6,27.4,3.6z"
            stroke="#fff0e5"
            strokeWidth={3}
            strokeOpacity={0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit={10}
          />
        </svg>
        {/* Left half — erases from the bottom, redraws solid. */}
        <svg viewBox="0 0 27.4 91" fill="none" className="absolute left-0 top-0 h-full w-1/2">
          <path
            className="scroll-cue-draw-left"
            d="M27.4,87.5L27.4,87.5c-13.2,0-23.9-10.7-23.9-23.9v-36c0-13.2,10.7-23.9,23.9-23.9h0"
            stroke="#fff0e5"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit={10}
          />
        </svg>
        {/* Right half — mirrored, erases from the top. */}
        <svg viewBox="0 0 27.4 91" fill="none" className="absolute right-0 top-0 h-full w-1/2">
          <path
            className="scroll-cue-draw-right"
            d="M0,3.6L0,3.6c13.2,0,23.9,10.7,23.9,23.9v36c0,13.2-10.7,23.9-23.9,23.9h0"
            stroke="#fff0e5"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit={10}
          />
        </svg>
        {/* Trackball dot. */}
        <span className="scroll-cue-dot absolute inset-0 m-auto h-[7px] w-[7px] rounded-full bg-[#fff0e5]" />
      </div>
      <span
        className="scroll-cue-label whitespace-nowrap uppercase text-[#fff0e5]"
        style={{ fontFamily: "var(--font-mono-label)", fontSize: 14, lineHeight: 0.87, letterSpacing: "0.98px" }}
      >
        {t("scrollDown")}
      </span>
    </button>
  );
}
