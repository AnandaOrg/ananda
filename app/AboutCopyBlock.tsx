"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

const u = (n: number) => `calc(var(--u) * ${n})`;

/**
 * "What we're about" eyebrow + copy. Layout-neutral: the parent column places it;
 * this component only owns the type tokens and the one-shot slide-in reveal that
 * fires as the section enters the viewport.
 */
export default function AboutCopyBlock({
  className,
  style,
  revealed = false,
}: {
  className?: string;
  style?: React.CSSProperties;
  /**
   * Skip the scroll-triggered reveal and render fully visible immediately. Used
   * when an upstream section (DitchTheGlass) already faded this copy in during
   * its travel, so the hand-off is seamless and the text doesn't re-animate.
   */
  revealed?: boolean;
}) {
  const t = useTranslations("about");
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(revealed);

  useEffect(() => {
    if (revealed) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let triggered = false;

    const check = () => {
      raf = 0;
      if (triggered) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        triggered = true;
        setVisible(true);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [revealed]);

  return (
    <div
      ref={ref}
      className={`flex flex-col${className ? ` ${className}` : ""}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0px)" : "translateX(-80px)",
        transition: "opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
        ...style,
      }}
    >
      <div style={{ padding: `${u(10)} ${u(14)}` }}>
        <p
          className="whitespace-nowrap uppercase"
          style={{
            fontFamily: "var(--font-mono-label)",
            fontSize: u(10),
            lineHeight: 0.87,
            letterSpacing: u(0.7),
            color: "var(--terracotta)",
          }}
        >
          {t("eyebrow")}
        </p>
      </div>

      <div style={{ padding: `${u(10)} ${u(14)}` }}>
        {/* BG runs the copy-brief sizing (16 → 20u); EN keeps the original. */}
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            fontSize: locale === "bg" ? u(20) : u(16),
            lineHeight: 1.3,
            letterSpacing: locale === "bg" ? u(0.2) : u(0.16),
            color: "var(--terracotta)",
          }}
        >
          <p className="mb-0">{t("p1")}</p>
          <p className={t.has("p3") ? "mb-0" : undefined}>{t("p2")}</p>
          {t.has("p3") && <p>{t("p3")}</p>}
        </div>
      </div>
    </div>
  );
}
