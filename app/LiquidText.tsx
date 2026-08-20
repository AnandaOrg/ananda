"use client";

import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LiquidText({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const rootRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const words = root.querySelectorAll<HTMLElement>("[data-liquid-word]");
      gsap.from(words, {
        yPercent: 110,
        scaleY: 1.6,
        skewX: -10,
        opacity: 0,
        transformOrigin: "50% 100%",
        duration: 1.35,
        ease: "elastic.out(1, 0.55)",
        stagger: 0.07,
        scrollTrigger: { trigger: root, start: "top 85%", once: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const words = text.split(" ");
  return (
    <p ref={rootRef} className={className} style={style}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span data-liquid-word className="inline-block">
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </p>
  );
}
