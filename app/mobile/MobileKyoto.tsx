"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
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
 *    does it tip over, and liquid POURS out of the spout — a thin STREAM
 *    (tracking the cap) whose height is pure geometry (cap Y to the PUDDLE's
 *    fixed top), so it visibly falls/grows as the pouch tips and collapses
 *    once the spout reaches the puddle, plus a PUDDLE (`/c-wave.svg`) that
 *    fades + "plops" in at the seam below, with a brief settle bounce.
 *    Everything is scrubbed (reverses on scroll-up), and scrolling fully back
 *    to rest resumes the video loop.
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
// "Come out toward the viewer" pop. The cutout's rest spot now sits exactly
// where the pouch appears in the video frame (centred), so it materialises over
// its twin and STAYS put — only growing toward the viewer (scale) and lifting,
// no sideways drift. Hence the positional emerge deltas are 0.
const EMERGE_SCALE = 0.8; // ≈ the video pouch's size vs the cutout
const EMERGE_DX = 0; // no horizontal drift — stays centred on the video twin
const EMERGE_DY = 0; // no vertical drift on emerge (the lift below still applies)
const LIFT_MU = 74; // how far (mobile design px) it rises
const GROW = 0.12; // extra scale as it pops out
// Rotation (flat 2-D, deg), scrubbed over the back of the window.
const ROT_START = 0; // at rest
const ROT_END = 200; // full scroll-down (positive = tips to the right / clockwise)
// Scene box (desktop 789.24×905.94 → full mobile frame width).
const SCENE_W = 390;
const SCENE_H = 447.7;
// Pouch image (square) + placement inside the scene box. Centred on the video
// pouch (the old 20%/60% rest + emerge offset landed here), so the cutout
// emerges dead-centre in the frame.
const POUCH_W = 444.7; // img side in mobile design px
const POUCH_X = "47%";
const POUCH_Y = "70%";
// The pour has two independent pieces so it reads as liquid actually FALLING
// rather than a shape unveiling:
//  • STREAM — a thin column tracking the cap horizontally (like the real
//    spout), whose height is pure geometry: cap Y down to the puddle's fixed
//    top. It visibly grows as the pouch tips and collapses to nothing once
//    the spout reaches the puddle — no separate reveal animation needed.
//  • PUDDLE (`/c-wave.svg`) — pinned edge-to-edge across the full mobile
//    frame (SCENE_W, which is always exactly viewport-wide — the scene box
//    already spans the section at left-0 with width mu(SCENE_W)). Its height
//    is shallower than the SVG's natural ratio would give on purpose: the
//    cap barely moves vertically across the visible splash window
//    (SPLASH_ROT→ROT_END), so a full-height puddle would swallow the stream
//    almost entirely — a shallower puddle leaves it room to actually be seen
//    falling. It fades + "plops" in a beat after the stream starts.
const WAVE_FLOOR_Y = 559.2; // = old WAVE_TOP(399.5) + WAVE_H(159.7): the fixed seam
const PUDDLE_H = 89; // shallower than natural (~86u) so the stream stays visible — see above
const STREAM_W = 20; // falling-stream column width (mobile design px)
// The splash is keyed to the pouch's ROTATION, not raw scroll: it starts once
// the cap has swung past SPLASH_ROT° (cap points straight down at 180°) and
// completes at full rotation (|ROT_END|).
const SPLASH_ROT = 150;
// Cap-tracking geometry: the pouch's centre (x constant, y falls by the LIFT
// as it emerges) plus the cap's rotated offset from that centre gives the
// cap's actual (x, y) every frame — used to position the STREAM only (the
// puddle's position is fixed full-bleed, see above).
const POUCH_CX = SCENE_W * 0.47; // pouch centre x (= POUCH_X of the scene box)
const POUCH_CY = SCENE_H * 0.7; // pouch centre y at rest (= POUCH_Y of the scene box)
const CAP_D = 169; // cap-tip distance from the pouch image centre (desktop 342 × 0.494)

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function MobileKyoto() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pouchRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const waveInnerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const engagedRef = useRef(false);
  const waveSettledRef = useRef(false);
  const waveIdleRef = useRef<gsap.core.Tween | null>(null);

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
      const stream = streamRef.current;
      const wave = waveRef.current;
      if (stream && wave) {
        // Cap position at full rotation/lift (the settled pose), so the
        // static stream still connects the spout to the puddle correctly.
        const rad = (ROT_END * Math.PI) / 180;
        const capY = POUCH_CY - LIFT_MU - CAP_D * Math.cos(rad);
        const puddleTop = WAVE_FLOOR_Y - PUDDLE_H;
        stream.style.opacity = "1";
        stream.style.top = mu(capY);
        stream.style.height = mu(Math.max(0, puddleTop - capY));
        wave.style.opacity = "1";
        wave.style.transform = "scale(1, 1)";
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

      // Stage 4 — the pour, keyed to the cap actually facing down: it only
      // begins once the pouch has rotated past SPLASH_ROT°. The STREAM's
      // height is pure geometry (cap Y down to the puddle's fixed top), so it
      // visibly falls/grows as the pouch tips and collapses to nothing once
      // the spout reaches the puddle — no separate reveal animation needed.
      // The PUDDLE fades + "plops" in a beat after the stream starts (a brief
      // scaleY bounce sells it "landing"), as if the liquid takes a moment to
      // reach it.
      const stream = streamRef.current;
      const wave = waveRef.current;
      if (stream && wave) {
        const sp = clamp(
          (Math.abs(rot) - SPLASH_ROT) / (Math.abs(ROT_END) - SPLASH_ROT),
          0,
          1
        );
        // Isolate just the overshoot hump of backOut (its excess above 1) so
        // the bounce is a brief "plop" near the end, not a scale-from-zero.
        const bounce = 1 + Math.max(0, backOut(sp) - 1) * 0.6;
        // The cap's actual Y: pouch centre (lowered by the lift) plus its
        // rotated offset from that centre.
        const rad = (rot * Math.PI) / 180;
        const capY = POUCH_CY - LIFT_MU * p - CAP_D * Math.cos(rad);
        const puddleTop = WAVE_FLOOR_Y - PUDDLE_H;
        stream.style.opacity = clamp(sp / 0.1, 0, 1).toFixed(3);
        stream.style.top = mu(capY);
        stream.style.height = mu(Math.max(0, puddleTop - capY));

        const puddleOpacity = clamp((sp - 0.2) / 0.5, 0, 1);
        wave.style.opacity = puddleOpacity.toFixed(3);
        wave.style.transform = `scale(1, ${bounce.toFixed(3)})`;

        // Idle loop: once the pour has essentially finished settling, keep
        // the puddle subtly alive (gentle flow/wobble) instead of going
        // static. Scrolling back out of the settled zone stops it and resets
        // the inner wrapper — the idle animation lives there, never touching
        // the outer div's scroll-driven transform/clip-path, so the two never
        // fight over the same property.
        const settled = sp >= 0.98;
        if (settled && !waveSettledRef.current) {
          waveSettledRef.current = true;
          const inner = waveInnerRef.current;
          if (inner) {
            waveIdleRef.current = gsap.to(inner, {
              scaleX: 1.018,
              skewX: 1.2,
              duration: 2.6,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
          }
        } else if (!settled && waveSettledRef.current) {
          waveSettledRef.current = false;
          waveIdleRef.current?.kill();
          waveIdleRef.current = null;
          if (waveInnerRef.current) gsap.set(waveInnerRef.current, { scaleX: 1, skewX: 0 });
        }
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
      waveIdleRef.current?.kill();
    };
  }, []);

  return (
    <section
      /* overflow-x-clip: safety net — the wave is sized to exactly match this
         section's width, but clip horizontally in case of sub-pixel rounding.
         The pouch itself is separately clipped to the scene box below (it
         must never spill past the red square, even mid-rotation) — see the
         inner overflow-hidden wrapper. */
      className="relative w-full overflow-x-clip bg-[#fff0e5] md:hidden"
      style={{ containerType: "inline-size", ...MU_VAR, height: mu(WAVE_FLOOR_Y) }}
    >
      {/* Scene box — the video / pouch stage */}
      <div
        ref={wrapRef}
        className="absolute left-0 top-0"
        style={{ width: mu(SCENE_W), height: mu(SCENE_H) }}
      >
        {/* Clips the video + pouch to the red scene box — the pouch must stay
            inside this frame at every rotation, never spilling past its
            edges. The wave is a SIBLING outside this clip (below), since it's
            meant to spill past the box's bottom edge into the section below. */}
        <div className="absolute inset-0 overflow-hidden">
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
        </div>

        {/* Falling stream — connects the spout to the puddle. Height is pure
            geometry (cap Y down to the puddle's fixed top), so it visibly
            grows as the pouch tips and collapses once the spout reaches the
            puddle — this alone reads as liquid falling, no reveal trick
            needed. Tracks the cap horizontally, unlike the full-bleed puddle
            below. The looping highlight (.wave-flow-glint) sells continuous
            motion long after the scroll-driven fall finishes. */}
        <div
          ref={streamRef}
          className="pointer-events-none absolute overflow-hidden"
          style={{
            left: mu(POUCH_CX - STREAM_W / 2),
            top: mu(POUCH_CY - CAP_D),
            width: mu(STREAM_W),
            height: 0,
            opacity: 0,
            borderRadius: mu(STREAM_W / 2),
            background: "linear-gradient(180deg, #f0685a 0%, #eb4638 45%, #eb4638 100%)",
            willChange: "top, height, opacity",
          }}
        >
          <div className="wave-flow-glint" aria-hidden="true" />
        </div>

        {/* Puddle — the splash landing at the seam with the red Pathways
            section below. Fixed edge-to-edge across the full mobile frame
            (the scene box already spans the section at left-0, full width)
            so it never gaps on one side, at a shallower-than-natural height
            (see PUDDLE_H above). Fades + plops in a beat after the stream
            starts. Always mounted so it can bloom while scrubbing; invisible
            at rest. The inner wrapper is a separate layer purely for the
            settled idle wobble, so it never fights the outer div's
            scroll-driven styles. */}
        <div
          ref={waveRef}
          className="pointer-events-none absolute overflow-hidden"
          style={{
            left: mu(0),
            top: mu(WAVE_FLOOR_Y - PUDDLE_H),
            width: mu(SCENE_W),
            height: mu(PUDDLE_H),
            opacity: 0,
            transform: "scale(1, 1)",
            transformOrigin: "50% 100%",
            willChange: "transform, opacity",
          }}
        >
          <div ref={waveInnerRef} className="size-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/c-wave.svg" alt="" aria-hidden="true" className="block size-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
