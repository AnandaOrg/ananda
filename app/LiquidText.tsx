"use client";

import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * A headline that splashes into place like liquid — the reveal the c-wave
 * pour leads into. Each word rises out of the flood with an elastic, wobbly
 * settle while a lighter GHOST copy trails a beat behind and then evaporates.
 * One-shot when it scrolls in; fully static (no motion, no ghost) under
 * `prefers-reduced-motion`.
 *
 * Positioning + typography are passed through verbatim to the wrapping <p>,
 * so callers style it exactly like the plain paragraph it replaces (the
 * ghost anchors to the <p>, which is made position-relative by the caller's
 * `relative`/`absolute` class).
 */
export default function LiquidText({
  text,
  className,
  style,
}: {
  text: string;
  /** Classes for the wrapping <p> — must include `relative` or `absolute`. */
  className?: string;
  style?: React.CSSProperties;
}) {
  const rootRef = useRef<HTMLParagraphElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (ghostRef.current) ghostRef.current.style.display = "none";
      return;
    }
    const ctx = gsap.context(() => {
      const scrollTrigger = { trigger: root, start: "top 85%", once: true } as const;
      const words = root.querySelectorAll<HTMLElement>('[data-liquid-word="main"]');
      const ghostWords = root.querySelectorAll<HTMLElement>('[data-liquid-word="ghost"]');
      const splash = {
        yPercent: 110,
        scaleY: 1.6,
        skewX: -10,
        opacity: 0,
        transformOrigin: "50% 100%",
        duration: 1.35,
        ease: "elastic.out(1, 0.55)",
        stagger: 0.07,
      } as const;
      gsap.from(words, { ...splash, scrollTrigger });
      // Ghost copy: same splash a beat behind, then the whole layer evaporates
      // once the main words have settled.
      gsap.from(ghostWords, { ...splash, delay: 0.12, scrollTrigger });
      if (ghostRef.current) {
        gsap.to(ghostRef.current, {
          opacity: 0,
          duration: 0.9,
          delay: 1.7,
          ease: "power2.out",
          scrollTrigger,
        });
      }
    }, root);
    return () => ctx.revert();
  }, []);

  const words = text.split(" ");
  const renderWords = (layer: "main" | "ghost") =>
    words.map((w, i) => (
      <Fragment key={`${layer}-${i}`}>
        <span data-liquid-word={layer} className="inline-block">
          {w}
        </span>
        {i < words.length - 1 ? " " : null}
      </Fragment>
    ));

  return (
    <p ref={rootRef} className={className} style={style}>
      <span
        ref={ghostRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block"
        style={{ opacity: 0.35, transform: "translate(0.05em, 0.06em)" }}
      >
        {renderWords("ghost")}
      </span>
      <span className="relative block">{renderWords("main")}</span>
    </p>
  );
}
