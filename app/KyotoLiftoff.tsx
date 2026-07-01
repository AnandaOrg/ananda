"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Section 3 — the KYOTO pouch scene. Two phases:
 *
 * 1. "video" — `public/videos/kyoto.mp4` loops (muted) while the scene is in
 *    the viewport (play/pause via IntersectionObserver).
 * 2. "pouch" — the moment the user scrolls past the scene, the video pauses,
 *    the `public/kyoto/` layers are preloaded, and the scene swaps to the soft
 *    red background (`kyoto-background.png`) + KYOTO pouch cutout
 *    (`kyoto-image.png`). The pouch then pops out toward the viewer (rises +
 *    grows) and tips over, and the red wave (`/c-wave.svg`) splashes OUT of the
 *    spout — it scales up from the tip of its built-in trickle spike, timed to
 *    the back half of the scroll window. Scroll-scrubbed (reverses on
 *    scroll-up), and scrolling fully back to rest swaps back to the video,
 *    which loads and plays again.
 *
 * NOTE: this component now owns the red wave layer (it used to be a static
 * sibling in AboutCollage) so one scroll progress drives pouch + splash.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ── Assets ─────────────────────────────────────────────────────────────────
const VIDEO_SRC = "/videos/kyoto.mp4";
const POUCH_ASSETS = ["/kyoto/kyoto-background.png", "/kyoto/kyoto-image.png"];

// ── Tunables (eyeball in dev) ──────────────────────────────────────────────
// Scroll window: the motion runs as the scene's centre travels FROM→TO of vh.
const FROM = 0.55; // ~scene fully shown
const TO = 0.12;
// "Come out toward the viewer" pop.
const LIFT_U = 150; // how far (design px) it rises
const GROW = 0.12; // extra scale as it pops out
// Rotation (flat 2-D, deg), scrubbed over the same window.
const ROT_START = 0; // at rest
const ROT_END = -200; // full scroll-down
// Pouch image (square) + placement inside the 789×906 scene box.
const POUCH_W = 900; // img side in design px (visible pouch ≈ 32% of this)
const POUCH_X = "20%";
const POUCH_Y = "60%";
// Red-wave splash. Placement is relative to the scene box, in design px
// (same canvas spot it occupied as a static layer in AboutCollage).
const WAVE_LEFT = -307.27; // = -9.75 (canvas) - 297.52 (scene left)
const WAVE_TOP = 808.52; // = 1787.06 (canvas) - 978.54 (scene top)
const WAVE_W = 1464.584;
const WAVE_H = 323.123;
// The wave SVG's trickle spike tops out at ~x 615 / 1464, y 0 — the splash
// grows out of that point (kept under the spout).
const WAVE_ORIGIN = "42% 0%";
const SPLASH_START = 0.4; // fraction of the scroll window where the splash begins

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Resolve once `src` is fetched (or errored — never blocks the swap). */
const preload = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });

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
  const engagedRef = useRef(false);
  const [phase, setPhase] = useState<"video" | "pouch">("video");

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (prefersReducedMotion()) {
      // Static fallback: no video, pouch at rest, wave fully splashed.
      if (waveRef.current) waveRef.current.style.transform = "scale(1)";
      const t = requestAnimationFrame(() => setPhase("pouch"));
      return () => cancelAnimationFrame(t);
    }
    let raf = 0;
    let cancelled = false;

    // Scroll-down: pause the video, fetch the pouch layers, then swap phases.
    const engage = () => {
      engagedRef.current = true;
      videoRef.current?.pause();
      Promise.all(POUCH_ASSETS.map(preload)).then(() => {
        // engagedRef may have been reset by a quick scroll back up — don't
        // swap to the pouch after the user has already returned to rest.
        if (!cancelled && engagedRef.current) setPhase("pouch");
      });
    };

    // Scroll fully back to rest: swap back to the video (it remounts and the
    // IntersectionObserver plays it again).
    const revert = () => {
      engagedRef.current = false;
      setPhase("video");
    };

    const update = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const centerY = rect.top + rect.height / 2;
      const p = clamp((FROM * vh - centerY) / ((FROM - TO) * vh), 0, 1);

      if (p > 0 && !engagedRef.current) engage();
      else if (p === 0 && engagedRef.current) revert();

      // Come OUT toward the viewer + rotate left (visual 90°→270°).
      const pouch = pouchRef.current;
      if (pouch) {
        const lift = -LIFT_U * p;
        const scale = 1 + GROW * p;
        const rot = ROT_START + (ROT_END - ROT_START) * p;
        pouch.style.transform = `translate(-50%, -50%) translateY(calc(var(--u) * ${lift.toFixed(
          2
        )})) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
      }

      // Splash: the wave blooms out of the spout over the back half of the
      // window (smoothstepped so it starts gently and settles softly).
      const wave = waveRef.current;
      if (wave) {
        const sp = clamp((p - SPLASH_START) / (1 - SPLASH_START), 0, 1);
        const eased = sp * sp * (3 - 2 * sp);
        wave.style.transform = `scale(${eased.toFixed(3)})`;
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
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [phase]);

  return (
    <div
      ref={wrapRef}
      className="absolute"
      style={{ left: u(posLeft), top: u(posTop), width: u(789.24), height: u(905.94) }}
    >
      {phase === "video" ? (
        /* Phase 1 — looping KYOTO video while the scene is in view */
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          className="pointer-events-none absolute inset-0 size-full object-cover"
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      ) : (
        /* Phase 2 — pouch layers, swapped in after the video stops */
        <>
          {/* Soft red background layer */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kyoto/kyoto-background.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />

          {/* KYOTO pouch — pops out toward the viewer + rotates left (visual 90°→270°) on scroll */}
          <div
            ref={pouchRef}
            className="pointer-events-none absolute"
            style={{
              left: POUCH_X,
              top: POUCH_Y,
              width: u(POUCH_W),
              height: u(POUCH_W),
              transform: `translate(-50%, -50%) rotate(${ROT_START}deg)`,
              transformOrigin: "50% 50%",
              willChange: "transform",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kyoto/kyoto-image.png"
              alt="ANANDA KYOTO cocktail pouch — Strawberry / Lychee · Yuzu"
              className="block size-full select-none"
            />
          </div>
        </>
      )}

      {/* Red wave — splashes out of the spout as the pouch tips (scale 0→1
          from the trickle spike's tip). Always mounted so it can bloom while
          scrubbing; invisible at scale 0 during the video phase. */}
      <div
        ref={waveRef}
        className="pointer-events-none absolute"
        style={{
          left: u(WAVE_LEFT),
          top: u(WAVE_TOP),
          width: u(WAVE_W),
          height: u(WAVE_H),
          transform: "scale(0)",
          transformOrigin: WAVE_ORIGIN,
          willChange: "transform",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/c-wave.svg" alt="" aria-hidden="true" className="block size-full" />
      </div>
    </div>
  );
}
