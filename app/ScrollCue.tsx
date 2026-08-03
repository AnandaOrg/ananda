"use client";

import { useTranslations } from "next-intl";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Hero scroll cue — pulsing icon + label, bottom-center of the splash
 * section. Click/Enter scrolls one viewport down (the splash is exactly
 * `h-screen`, so `window.innerHeight` always lands on the next section,
 * whichever of its desktop/mobile twins is visible). The pulse itself is
 * pure CSS (`.scroll-cue-pulse` in globals.css, killed under
 * prefers-reduced-motion) — only the click handler needs JS.
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/c-scroll-down.svg"
        alt=""
        aria-hidden="true"
        className="scroll-cue-pulse h-9 w-auto md:h-10"
      />
      <span
        className="whitespace-nowrap uppercase text-[#fff0e5]"
        style={{ fontFamily: "var(--font-mono-label)", fontSize: 14, lineHeight: 0.87, letterSpacing: "0.98px" }}
      >
        {t("scrollDown")}
      </span>
    </button>
  );
}
