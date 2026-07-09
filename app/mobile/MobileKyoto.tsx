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
 *    does it tip over, and liquid SPILLS out of the cap: the SPILL
 *    (`/c-wave.svg`, natural orientation — pointy peak up) is anchored by its
 *    peak to the cap/spout, so it reads as liquid coming OUT of the cap. As the
 *    pour progresses it GROWS from that peak — fanning downward and out to the
 *    sides — until its full-width base reaches the seam and laps into the red
 *    Pathways section below, so the pour reads as continuous. The spill is a
 *    long, scrubbed grow (keyed to the tip), so it's visibly seen spreading.
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
// The pour is the SPILL — `/c-wave.svg` in its natural orientation, a wavy
// mound with a pointy PEAK anchored to the cap so the liquid reads as coming
// OUT of the cap, then GROWS from that peak (fanning down + out) until its
// full-width base reaches the seam and laps into Pathways' identical red. The
// area below the pouch stays cream, so the red spill is clearly visible.
const WAVE_FLOOR_Y = 559.2; // = old WAVE_TOP(399.5) + WAVE_H(159.7): the seam the base lands on
// Cap (spout) geometry — the pouch's centre plus the cap's rotated offset gives
// the cap's (x, y) every frame; the spill's peak is pinned there.
const POUCH_CX = (parseFloat(POUCH_X) / 100) * SCENE_W; // pouch centre x (design px)
const POUCH_CY = (parseFloat(POUCH_Y) / 100) * SCENE_H; // pouch centre y at rest (design px)
const CAP_D = 169; // cap-tip distance from the pouch image centre (desktop 342 × 0.494) — nudge to sit on the cap
// Spill sizing: `/c-wave.svg`'s peak sits at 42.41% of its width. SPILL_W is
// wider than the frame so the fanned base fully spans it; its height is geometry
// (cap → seam), so it always reaches Pathways at full pour.
const WAVE_PEAK_X = 0.4241; // fraction of the spill width where the pointy peak sits
const SPILL_W = SCENE_W * 1.7; // fanned spill width (mobile design px) — bigger = spreads wider to the sides
// Settled cap + spill box: computed once at full tip so the spill can live at a
// FIXED size/position and be driven purely by `transform` (translate + scale) —
// GPU-composited, so the grow stays smooth (no per-frame layout from resizing).
const CAP_RAD_SETTLED = (ROT_END * Math.PI) / 180;
const CAP_X_SETTLED = POUCH_CX + CAP_D * Math.sin(CAP_RAD_SETTLED);
const CAP_Y_SETTLED = POUCH_CY - LIFT_MU - CAP_D * Math.cos(CAP_RAD_SETTLED);
const SPILL_LEFT = CAP_X_SETTLED - WAVE_PEAK_X * SPILL_W; // fixed box left (design px)
const SPILL_H = Math.max(0, WAVE_FLOOR_Y - CAP_Y_SETTLED); // fixed box height (cap → seam)
// The spill grows over this scroll-progress range. A single smoothstep (not the
// old compounded easing) gives one clean ease-in/out, so it spreads gradually.
const POUR_P_START = 0.6;
const POUR_P_END = 1;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function MobileKyoto() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pouchRef = useRef<HTMLDivElement>(null);
  const spillRef = useRef<HTMLDivElement>(null);
  const spillInnerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const engagedRef = useRef(false);
  const spillSettledRef = useRef(false);
  const spillIdleRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    if (prefersReducedMotion()) {
      // Static fallback: no video, pouch at rest, spill fully spread.
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
      const spill = spillRef.current;
      if (spill) {
        // Fully spread: the fixed box already sits at the settled cap, so no
        // translate is needed — just scale it in.
        spill.style.opacity = "1";
        spill.style.transform = "translate(0px, 0px) scale(1)";
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
      // …and Stage 3 — only once it's out does it tip over. (rp is reused by
      // the spill below, which is keyed to the tip.)
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

      // Stage 4 — the spill. The c-wave's pointy peak is pinned to the cap and
      // the shape GROWS from that peak (fanning down + out) as the pour
      // progresses, its base landing full-width on the seam. Driven by a long,
      // scrubbed pour progress (rp past POUR_FROM_RP → full tip).
      const spill = spillRef.current;
      if (spill) {
        const pourProg = smoothstep(
          clamp((p - POUR_P_START) / (POUR_P_END - POUR_P_START), 0, 1)
        );
        const pourOpacity = clamp(pourProg / 0.1, 0, 1);
        // Cap (spout) position — the fixed spill box is TRANSLATED so its peak
        // stays pinned to the cap as it swings, then SCALED to grow the spill.
        // Both are transform-only, so the motion is GPU-smooth.
        const rad = (rot * Math.PI) / 180;
        const capX = POUCH_CX + CAP_D * Math.sin(rad);
        const capY = POUCH_CY - LIFT_MU * p - CAP_D * Math.cos(rad);
        const dx = capX - CAP_X_SETTLED;
        const dy = capY - CAP_Y_SETTLED;
        spill.style.opacity = pourOpacity.toFixed(3);
        spill.style.transform = `translate(${mu(dx)}, ${mu(dy)}) scale(${pourProg.toFixed(4)})`;

        // Idle loop: once the spill has essentially finished spreading, keep it
        // subtly alive (gentle flow/wobble). Scrolling back out of the settled
        // zone stops it and resets the inner wrapper — the idle animation lives
        // there, never touching the outer div's scroll-driven transform.
        const settled = pourProg >= 0.98;
        if (settled && !spillSettledRef.current) {
          spillSettledRef.current = true;
          const inner = spillInnerRef.current;
          if (inner) {
            spillIdleRef.current = gsap.to(inner, {
              scaleX: 1.014,
              skewX: 0.8,
              duration: 2.6,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
          }
        } else if (!settled && spillSettledRef.current) {
          spillSettledRef.current = false;
          spillIdleRef.current?.kill();
          spillIdleRef.current = null;
          if (spillInnerRef.current) gsap.set(spillInnerRef.current, { scaleX: 1, skewX: 0 });
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
      spillIdleRef.current?.kill();
    };
  }, []);

  return (
    <section
      /* overflow-clip: the spill fans past the scene box down to the seam (this
         section's bottom, height = WAVE_FLOOR_Y) and laps just past it —
         clipping here contains that spill so Pathways' identical red carries the
         pour on. The pouch is separately clipped to the scene box (it must never
         spill past the red square, even mid-rotation) — see the inner
         overflow-hidden wrapper. */
      className="relative w-full overflow-clip bg-[#fff0e5] md:hidden"
      style={{ containerType: "inline-size", ...MU_VAR, height: mu(WAVE_FLOOR_Y) }}
    >
      {/* Scene box — the video / pouch stage */}
      <div
        ref={wrapRef}
        className="absolute left-0 top-0"
        style={{ width: mu(SCENE_W), height: mu(SCENE_H) }}
      >
        {/* Clips the video + pouch to the red scene box — the pouch must stay
            inside this frame at every rotation, never spilling past its edges.
            The spill is a SIBLING rendered AFTER this clip (below), so it sits
            in FRONT (its peak reads as coming out of the cap) and can fan past
            the box into the section below. */}
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

        {/* Spill — `/c-wave.svg` in natural orientation (pointy peak up). Its
            peak is pinned to the cap and it GROWS from there (transform-origin
            at the peak) so the liquid reads as coming OUT of the cap and fanning
            down + out to the sides, its base landing full-width on the seam to
            merge with Pathways. Position/size are JS-driven per frame; invisible
            at rest. The inner wrapper is a separate layer purely for the settled
            idle wobble, so it never fights the outer div's grow. */}
        <div
          ref={spillRef}
          className="pointer-events-none absolute"
          style={{
            left: mu(SPILL_LEFT),
            top: mu(CAP_Y_SETTLED),
            width: mu(SPILL_W),
            height: mu(SPILL_H),
            opacity: 0,
            transform: "scale(0)",
            transformOrigin: `${(WAVE_PEAK_X * 100).toFixed(2)}% 0%`,
            willChange: "transform, opacity",
          }}
        >
          <div ref={spillInnerRef} className="size-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/c-wave.svg" alt="" aria-hidden="true" className="block size-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
