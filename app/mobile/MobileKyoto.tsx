"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import SpillWave from "../SpillWave";
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
 *    From early in the pour the spill is ALIVE: the c-wave silhouette itself
 *    rolls like an ocean swell (SpillWave morphs the path per frame, peak
 *    pinned to the cap) and the whole shape keeps a slow flow/wobble loop
 *    pivoting on the peak. Everything but those loops is scrubbed (reverses
 *    on scroll-up), and scrolling fully back to rest resumes the video loop.
 * 3. The stage is PINNED while all this runs: it sticks with its base (the
 *    Pathways seam) on the viewport bottom and the choreography scrubs over
 *    the section's extra height — so nothing of the red section below is
 *    visible until the wave has fully landed, matching the desktop read
 *    (there the tall scene keeps the seam below the fold until the pour ends).
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
// Mobile-sized encode (720×960) of the desktop kyoto.mp4 — same footage,
// a fraction of the decode cost on phones.
const VIDEO_SRC = "/videos/kyoto-mobile.mp4";

// ── Tunables (desktop KyotoLiftoff values × 0.494 where they are lengths) ──
// Scroll window: unlike desktop (whose scene is tall enough that the Pathways
// seam stays below the fold until the pour lands), the mobile scene is short —
// keyed to raw viewport travel, half the screen would be flat Pathways red
// while the wave is still growing. So the stage pins instead (sticky base on
// the viewport bottom) and the whole choreography scrubs over this much
// scroll. Nothing pours "onto" a red that's already there — the red section
// only rises once the wave has fully landed, same read as desktop.
const SCRUB_SVH = 60; // scroll distance (svh) the pinned choreography scrubs over
// Stage boundaries, as fractions of the scroll window.
const FADE_END = 0.22; // video → red background cross-fade completes here — comfortably before ROT_DELAY, so the hand+lemon video is fully gone before any rotation is visible
const EMERGE_END = 0.35; // pouch fully "out of the video" here
const ROT_DELAY = 0.3; // rotation only starts once the pouch is mostly out
// "Come out toward the viewer" pop. The cutout's rest spot now sits exactly
// where the pouch appears in the video frame (centred), so it materialises over
// its twin and STAYS put — only growing toward the viewer (scale) and lifting,
// no sideways drift. Hence the positional emerge deltas are 0.
const EMERGE_SCALE = 0.8; // ≈ the video pouch's size vs the cutout
const EMERGE_DX = 0; // no horizontal drift — stays centred on the video twin
const EMERGE_DY = 0; // no vertical drift on emerge (the lift below still applies)
const LIFT_MU = 74; // how far (mobile design px) it rises during EMERGE
// As it tips (keyed to rp, the rotation progress, not raw scroll) the pouch
// also swings DOWN and OUT — past LIFT_MU's emerge-rise — so the cap clears
// the rectangle's bottom edge into the cream, per design (desktop 260 × 0.494).
const TIP_DROP = 128;
const GROW = 0.12; // extra scale as it pops out
// Rotation (flat 2-D, deg), scrubbed over the back of the window.
const ROT_START = 0; // at rest
const ROT_END = 160; // full scroll-down (positive = tips to the right / clockwise) — matches desktop KyotoLiftoff
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
// Pushed down 84 (desktop's 170 × 0.494) — measured from the Figma reference:
// the settled spill's peak should stand tall, a full mound, not the flattened
// hill the original seam gave it. Growing WAVE_FLOOR_Y also grows this
// section's own height (see the `height` below), so Pathways naturally gets
// pushed down to make room — no separate parent height to touch, unlike desktop.
const WAVE_FLOOR_Y = 643.18;
const SPILL_OVERLAP = 40; // how far (mobile design px) the base laps past the seam onto Pathways' red
// Cap (spout) geometry — the pouch's centre plus the cap's rotated offset gives
// the cap's (x, y) every frame; the spill's peak is pinned there.
const POUCH_CX = (parseFloat(POUCH_X) / 100) * SCENE_W; // pouch centre x (design px)
const POUCH_CY = (parseFloat(POUCH_Y) / 100) * SCENE_H; // pouch centre y at rest (design px)
const CAP_D = 156; // cap-tip distance from the pouch image centre (desktop 315 × 0.494) — measured from kyoto-image.png's opaque bbox
// The pouch is CSS-scaled (EMERGE_SCALE→1, then +GROW) as it emerges and tips,
// which scales the cap's distance from centre too — the cap-tracking math below
// multiplies CAP_D by the SAME live `scale` each frame so the wave's peak
// tracks the actual rendered cap, not the unscaled image's.
// Manual fine-tune on top of the scaled cap-tracking geometry, if still needed
// after eyeballing in dev (design px, +down).
const SPILL_Y_PUSH = 0;
// Spill sizing: `/c-wave.svg`'s peak sits at 42.41% of its width. SPILL_W is
// wider than the frame so the fanned base fully spans it; its height is geometry
// (cap → seam), so it always reaches Pathways at full pour.
const WAVE_PEAK_X = 0.4241; // fraction of the spill width where the pointy peak sits
// Fanned spill width. The peak (WAVE_PEAK_X) sits right-of-centre (the cap
// swings right as it tips), so the box needs real overhang on the LEFT to
// still reach the frame edge there — 1.7× is the original, proven value.
// WAVE_FLOOR_Y above (not this) is what fixes the flattened-mound look.
const SPILL_W = SCENE_W * 1.7;
// Settled cap + spill box: computed once at full tip so the spill can live at a
// FIXED size/position and be driven purely by `transform` (translate + scale) —
// GPU-composited, so the grow stays smooth (no per-frame layout from resizing).
const CAP_RAD_SETTLED = (ROT_END * Math.PI) / 180;
const SCALE_SETTLED = 1 + GROW; // pouch's own scale at p=1, emerge=1 (EMERGE_SCALE term → 1)
const CAP_D_SETTLED = CAP_D * SCALE_SETTLED;
const CAP_X_SETTLED = POUCH_CX + CAP_D_SETTLED * Math.sin(CAP_RAD_SETTLED);
const CAP_Y_SETTLED =
  POUCH_CY - LIFT_MU + TIP_DROP - CAP_D_SETTLED * Math.cos(CAP_RAD_SETTLED) + SPILL_Y_PUSH;
