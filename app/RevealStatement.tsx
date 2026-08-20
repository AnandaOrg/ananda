"use client";

import { useEffect, useRef } from "react";
import type { Run } from "./manifesto-copy";

export type { Run };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function RevealStatement({
  paras,
  smallFontSize,
  paraSpacing,
  base = 0.18,
  className,
  style,
}: {
  paras: Run[][];
  smallFontSize: string;
  paraSpacing?: string;
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
    const w = Math.max(6, Math.round(n * 0.18));

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const startTop = vh * 0.9;
      const endTop = vh * 0.3;
      const p = clamp((startTop - rect.top) / (startTop - endTop), 0, 1);
      const front = p * (n + w);
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
        <p
          key={pi}
          className={pi < paras.length - 1 ? "mb-0" : undefined}
          style={pi > 0 && paraSpacing ? { marginTop: paraSpacing } : undefined}
        >
          {runs.map((run, ri) => (
            <span
              key={ri}
              className={run.underline ? "underline" : undefined}
              style={
                run.underline
                  ? { fontSize: smallFontSize, fontFamily: "var(--font-mono-label)", fontWeight: 500, letterSpacing: "0.07em" }
                  : undefined
              }
            >
              {renderRun(run.text, `${pi}-${ri}`)}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
