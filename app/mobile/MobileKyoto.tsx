"use client";

import { useEffect, useRef } from "react";
import { mu, MU_VAR } from "./scale";

/**
 * Mobile twin of KyotoLiftoff (desktop) — the KYOTO pouch scene. One
 * scroll-scrubbed choreography:
 *
 * 1. At rest, `public/videos/kyoto.mp4` loops (muted) while the scene is in
 *    the viewport (play/pause via IntersectionObserver).
 * 2. As the user scrolls past the scene the video pauses on its current frame
 *    and the pouch EMERGES out of it: the frozen frame cross-fades into the
 *    soft red background while the KYOTO pouch cutout materialises over its
 *    twin in the video frame and travels to its rest spot. Only once it's out
 *    does it tip over, and the red wave (`/c-wave.svg`) splashes OUT of the
 *    spout — keyed to the cap actually facing down (past SPLASH_ROT°),
 *    surging up from the seam with the red section below, with a slight
 *    overshoot before settling. Everything is
 *    scrubbed (reverses on scroll-up), and scrolling fully back to rest
 *    resumes the video loop.
 *
 * All layers stay mounted so the cross-fade can scrub in both directions —
 * there is no phase swap / remount any more.
 *
 * All lengths are desktop values × (390 / 789.24) — the scene fills the 390px
 * mobile frame — expressed in `--mu` units. (md:hidden)
 */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smoothstep = (t: number) => t * t * (3 - 2 * t);
/** easeOutBack — rises past 1 (~+10% around t≈0.6) and settles back at 1. */
const backOut = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// ── Assets ─────────────────────────────────────────────────────────────────
const VIDEO_SRC = "/videos/kyoto.mp4";