const SPILL_LEFT = CAP_X_SETTLED - WAVE_PEAK_X * SPILL_W; // fixed box left (design px)
const SPILL_H = Math.max(0, WAVE_FLOOR_Y + SPILL_OVERLAP - CAP_Y_SETTLED); // fixed box height (cap → past the seam)
// The pour is keyed to the TIP ANGLE, not raw scroll progress: it only starts
// once the cap has swung past POUR_ROT_START (≈ pointing down — as close as
// ROT_END=160 allows) and completes at full tip, so liquid never leaves a cap
// that's still sideways. A single smoothstep gives one clean ease-in/out.
const POUR_ROT_START = 135; // deg — spill starts here (cap near-down) — matches desktop

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function MobileKyoto() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pouchRef = useRef<HTMLDivElement>(null);
  const spillRef = useRef<HTMLDivElement>(null);
  const spillInnerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const engagedRef = useRef(false);
  const spillAliveRef = useRef(false);
  const spillIdleRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!wrap || !section || !stage) return;

    if (prefersReducedMotion()) {
      // Static fallback: no video, pouch at rest, spill fully spread — and no
      // pin (collapse the scrub height so there's no dead scroll distance).
      section.style.height = mu(WAVE_FLOOR_Y);
      stage.style.position = "relative";
      stage.style.top = "0";
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
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Pin maths: the stage sticks once its base reaches the viewport bottom
      // (section top at vh - stageH) and stays put while the section's extra
      // height (the scrub) scrolls by — that travel drives the choreography.
      const stageH = stage.offsetHeight;
      const scrub = rect.height - stageH;
      const p = scrub > 0 ? clamp((vh - stageH - rect.top) / scrub, 0, 1) : 1;

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
      // Shared with the spill block below — the cap-tracking math needs the
      // SAME scale the pouch itself renders at, since CSS scale() also scales
      // the cap's distance from the pouch's centre.
      const emerge = smoothstep(clamp(p / EMERGE_END, 0, 1));
      const scale = (EMERGE_SCALE + (1 - EMERGE_SCALE) * emerge) * (1 + GROW * p);
      const pouch = pouchRef.current;
      if (pouch) {
        const dx = EMERGE_DX * (1 - emerge);
        const dy = EMERGE_DY * (1 - emerge) - LIFT_MU * p + TIP_DROP * rp;
        pouch.style.opacity = clamp(p / 0.12, 0, 1).toFixed(3);
        pouch.style.transform = `translate(-50%, -50%) translate(calc(var(--mu) * ${dx.toFixed(
          2
        )}), calc(var(--mu) * ${dy.toFixed(2)})) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(
          2
        )}deg)`;
      }

      // Stage 4 — the spill. The c-wave's pointy peak is pinned to the cap and
      // the shape GROWS from that peak (fanning down + out) as the pour
      // progresses, its base landing full-width past the seam. Keyed to the TIP
      // ANGLE (POUR_ROT_START → ROT_END), so nothing pours until the cap is
      // near-down; scrubbed, so it reverses cleanly on scroll-up.
      const spill = spillRef.current;
      if (spill) {
        const pourProg = smoothstep(
          clamp((rot - POUR_ROT_START) / (ROT_END - POUR_ROT_START), 0, 1)
        );
        // Cap (spout) position — the fixed spill box is TRANSLATED so its peak
        // stays pinned to the cap as it swings, then SCALED to grow the spill.
        // Both are transform-only, so the motion is GPU-smooth.
        const rad = (rot * Math.PI) / 180;
        const capD = CAP_D * scale;
        const capX = POUCH_CX + capD * Math.sin(rad);
        const capY = POUCH_CY - LIFT_MU * p + TIP_DROP * rp - capD * Math.cos(rad) + SPILL_Y_PUSH;
        const dx = capX - CAP_X_SETTLED;
        const dy = capY - CAP_Y_SETTLED;
        const pourOpacity = clamp(pourProg / 0.1, 0, 1);
        spill.style.opacity = pourOpacity.toFixed(3);
        spill.style.transform = `translate(${mu(dx)}, ${mu(dy)}) scale(${pourProg.toFixed(4)})`;

        // Liquid-alive loop: from early in the pour the crest undulates (a
        // gentle scaleX/skew pivoting on the PEAK, so it stays pinned to the
        // cap) — the wave reads as moving liquid the whole time it spreads,
        // not just once settled. Scrolling back before the pour stops it and
        // resets the inner wrapper — the loop lives there, never touching the
        // outer div's scroll-driven transform.
        const alive = pourProg >= 0.15;
        if (alive && !spillAliveRef.current) {
          spillAliveRef.current = true;
          const inner = spillInnerRef.current;
          if (inner) {
            spillIdleRef.current = gsap.to(inner, {
              scaleX: 1.02,
              skewX: 1.1,
              duration: 2.4,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
          }
        } else if (!alive && spillAliveRef.current) {
          spillAliveRef.current = false;
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
      ref={sectionRef}
      /* overflow-x-clip: the spill fans WIDER than the frame (SPILL_W), so
         sideways overflow is clipped (no horizontal page scroll) — but
         vertical overflow stays visible: the spill's base runs SPILL_OVERLAP
         past this section's bottom, lapping ON TOP of the Pathways container
         below (zIndex 1 paints it over Pathways' identical red — same fill,
         so the lap is invisible and no cream hairline can ever show at the
         seam). overflow-x-clip (NOT hidden) also matters for the pin: hidden
         would make this a scroll container and break the sticky stage. The
         pouch is separately clipped to the scene box (it must never spill
         past the red square, even mid-rotation) — see the inner
         overflow-hidden wrapper. Height = stage + scrub: the extra SCRUB_SVH
         is the scroll distance the pinned choreography consumes. */
      className="relative w-full overflow-x-clip bg-[#fff0e5] md:hidden"
      style={{
        containerType: "inline-size",
        ...MU_VAR,
        height: `calc(${mu(WAVE_FLOOR_Y)} + ${SCRUB_SVH}svh)`,
        zIndex: 1,
      }}
    >
      {/* Pinned stage — sticks with its base (the Pathways seam) on the
          viewport bottom while the choreography scrubs, so the red section
          below can't appear until the pour has fully landed. 100dvh (not svh)
          so the base hugs the true viewport edge even with the URL bar
          collapsed — an svh top would float the seam up and leak red below. */}
      <div
        ref={stageRef}
        className="sticky w-full"
        style={{ top: `calc(100dvh - ${mu(WAVE_FLOOR_Y)})`, height: mu(WAVE_FLOOR_Y) }}
      >
      {/* Scene box — the video / pouch stage */}
      <div
        ref={wrapRef}
        className="absolute left-0 top-0"
        style={{ width: mu(SCENE_W), height: mu(SCENE_H) }}
      >
        {/* Layer stack (bottom → top): video/background box (z2) → spill (z3)
            → pouch (z4). The spill must stay ABOVE the red background box so
            the liquid is visible for the whole pour (not hidden behind the
            panel) while still fanning past the box into the section below —
            and the pouch sits above the spill so the cap renders ON TOP of
            the liquid pouring out of it. */}
        <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 2 }}>
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
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />

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
            zIndex: 3,
            opacity: 0,
            transform: "scale(0)",
            transformOrigin: `${(WAVE_PEAK_X * 100).toFixed(2)}% 0%`,
            willChange: "transform, opacity",
          }}
        >
          <div
            ref={spillInnerRef}
            className="size-full"
            style={{ transformOrigin: `${(WAVE_PEAK_X * 100).toFixed(2)}% 0%` }}
          >
            <SpillWave />
          </div>
        </div>

        {/* KYOTO pouch — emerges out of the video (fade + grow), then tips
            over on scroll, swinging DOWN and OUT (TIP_DROP) so the cap clears
            the rectangle's bottom edge into the cream, per design. UNCLIPPED —
            stacked ABOVE the spill so the cap renders on top of the liquid
            pouring out of it — the pouch is meant to visibly leave the box
            both at rest (its natural overhang) and through the whole tip. */}
        <div
          className="pointer-events-none absolute"
          style={{ left: 0, top: 0, width: mu(SCENE_W), height: mu(SCENE_H), zIndex: 4 }}
        >
          <div
            ref={pouchRef}
            className="pointer-events-none absolute"
            style={{
              // Explicit px (not a %) — this div's positioned ancestor is the
              // clip layer above, which is taller than SCENE_H (POUCH_OVERHANG);
              // a percentage top would resolve against THAT height, not SCENE_H,
              // silently drifting the pouch (and everything the cap-tracking
              // spill math derives from it) away from where POUCH_CX/CY assume.
              left: mu(POUCH_CX),
              top: mu(POUCH_CY),
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
              decoding="async"
              className="block size-full select-none"
            />
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
