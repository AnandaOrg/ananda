"use client";

import { useEffect, useRef, useState } from "react";

const u = (n: number) => `calc(var(--u) * ${n})`;

export default function AboutCopyBlock() {
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
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        triggered = true;
        setVisible(true);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="absolute flex flex-col"
      style={{
        left: u(965),
        top: u(92.16),
        width: u(401),
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0px)" : "translateX(-80px)",
        transition: "opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
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
          }}
        >
          What we&apos;re about
        </p>
      </div>

      <div style={{ padding: `${u(10)} ${u(14)}` }}>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: u(16),
            lineHeight: 1.6,
            letterSpacing: u(0.16),
          }}
        >
          <p className="mb-0">
            Premium, bar-strength cocktails mixed for the makers, the movers, and the
            midnight sun.
          </p>
          <p>
            No glass, no pretense. Just pure, uninhibited joy - ready whenever and
            wherever you are.
          </p>
        </div>
      </div>
    </div>
  );
}