// ── Tunables (desktop KyotoLiftoff values × 0.494 where they are lengths) ──
// Scroll window: the motion runs as the scene's centre travels FROM→TO of vh.
const FROM = 0.55; // ~scene fully shown
const TO = 0.12;
// Stage boundaries, as fractions of the scroll window.
const FADE_END = 0.3; // video → red background cross-fade completes here
const EMERGE_END = 0.35; // pouch fully "out of the video" here
const ROT_DELAY = 0.3; // rotation only starts once the pouch is mostly out
// "Come out toward the viewer" pop. The cutout materialises exactly where the
// pouch sits in the video frame (offset + scale below, in mobile design px
// relative to the rest position), then travels to its rest spot as it emerges.
const EMERGE_SCALE = 0.8; // ≈ the video pouch's size vs the cutout
const EMERGE_DX = 105; // desktop 213 × 0.494
const EMERGE_DY = 45; // desktop 91 × 0.494
const LIFT_MU = 74; // how far (mobile design px) it rises
const GROW = 0.12; // extra scale as it pops out
// Rotation (flat 2-D, deg), scrubbed over the back of the window.
const ROT_START = 0; // at rest
const ROT_END = -200; // full scroll-down
// Scene box (desktop 789.24×905.94 → full mobile frame width).
const SCENE_W = 390;
const SCENE_H = 447.7;
// Pouch image (square) + placement inside the scene box.
const POUCH_W = 444.7; // img side in mobile design px
const POUCH_X = "20%";
const POUCH_Y = "60%";
// Red-wave splash, relative to the scene box.
const WAVE_LEFT = -151.8;
const WAVE_TOP = 399.5;
const WAVE_W = 723.7;
const WAVE_H = 159.7;
// The wave SVG's trickle spike tops out at ~x 615 / 1464, y 0. The wave is
// anchored to its BOTTOM edge (which is flat and sits flush with the red
// Pathways section below) so that at any scale the splash stays connected to
// the next section and grows UP toward the spout.
const WAVE_ORIGIN = "42% 100%";
// The splash is keyed to the pouch's ROTATION, not raw scroll: it starts once
// the cap has swung past SPLASH_ROT° (cap points straight down at 180°) and
// completes at full rotation (|ROT_END|).
const SPLASH_ROT = 150;
// Cap-tracking: the wave is translated so its trickle spike (= its transform
// origin) sits under the spout's PROJECTED position while the pouch swings —
// otherwise the splash blooms where the cap will be, not where it is.
const POUCH_CX = SCENE_W * 0.2; // pouch centre x (= POUCH_X of the scene box)
const CAP_D = 169; // cap-tip distance from the pouch image centre (desktop 342 × 0.494)
const SPIKE_X = WAVE_LEFT + 0.42 * WAVE_W; // trickle spike x at rest

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function MobileKyoto() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pouchRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const engagedRef = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (prefersReducedMotion()) {
      // Static fallback: no video, pouch at rest, wave fully splashed.
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.style.display = "none";
      }
      if (bgRef.current) bgRef.current.style.opacity = "1";
      const pouch = pouchRef.current;
      if (pouch) {
        pouch.style.opacity = "1";
        pouch.style.transform = "translate(-50%, -50%)";
      }
      const wave = waveRef.current;
      if (wave) {
        wave.style.opacity = "1";
        wave.style.transform = "scale(1)";
      }
      return;
    }
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const centerY = rect.top + rect.height / 2;
      const p = clamp((FROM * vh - centerY) / ((FROM - TO) * vh), 0, 1);

      // Scroll-down: freeze the video on its current frame (the pouch pops
      // out of it). Scroll fully back to rest: resume the loop.
      if (p > 0 && !engagedRef.current) {
        engagedRef.current = true;
        videoRef.current?.pause();
      } else if (p === 0 && engagedRef.current) {
        engagedRef.current = false;
        videoRef.current?.play().catch(() => {});
      }

      // Stage 1 — the frozen frame cross-fades into the soft red background.
      const fade = smoothstep(clamp(p / FADE_END, 0, 1));
      if (videoRef.current) videoRef.current.style.opacity = (1 - fade).toFixed(3);
      if (bgRef.current) bgRef.current.style.opacity = fade.toFixed(3);

      // Stage 2 — the pouch materialises over its twin in the video frame
      // (EMERGE_DX/DY, EMERGE_SCALE) and travels to its rest spot as it
      // emerges, rising toward the viewer the whole way…
      // …and Stage 3 — only once it's out does it tip over. (rot is computed
      // outside the pouch block because the splash below is keyed to it.)
      const rp = smoothstep(clamp((p - ROT_DELAY) / (1 - ROT_DELAY), 0, 1));
      const rot = ROT_START + (ROT_END - ROT_START) * rp;
      const pouch = pouchRef.current;
      if (pouch) {
        const emerge = smoothstep(clamp(p / EMERGE_END, 0, 1));
        const dx = EMERGE_DX * (1 - emerge);
        const dy = EMERGE_DY * (1 - emerge) - LIFT_MU * p;
        const scale = (EMERGE_SCALE + (1 - EMERGE_SCALE) * emerge) * (1 + GROW * p);
        pouch.style.opacity = clamp(p / 0.12, 0, 1).toFixed(3);
        pouch.style.transform = `translate(-50%, -50%) translate(calc(var(--mu) * ${dx.toFixed(
          2
        )}), calc(var(--mu) * ${dy.toFixed(2)})) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(
          2
        )}deg)`;
      }

      // Stage 4 — the splash, keyed to the cap actually facing down: it only
      // begins once the pouch has rotated past SPLASH_ROT°. Anchored to the
      // seam with the red section below, it surges UP toward the spout with a
      // slight overshoot (backOut on Y), spreads sideways a beat behind
      // (smoothstep on X).
      const wave = waveRef.current;
      if (wave) {
        const sp = clamp(
          (Math.abs(rot) - SPLASH_ROT) / (Math.abs(ROT_END) - SPLASH_ROT),
          0,
          1
        );
        const sy = backOut(sp);
        const sx = smoothstep(sp);
        // Slide the wave so the spike stays under the swinging cap. No
        // rotation here: any tilt would lift the flat bottom edge off the
        // seam with the red section below.
        const capX = POUCH_CX + CAP_D * Math.sin((rot * Math.PI) / 180);
        const wdx = capX - SPIKE_X;
        wave.style.opacity = clamp(sp / 0.15, 0, 1).toFixed(3);
        wave.style.transform = `translateX(calc(var(--mu) * ${wdx.toFixed(
          2
        )})) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // Play the loop only while the scene is actually on screen.
    let io: IntersectionObserver | undefined;
    const video = videoRef.current;
    if (video) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (engagedRef.current) return;
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        },
        { threshold: 0.25 }
      );
      io.observe(wrap);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      /* overflow-x-clip only: the wave overhangs the 390 frame horizontally,
         but the pouch must be free to rise ABOVE the section as it pops out
         (matching desktop, where the collage canvas never clips it). */
      className="relative w-full overflow-x-clip bg-[#fff0e5] md:hidden"
      style={{ containerType: "inline-size", ...MU_VAR, height: mu(WAVE_TOP + WAVE_H) }}
    >
      {/* Scene box — the video / pouch stage */}
      <div
        ref={wrapRef}
        className="absolute left-0 top-0"
        style={{ width: mu(SCENE_W), height: mu(SCENE_H) }}
      >
        {/* Soft red background — revealed under the video as it fades out */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={bgRef}
          src="/kyoto/kyoto-background.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full object-cover"
          style={{ opacity: 0 }}
        />

        {/* Looping KYOTO video — freezes and cross-fades away as the pouch emerges */}
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          className="pointer-events-none absolute inset-0 size-full object-cover"
          style={{ opacity: 1, willChange: "opacity" }}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />

        {/* KYOTO pouch — emerges out of the video (fade + grow), then tips over on scroll */}
        <div
          ref={pouchRef}
          className="pointer-events-none absolute"
          style={{
            left: POUCH_X,
            top: POUCH_Y,
            width: mu(POUCH_W),
            height: mu(POUCH_W),
            opacity: 0,
            transform: `translate(-50%, -50%) translate(${mu(EMERGE_DX)}, ${mu(
              EMERGE_DY
            )}) scale(${EMERGE_SCALE})`,
            transformOrigin: "50% 50%",
            willChange: "transform, opacity",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kyoto/kyoto-image.png"
            alt="ANANDA KYOTO cocktail pouch — Strawberry / Lychee · Yuzu"
            className="block size-full select-none"
          />
        </div>

        {/* Red wave — the splash. Bottom-anchored to the seam with the red
            Pathways section below; rises with overshoot to meet the
            spout as the pouch tips. Always mounted so it can bloom while
            scrubbing; invisible at rest. */}
        <div
          ref={waveRef}
          className="pointer-events-none absolute"
          style={{
            left: mu(WAVE_LEFT),
            top: mu(WAVE_TOP),
            width: mu(WAVE_W),
            height: mu(WAVE_H),
            opacity: 0,
            transform: "scale(0)",
            transformOrigin: WAVE_ORIGIN,
            willChange: "transform, opacity",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/c-wave.svg" alt="" aria-hidden="true" className="block size-full" />
        </div>
      </div>
    </section>
  );
}
