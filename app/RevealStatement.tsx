"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-linked letter-by-letter opacity "fill" for the ANANDA statement.
 * Opacity is scrubbed by scroll position: as the block rises into view each
 * character fills left-to-right; scrolling back up lowers it again. The fill is
 * driven directly on the DOM (rAF-throttled) so there's no per-frame re-render.
 * Words are kept un-breakable so wrapping stays normal.
 */

export type Run = { text: string; underline?: boolean };
const R = (text: string, underline = false): Run => ({ text, underline });

/** Desktop: three hard-broken lines (Ritual). */
export const STATEMENT_PARAS: Run[][] = [
  [R("ANANDA IS THE SUPREME JOY OF THE PRESENT "), R("MOMENT.", true)],
  [R("IT’S THE FEELING OF THE BASS HITTING YOUR CHEST,")],
  [
    R("THE SUN WASHING "),
    R("OVER THE", true),
    R(" POOL, AND THE SENSE THAT THERE IS NOWHERE ELSE ON EARTH YOU’D RATHER BE. WE BOTTLED THAT EXACT FEELING. "),
    R("THEN WE", true),
    R(" DITCHED THE BOTTLE. THIS IS HIGH-FIDELITY MIXOLOGY PACKED FOR "),
    R("ABSOLUTE", true),
    R(" FREEDOM."),
  ],
];

/** Mobile: one flowing paragraph (the lines joined with spaces). */
export const STATEMENT_FLAT: Run[][] = [
  STATEMENT_PARAS.reduce<Run[]>((acc, p, i) => (i === 0 ? [...p] : [...acc, R(" "), ...p]), []),
];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function RevealStatement({
  paras,
  smallFontSize,
  base = 0.18,
  className,
  style,
}: {
  paras: Run[][];
  smallFontSize: string;
  base?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const letters = Array.from(el.querySelectorAll<HTMLElement>(".rs-letter"));
    const n = letters.length;
    if (!n) return;
    // Overlap window: how many letters are mid-transition at once.
    const w = Math.max(6, Math.round(n * 0.18));

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // p: 0 when the block's top sits low in the viewport, 1 once it reaches the upper third.
      const startTop = vh * 0.9;
      const endTop = vh * 0.3;
      const p = clamp((startTop - rect.top) / (startTop - endTop), 0, 1);
      const front = p * (n + w); // sweeping fill front, in letter units
      for (let i = 0; i < n; i++) {
        const lp = clamp((front - i) / w, 0, 1);
        letters[i].style.opacity = String(base + (1 - base) * lp);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [base, paras]);

  const letter = (c: string, key: string) => (
    <span key={key} className="rs-letter" style={{ opacity: base, willChange: "opacity" }}>
      {c}
    </span>
  );

  // Split a run into words (kept un-breakable) and whitespace (breakable), letter by letter.
  const renderRun = (text: string, rk: string) =>
    text.split(/(\s+)/).map((tok, ti) => {
      if (tok === "") return null;
      if (/^\s+$/.test(tok)) {
        return <span key={`${rk}-s${ti}`}>{[...tok].map((c, ci) => letter(c, `${rk}-s${ti}-${ci}`))}</span>;
      }
      return (
        <span key={`${rk}-w${ti}`} style={{ whiteSpace: "nowrap" }}>
          {[...tok].map((c, ci) => letter(c, `${rk}-w${ti}-${ci}`))}
        </span>
      );
    });

  return (
    <div ref={ref} className={className} style={style}>
      {paras.map((runs, pi) => (
        <p key={pi} className={pi < paras.length - 1 ? "mb-0" : undefined}>
          {runs.map((run, ri) => (
            <span key={ri} className={run.underline ? "underline" : undefined} style={run.underline ? { fontSize: smallFontSize } : undefined}>
              {renderRun(run.text, `${pi}-${ri}`)}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
