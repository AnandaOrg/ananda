"use client";

import { useEffect, useRef, useState } from "react";
import ScrollVideoCanvas from "../ScrollVideoCanvas";
import VerticalSlider from "../VerticalSlider";
import KyotoLiftoff from "../KyotoLiftoff";

/**
 * Mobile section 3 — "What we're about" collage. Per the full-desktop-port
 * decision this reproduces the desktop `AboutCollage` composition element-for-
 * element — pineapple scroll-scrub, strawberries scroll-scrub, the 3-D
 * `KyotoLiftoff` pouch, the auto-sliding gallery, the wave and the copy slide-in
 * — on the SAME `--u = 100cqw/1440` canvas, so every animation is identical to
 * desktop and the whole thing simply scales to the 390px phone width. Only the
 * copy type is bumped to a legible mobile size. Mobile only (md:hidden).
 */

const u = (n: number) => `calc(var(--u) * ${n})`;

function maskStyle(src: string, [mw, mh]: [number, number], [mx, my]: [number, number]) {
  const image = `url(${src})`;
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: `${u(mw)} ${u(mh)}`,
    WebkitMaskSize: `${u(mw)} ${u(mh)}`,
    maskPosition: `${u(mx)} ${u(my)}`,
    WebkitMaskPosition: `${u(mx)} ${u(my)}`,
  } as const;
}

/** Copy block — same 0.9s cubic-bezier slide-in as desktop AboutCollage, text bumped for mobile legibility. */
function MobileCopy() {
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
      if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
        triggered = true;
        setVisible(true);
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div
      ref={ref}
      className="absolute flex flex-col text-[#eb4638]"
      style={{
        left: u(60),
        top: u(92.16),
        width: u(560),
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0px)" : `translateX(${u(-220)})`,
        transition: "opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div style={{ padding: `${u(10)} ${u(14)}` }}>
        <p
          className="whitespace-nowrap uppercase"
          style={{ fontFamily: "var(--font-mono-label)", fontSize: u(34), lineHeight: 0.87, letterSpacing: u(2.4) }}
        >
          What we&apos;re about
        </p>
      </div>
      <div style={{ padding: `${u(10)} ${u(14)}` }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: u(52), lineHeight: 1.4, letterSpacing: u(0.5) }}>
          <p className="mb-0">Premium, bar-strength cocktails mixed for the makers, the movers, and the midnight sun.</p>
          <p>No glass, no pretense. Just pure, uninhibited joy - ready whenever and wherever you are.</p>
        </div>
      </div>
    </div>
  );
}

export default function MobileCollage() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#fff0e5] text-[#eb4638] md:hidden"
      style={{ containerType: "inline-size" }}
    >
      <div
        className="relative mx-auto"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), height: u(3000) }}
      >
        {/* Pineapple — GSAP scroll-scrubbed */}
        <ScrollVideoCanvas
          frameBase="/frames/ananas/"
          frameCount={120}
          alt="Pineapple slices against a blue sky"
          style={{
            position: "absolute",
            left: u(930.8),
            top: u(1008.67),
            width: u(396.208),
            height: u(792.416),
            ...maskStyle("/m-pineapple.svg", [379.875, 759.75], [5.779, 14.263]),
          }}
        />

        {/* Pouch scene — looping pour video; the 3-D pouch lifts off it and
            rotates upright as you scroll past (see KyotoLiftoff). */}
        <KyotoLiftoff />

        {/* Red wave */}
        <div
          className="absolute"
          style={{ left: u(-9.75), top: u(2687.06), width: u(1464.584), height: u(323.123) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/c-wave.svg" alt="" className="block size-full" />
        </div>

        {/* Strawberries — scroll-scrubbed video */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: u(-21.5), top: u(1072.53), width: u(750.69), height: u(604.722) }}
        >
          <div style={{ transform: "rotate(-90deg)" }}>
            <ScrollVideoCanvas
              frameBase="/frames/kyoto-strawberries/"
              frameCount={120}
              alt="An ANANDA pouch nestled in fresh strawberries"
              style={{
                width: u(604.722),
                height: u(750.69),
                ...maskStyle("/m-14.svg", [746.535, 592.314], [0.979, 5.315]),
              }}
            />
          </div>
        </div>

        {/* Vertical slide gallery — top left */}
        <VerticalSlider
          images={[
            { src: "/hero_3/1.png", alt: "ANANDA moment" },
            { src: "/hero_3/2.png", alt: "ANANDA moment" },
            { src: "/hero_3/3.png", alt: "ANANDA moment" },
            { src: "/hero_3/4.png", alt: "ANANDA moment" },
            { src: "/hero_3/5.png", alt: "ANANDA moment" },
          ]}
          interval={3200}
          duration={0.9}
          frame
          style={{ position: "absolute", left: 0, top: u(-108.123), width: "50%", height: "25%" }}
        />

        {/* Copy block — top right, slides in on scroll */}
        <MobileCopy />
      </div>
    </section>
  );
}
