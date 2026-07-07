"use client";

import { useEffect, useRef } from "react";

/**
 * Section 3 — the KYOTO pouch scene. One scroll-scrubbed choreography:
 *
 * 1. At rest, `public/videos/kyoto.mp4` loops (muted) while the scene is in
 *    the viewport (play/pause via IntersectionObserver).
 * 2. As the user scrolls past the scene the video pauses on its current frame
 *    and the pouch EMERGES out of it: the frozen frame cross-fades into the
 *    soft red background (`kyoto-background.png`) while the KYOTO pouch cutout
 *    (`kyoto-image.png`) fades + grows up out of the frame. Only once it's out
 *    does it start rotating/tipping over, and the red wave (`/c-wave.svg`)
 *    splashes OUT of the spout — surging up from the seam with the red section
 *    below, with a slight overshoot before settling. Everything is scrubbed
 *    (reverses on scroll-up), and
 *    scrolling fully back to rest resumes the video loop.
 *
 * All layers stay mounted so the cross-fade can scrub in both directions —
 * there is no phase swap / remount any more.
 *
 * NOTE: this component owns the red wave layer (it used to be a static
 * sibling in AboutCollage) so one scroll progress drives pouch + splash.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;
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

// ── Tunables (eyeball in dev) ──────────────────────────────────────────────
// Scroll window: the motion runs as the scene's centre travels FROM→TO of vh.
const FROM = 0.55; // ~scene fully shown
const TO = 0.12;
// Stage boundaries, as fractions of the scroll window.
const FADE_END = 0.3; // video → red background cross-fade completes here
const EMERGE_END = 0.35; // pouch fully "out of the video" here
const ROT_DELAY = 0.3; // rotation only starts once the pouch is mostly out
// "Come out toward the viewer" pop. The cutout's rest spot now sits exactly
// where the pouch appears in the video frame (centred), so it materialises over
// its twin and STAYS put — only growing toward the viewer (scale) and lifting,
// no sideways drift. Hence the positional emerge deltas are 0.
const EMERGE_SCALE = 0.8; // ≈ the video pouch's size vs the cutout
const EMERGE_DX = 0; // no horizontal drift — stays centred on the video twin
const EMERGE_DY = 0; // no vertical drift on emerge (the lift below still applies)
const LIFT_U = 150; // how far (design px) it rises
const GROW = 0.12; // extra scale as it pops out
// Rotation (flat 2-D, deg), scrubbed over the back of the window.
const ROT_START = 0; // at rest
const ROT_END = 200; // full scroll-down (positive = tips to the right / clockwise)
// Pouch image (square) + placement inside the 789×906 scene box. Centred on the
// video pouch (the old 20%/60% rest + emerge offset landed here), so the cutout
// emerges dead-centre in the frame.
const POUCH_W = 900; // img side in design px (visible pouch ≈ 32% of this)
const POUCH_X = "47%";
const POUCH_Y = "70%";
// Red-wave splash. Placement is relative to the scene box, in design px
// (same canvas spot it occupied as a static layer in AboutCollage).
const WAVE_LEFT = -307.27; // = -9.75 (canvas) - 297.52 (scene left)
const WAVE_TOP = 808.52; // = 1787.06 (canvas) - 978.54 (scene top)
const WAVE_W = 1464.584;
const WAVE_H = 323.123;
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
const POUCH_CX = 789.24 * 0.47; // pouch centre x (= POUCH_X of the scene box)
const CAP_D = 342; // cap-tip distance from the pouch image centre (design px)
const SPIKE_X = WAVE_LEFT + 0.42 * WAVE_W; // trickle spike x at rest

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function KyotoLiftoff({
  posLeft = 297.52,
  posTop = 1878.54,
}: {
  /** Left position within the host collage canvas, in design px (× --u). */
  posLeft?: number;
  /** Top position within the host collage canvas, in design px (× --u). */
  posTop?: number;
} = {}) {
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
        const dy = EMERGE_DY * (1 - emerge) - LIFT_U * p;
        const scale = (EMERGE_SCALE + (1 - EMERGE_SCALE) * emerge) * (1 + GROW * p);
        pouch.style.opacity = clamp(p / 0.12, 0, 1).toFixed(3);
        pouch.style.transform = `translate(-50%, -50%) translate(calc(var(--u) * ${dx.toFixed(
          2
        )}), calc(var(--u) * ${dy.toFixed(2)})) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(
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
        wave.style.transform = `translateX(calc(var(--u) * ${wdx.toFixed(
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
    <div
      ref={wrapRef}
      className="absolute"
      style={{ left: u(posLeft), top: u(posTop), width: u(789.24), height: u(905.94) }}
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
          width: u(POUCH_W),
          height: u(POUCH_W),
          opacity: 0,
          transform: `translate(-50%, -50%) translate(${u(EMERGE_DX)}, ${u(
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
          section below; rises with overshoot to meet the spout as the
          pouch tips. Always mounted so it can bloom while scrubbing;
          invisible at rest. */}
      <div
        ref={waveRef}
        className="pointer-events-none absolute"
        style={{
          left: u(WAVE_LEFT),
          top: u(WAVE_TOP),
          width: u(WAVE_W),
          height: u(WAVE_H),
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
  );
}
