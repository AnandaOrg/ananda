"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import VerticalSlider from "../VerticalSlider";
import { mu, MU_VAR } from "./scale";

gsap.registerPlugin(ScrollTrigger);

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

// Same imagery as the collage gallery, so the reveal hands off into it.
const GALLERY = [
  { src: "/hero_3/1.png", alt: "ANANDA moment" },
  { src: "/hero_3/2.png", alt: "ANANDA moment" },
  { src: "/hero_3/3.png", alt: "ANANDA moment" },
  { src: "/hero_3/4.png", alt: "ANANDA moment" },
  { src: "/hero_3/5.png", alt: "ANANDA moment" },
];

/**
 * Mobile section 2 — "Liquid Bliss. Mixed to Move." (Figma 184:1157). Mirrors the
 * desktop `DitchTheGlass` choreography exactly — same pinned scrub range, same
 * render() math, same gallery iris hand-off — only the geometry is scaled to the
 * 390px frame via `mu()`. Mobile only.
 */
export default function MobileIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const diamondRef = useRef<HTMLSpanElement>(null);
  const imageWrapRef = useRef<HTMLSpanElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const diamond = diamondRef.current;
    const imageWrap = imageWrapRef.current;
    const gallery = galleryRef.current;
    if (!section || !diamond || !imageWrap || !gallery) return;

    const words = Array.from(section.querySelectorAll<HTMLElement>(".dtg-word"));

    const render = (prog: number) => {
      // 1) hold the small diamond until ~40% in, then rotate upright + zoom to
      // fill (×18 so the grown square still covers a 100svh viewport from the
      // smaller 42mu heading diamond).
      const dz = smooth(clamp((prog - 0.4) / 0.3, 0, 1));
      diamond.style.transform = `rotate(${45 - dz * 45}deg) scale(${1 + dz * 17})`;
      imageWrap.style.transform = `rotate(${-(45 - dz * 45)}deg) scale(1.5)`;

      // 2) the heading words fade out as the image takes over (diamond stays)
      const textFade = 1 - clamp((prog - 0.45) / 0.2, 0, 1);
      words.forEach((w) => { w.style.opacity = String(textFade); });

      // 3) gallery irises open from the centre — the reveal hand-off
      const gr = smooth(clamp((prog - 0.7) / 0.3, 0, 1));
      gallery.style.clipPath = `circle(${gr * 78}% at 50% 50%)`;
      gallery.style.opacity = gr > 0 ? "1" : "0";

      // hide the zoomed pour image once the gallery has covered it
      imageWrap.style.opacity = String(1 - clamp((prog - 0.82) / 0.12, 0, 1));
    };

    const mm = gsap.matchMedia();
    mm.add("(max-width: 767px)", () => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=140%",
        pin: true,
        scrub: true,
        onUpdate: (self) => render(self.progress),
        onRefresh: (self) => render(self.progress),
      });
      render(st.progress);
      return () => st.kill();
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[100svh] items-center justify-center overflow-hidden bg-[#fff0e5] md:hidden"
      style={{ ...MU_VAR }}
    >
      <div
        className="flex flex-col items-center text-center text-[#eb4638]"
        style={{ gap: mu(24), padding: `0 ${mu(16)}` }}
      >
        <p
          className="dtg-word whitespace-nowrap uppercase"
          style={{
            fontFamily: "var(--font-mono-label)",
            fontSize: mu(12),
            lineHeight: 0.87,
            letterSpacing: mu(0.84),
            willChange: "opacity",
          }}
        >
          [01] Ditch the glass
        </p>

        <h2
          className="font-bold uppercase"
          style={{
            fontFamily: "var(--font-display)",
            // Sized so "Mixed to ◇ Move." (the wider row) fits the 390 frame
            // on ONE line — mu(106) overflowed both edges.
            fontSize: mu(42),
            lineHeight: 0.8,
            letterSpacing: "-0.08em",
          }}
        >
          <span className="dtg-word block" style={{ willChange: "opacity" }}>Liquid Bliss.</span>
          <span className="flex items-center justify-center" style={{ gap: "0.2em" }}>
            <span className="dtg-word" style={{ willChange: "opacity" }}>Mixed to</span>

            <span
              ref={diamondRef}
              className="relative inline-block size-[1.2em] shrink-0 overflow-hidden"
              style={{ willChange: "transform", transform: "rotate(45deg) scale(1)" }}
            >
              <span
                ref={imageWrapRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  willChange: "transform",
                  transform: "rotate(-45deg) scale(1.5)",
                }}
              >
                <video
                  src="/videos/woman-drinking.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </span>
            </span>

            <span className="dtg-word" style={{ willChange: "opacity" }}>Move.</span>
          </span>
        </h2>
      </div>

      {/* Gallery reveal layer — irises open from the centre as the hand-off */}
      <div
        ref={galleryRef}
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: "circle(0% at 50% 50%)", opacity: 0, zIndex: 5, willChange: "clip-path, opacity" }}
      >
        <VerticalSlider
          images={GALLERY}
          interval={3200}
          duration={0.9}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      </div>
    </section>
  );
}
