"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import SpillWave from "./SpillWave";

/**
 * Section 3 — the KYOTO pouch scene. One scroll-scrubbed choreography:
 *
 * 1. At rest, `public/videos/kyoto.mp4` loops (muted) while the scene is in
 *    the viewport (play/pause via IntersectionObserver).
 * 2. As the user scrolls past the scene the video pauses on its current frame
 *    and the pouch EMERGES out of it: the frozen frame cross-fades into the
 *    soft red background (`kyoto-background.png`) while the KYOTO pouch cutout
 *    (`kyoto-image.png`) fades + grows up out of the frame. Only once it's out
 *    does it start rotating/tipping over, and liquid SPILLS out of the cap: the
 *    SPILL (`/c-wave.svg`, natural orientation — pointy peak up) is anchored by
 *    its peak to the cap/spout, so it reads as liquid coming OUT of the cap. As
 *    the pour progresses it GROWS from that peak — fanning downward and out to
 *    the sides — until its full-width base reaches the seam and laps into the
 *    red Pathways section below, so the pour reads as continuous: the next
 *    section IS the poured liquid. The spill is a long, scrubbed grow (keyed to
 *    the pouch's tip), so it's visibly seen spreading, not snapped. From early
 *    in the pour the spill is ALIVE: the c-wave silhouette itself rolls like
 *    an ocean swell (SpillWave morphs the path per frame, peak pinned to the
 *    cap) and the whole shape keeps a slow flow/wobble loop pivoting on the
 *    peak (killed and reset the moment you scroll back before the pour).
 *    Everything but those loops is scrubbed (reverses on scroll-up), and
 *    scrolling fully back to rest resumes the video loop.
 *
 * All layers stay mounted so the cross-fade can scrub in both directions —
 * there is no phase swap / remount any more.
 *
 * NOTE: this component owns the red pour layer (it used to be a static
 * sibling in AboutCollage) so one scroll progress drives pouch + spill.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smoothstep = (t: number) => t * t * (3 - 2 * t);

// ── Assets ─────────────────────────────────────────────────────────────────
const VIDEO_SRC = "/videos/kyoto.mp4";

// ── Tunables (eyeball in dev) ──────────────────────────────────────────────
// Scroll window: the motion runs as the scene's centre travels FROM→TO of vh.
const FROM = 0.55; // ~scene fully shown
const TO = 0.12;
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
const LIFT_U = 150; // how far (design px) it rises during EMERGE
// As it tips (keyed to rp, the rotation progress, not raw scroll) the pouch
// also swings DOWN and OUT — past LIFT_U's emerge-rise — so the cap clears
// the rectangle's bottom edge into the cream, per design. Net motion at full
// tip is TIP_DROP - LIFT_U downward from rest.
const TIP_DROP = 260;
const GROW = 0.12; // extra scale as it pops out
// Rotation (flat 2-D, deg), scrubbed over the back of the window.
const ROT_START = 0; // at rest
const ROT_END = 160; // full scroll-down (positive = tips to the right / clockwise)
// Pouch image (square) + placement inside the 789×906 scene box. Centred on the
// video pouch (the old 20%/60% rest + emerge offset landed here), so the cutout
// emerges dead-centre in the frame.
const PANEL_W = 789.24; // scene box width in design px
const SCENE_H = 905.94; // wrapRef's own height — where the video/background box's red ends
const POUCH_W = 740; // img side in design px (visible pouch ≈ 32% of this)
const POUCH_X = "50%";
// Matches the video-twin's own pouch position, so the cutout materialises
// exactly over it with no jump.
const POUCH_Y = "65%";
// The pour is the SPILL — `/c-wave.svg` in its natural orientation, a wavy
// mound with a pointy PEAK. That peak is anchored to the cap so the liquid
// reads as coming OUT of the cap, then the whole shape GROWS from the peak
// (fanning down + out to the sides) until its full-width base reaches the seam
// and laps into Pathways' identical red — the section below reads as the pour's
// continuation. The area below the pouch panel stays cream, so the red spill is
// clearly visible against it and the cream side-margins stay continuous (no
// stray rectangles).
// Pushed down 170 from the original 1131.643 (matching AboutCollage's
// EXTRA_H) — measured from the Figma reference: the settled spill's peak
// should stand ~269 design px tall, a full mound, not the flattened ~100px
// the original seam gave it.
const WAVE_FLOOR_Y = 1301.643;
// How far (design px) the base laps PAST the calculated seam onto Pathways'
// identical red. AboutCollage's canvas only grows by SPILL_OVERLAP_H = 80
// (its own separate constant) to accommodate this — deliberately LESS than
// this value, so the spill's floor lands a real ~20px past AboutCollage's
// own overflow-hidden clip line (the excess is silently clipped away,
// harmless, since Pathways' identical red already covers that y-range).
// Matching the two constants exactly used to leave ~0.18px of margin at the
// seam — invisible in the math but well under a quarter of a real CSS px at
// typical widths, so any sub-pixel rounding between AboutCollage's and
// Pathways' independently-computed `--u` exposed a hairline of cream there.
const SPILL_OVERLAP = 100;
const CANVAS_W = 1440; // AboutCollage's canvas width (design px)
// Cap (spout) geometry — the pouch's centre plus the cap's rotated offset gives
// the cap's (x, y) every frame; the spill's peak is pinned there.
const POUCH_CX = (parseFloat(POUCH_X) / 100) * PANEL_W; // pouch centre x (wrap coords)
const POUCH_CY = (parseFloat(POUCH_Y) / 100) * SCENE_H; // pouch centre y at rest (wrap coords)
const CAP_D = 315; // cap-tip distance from the pouch image centre (design px) — measured from kyoto-image.png's opaque bbox
// The pouch is CSS-scaled (EMERGE_SCALE→1, then +GROW) as it emerges and tips,
// which scales the cap's distance from centre too — the cap-tracking math below
// multiplies CAP_D by the SAME live `scale` each frame so the wave's peak
// tracks the actual rendered cap, not the unscaled image's.
// Manual fine-tune on top of the scaled cap-tracking geometry, if still needed
// after eyeballing in dev (design px, +down).
const SPILL_Y_PUSH = -10;
// Spill sizing: `/c-wave.svg`'s peak sits at 42.41% of its width (x=621 of
// 1464). SPILL_W is wider than the canvas so the fanned base fully spans it
// (spills past both edges → no cream gap at the seam). Its height is geometry
// (cap → seam), so it always reaches Pathways at full pour.
const WAVE_PEAK_X = 0.42; // fraction of the spill width where the pointy peak sits
// Fanned spill width. The peak (WAVE_PEAK_X) sits right-of-centre (the cap
// swings right as it tips), so the box needs real overhang on the LEFT to
// still reach the canvas edge there — 1.05× left a ~172px cream gap on the
// left with this cap position. 1.45× is the minimum that clears it with a
// safety margin at any viewport width (proportional via --u/cqw); the WAVE_FLOOR_Y
// bump above is what fixes the flattened-mound look, not this width.
const SPILL_W = CANVAS_W * 1.45;
// Settled cap + spill box: computed once at full tip so the spill can live at a
// FIXED size/position and be driven purely by `transform` (translate + scale) —
// GPU-composited, so the grow stays smooth (no per-frame layout from resizing).
const CAP_RAD_SETTLED = (ROT_END * Math.PI) / 180;
const SCALE_SETTLED = 1 + GROW; // pouch's own scale at p=1, emerge=1 (EMERGE_SCALE term → 1)
const CAP_D_SETTLED = CAP_D * SCALE_SETTLED;
const CAP_X_SETTLED = POUCH_CX + CAP_D_SETTLED * Math.sin(CAP_RAD_SETTLED);
const CAP_Y_SETTLED =
  POUCH_CY - LIFT_U + TIP_DROP - CAP_D_SETTLED * Math.cos(CAP_RAD_SETTLED) + SPILL_Y_PUSH;
const SPILL_LEFT = CAP_X_SETTLED - WAVE_PEAK_X * SPILL_W; // fixed box left (wrap coords)
const SPILL_H = Math.max(0, WAVE_FLOOR_Y + SPILL_OVERLAP - CAP_Y_SETTLED); // fixed box height (cap → past the seam)
// The pour is keyed to the TIP ANGLE, not raw scroll progress: it only starts
// once the cap has swung past POUR_ROT_START (≈ pointing down — as close as
// ROT_END=160 allows) and completes at full tip, so liquid never leaves a cap
// that's still sideways. A single smoothstep gives one clean ease-in/out.
const POUR_ROT_START = 135; // deg — spill starts here (cap near-down)

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
  const spillRef = useRef<HTMLDivElement>(null);
  const spillInnerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const engagedRef = useRef(false);
  const spillAliveRef = useRef(false);
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
    // The clip isn't fetched until the first moment it's actually needed —
    // this scene sits below the fold, so a static `src` attribute would
    // download it well before the user ever scrolls near it.
    let srcLoaded = false;
    const ensureLoaded = () => {
      const video = videoRef.current;
      if (srcLoaded || !video) return;
      srcLoaded = true;
      video.src = VIDEO_SRC;
      video.load();
    };

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
        ensureLoaded();
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
        const dy = EMERGE_DY * (1 - emerge) - LIFT_U * p + TIP_DROP * rp;
        pouch.style.opacity = clamp(p / 0.12, 0, 1).toFixed(3);
        pouch.style.transform = `translate(-50%, -50%) translate(calc(var(--u) * ${dx.toFixed(
          2
        )}), calc(var(--u) * ${dy.toFixed(2)})) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(
          2
        )}deg)`;
      }

      // Stage 4 — the spill. The c-wave's pointy peak is pinned to the cap and
      // the shape GROWS from that peak (fanning down + out) as the pour
      // progresses, its base landing full-width on the seam. Keyed to the TIP
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
        const capY = POUCH_CY - LIFT_U * p + TIP_DROP * rp - capD * Math.cos(rad) + SPILL_Y_PUSH;
        const dx = capX - CAP_X_SETTLED;
        const dy = capY - CAP_Y_SETTLED;
        const pourOpacity = clamp(pourProg / 0.1, 0, 1);
        spill.style.opacity = pourOpacity.toFixed(3);
        spill.style.transform = `translate(${u(dx)}, ${u(dy)}) scale(${pourProg.toFixed(4)})`;

        // Liquid-alive loop: from early in the pour the crest undulates (a
        // gentle scaleX/skew pivoting on the PEAK, so it stays pinned to the
        // cap) — the wave reads as moving liquid the whole time it spreads,
        // not just once settled. Scrolling back before the pour stops it and
        // resets the inner wrapper — the loop lives there, never touching the
        // outer div's scroll-driven transform, so the two never fight.
        const alive = pourProg >= 0.15;
        if (alive && !spillAliveRef.current) {
          spillAliveRef.current = true;
          const inner = spillInnerRef.current;
          if (inner) {
            spillIdleRef.current = gsap.to(inner, {
              scaleX: 1.02,
              skewX: 1.1,
              duration: 4,
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

    // Play the loop only while the scene is actually on screen — and don't
    // even fetch the clip until then, so the desktop-only wrapper's mobile
    // twin (display:none, never intersecting) never downloads it.
    let io: IntersectionObserver | undefined;
    const video = videoRef.current;
    if (video) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (engagedRef.current) return;
          if (entry.isIntersecting) {
            ensureLoaded();
            video.play().catch(() => {});
          } else {
            video.pause();
          }
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
    <div
      ref={wrapRef}
      className="absolute"
      style={{ left: u(posLeft), top: u(posTop), width: u(PANEL_W), height: u(SCENE_H) }}
    >
      {/* Layer stack (bottom → top): video/background box (z2) → spill (z3) →
          pouch (z4). The spill must stay ABOVE the red background box so the
          liquid is visible for the whole pour (not hidden behind the panel)
          while still fanning past the box into the section below — and the
          pouch sits above the spill so the cap renders ON TOP of the liquid
          pouring out of it. */}
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
          className="pointer-events-none absolute inset-0 size-full object-cover"
          style={{ opacity: 1, willChange: "opacity" }}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />

      </div>

      {/* Spill — `/c-wave.svg` in natural orientation (pointy peak up). Its peak
          is pinned to the cap and it GROWS from there (transform-origin at the
          peak) so the liquid reads as coming OUT of the cap and fanning down +
          out to the sides, its base landing full-width on the seam to merge with
          Pathways. Position/size are JS-driven per frame (see the spill block);
          invisible at rest. The inner wrapper is a separate layer purely for the
          settled idle wobble, so it never fights the outer div's grow. */}
      <div
        ref={spillRef}
        className="pointer-events-none absolute"
        style={{
          left: u(SPILL_LEFT),
          top: u(CAP_Y_SETTLED),
          width: u(SPILL_W),
          height: u(SPILL_H),
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

      {/* KYOTO pouch — emerges out of the video (fade + grow), then tips over
          on scroll, swinging DOWN and OUT (TIP_DROP) so the cap clears the
          rectangle's bottom edge into the cream, per design. UNCLIPPED —
          stacked ABOVE the spill so the cap renders on top of the liquid
          pouring out of it — the pouch is meant to visibly leave the box
          both at rest (its natural overhang) and through the whole tip. */}
      <div
        className="pointer-events-none absolute"
        style={{ left: 0, top: 0, width: u(PANEL_W), height: u(SCENE_H), zIndex: 4 }}
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
            left: u(POUCH_CX),
            top: u(POUCH_CY),
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
      </div>
    </div>
  );
}
