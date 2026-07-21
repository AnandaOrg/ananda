"use client";

import { useEffect, useRef } from "react";

/**
 * The red c-wave spill as LIVING LIQUID, moving like a POUR: the peak
 * (x ≈ 621, pinned to the pouch cap) is where the stream lands, and the
 * surface behaves the way a glass being filled does — ripples radiate
 * OUTWARD from that impact point toward both edges, strongest near the
 * impact and dying out with distance, while the whole mound surges in slow
 * "glugs" like liquid actually arriving in pulses.
 *
 * The path is re-computed every frame from the original `public/c-wave.svg`
 * outline. Because the original has only ~10 anchor points (too coarse for
 * visible ripples), each of its cubics is SUBDIVIDED 4× at module init —
 * de Casteljau splits, so the resting silhouette is bit-identical — and the
 * ripple field displaces the dense control net. The vertical offset is
 *
 * - damped to zero at the BASE (y = 323) so the bottom edge stays welded to
 *   the seam / the section below, and
 * - damped to zero right at the PEAK so the pointy spout tip never detaches
 *   from the cap.
 *
 * No decorative elements — just the c-wave shape, moving. Runs on rAF only
 * while on screen (IntersectionObserver) and not at all under
 * `prefers-reduced-motion`, where the static original path renders instead.
 * Stretch-safe: the host scales this non-uniformly
 * (`preserveAspectRatio="none"`), same as the old <img>.
 */

const LIQUID = "var(--fill-0, #EB4638)";
const BASE_Y = 323.123;
const PEAK_X = 621.107;

/** One cubic segment: p0x, p0y, c1x, c1y, c2x, c2y, p1x, p1y. */
type Cubic = [number, number, number, number, number, number, number, number];

// The c-wave's top boundary, left corner → crest → right corner, as cubics
// (the spout's `L` is a degenerate cubic with collinear controls). The bottom
// edge is the implicit `Z` back to the start.
const RAW: Cubic[] = [
  [0, BASE_Y, 24.2003, 288.685, 100.803, 215.618, 213.614, 198.864],
  [213.614, 198.864, 354.628, 177.922, 390.928, 59.2469, 515.188, 59.247],
  [515.188, 59.247, 614.596, 59.2471, 618.039, 23.8773, 607.335, 6.19234],
  [607.335, 6.19234, 611.926, 4.128, 616.516, 2.0641, 621.107, 0],
  [621.107, 0, 622.432, 41.9671, 668.347, 18.4941, 692.081, 46.4176],
  [692.081, 46.4176, 715.816, 74.341, 745.65, 130.723, 849.844, 126.023],
  [849.844, 126.023, 1042.34, 117.338, 1066.67, 212.826, 1230.03, 225.391],
  [1230.03, 225.391, 1360.71, 235.444, 1440.85, 294.735, 1464.58, BASE_Y],
];

/** de Casteljau split of a cubic at t. */
function splitCubic(c: Cubic, t: number): [Cubic, Cubic] {
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const [x0, y0, x1, y1, x2, y2, x3, y3] = c;
  const ax = lerp(x0, x1), ay = lerp(y0, y1);
  const bx = lerp(x1, x2), by = lerp(y1, y2);
  const cx = lerp(x2, x3), cy = lerp(y2, y3);
  const dx = lerp(ax, bx), dy = lerp(ay, by);
  const ex = lerp(bx, cx), ey = lerp(by, cy);
  const px = lerp(dx, ex), py = lerp(dy, ey);
  return [
    [x0, y0, ax, ay, dx, dy, px, py],
    [px, py, ex, ey, cx, cy, x3, y3],
  ];
}

// 8 raw cubics × 4 = 32 segments — enough control density for the ripple
// wavelengths below to actually show in the crest.
const SEGS: Cubic[] = RAW.flatMap((c) => {
  const [l, r] = splitCubic(c, 0.5);
  const [a, b] = splitCubic(l, 0.5);
  const [d, e] = splitCubic(r, 0.5);
  return [a, b, d, e];
});

// ── Pour tunables (viewBox units / seconds) ────────────────────────────────
// Ripples radiating out from the impact point (both use distance-from-peak,
// so they always travel AWAY from the pour on both sides).
// NOTE: amplitudes are sized for how the hosts STRETCH this SVG (wide, flat
// boxes squash the humps) — they need to look overdone in the raw viewBox to
// read as liquid on screen.
const A1 = 24; // primary ripple amplitude
const WL1 = 380; // primary ripple wavelength
const T1 = 2.0; // primary ripple period — outward speed = WL1 / T1
const A2 = 10; // secondary chop amplitude
const WL2 = 170; // secondary chop wavelength
const T2 = 1.15; // secondary chop period
const DECAY = 600; // e-fold distance — ripples die out this far from the pour
const GLUG_DEPTH = 0.35; // how much the pour pulses (0 = steady stream)
const GLUG_T = 1.4; // seconds per glug
const SURGE_A = 10; // slow heave of the mound as liquid accumulates
const SURGE_T = 2.9; // heave period
const PEAK_CALM = 80; // reach (±x) of the still zone that pins the spout tip

const smooth = (t: number) => t * t * (3 - 2 * t);

/** The c-wave path at time `t` (seconds) with the pour rippling through it. */
function waveD(t: number): string {
  const k1 = (2 * Math.PI) / WL1;
  const k2 = (2 * Math.PI) / WL2;
  const ph1 = (2 * Math.PI * t) / T1;
  const ph2 = (2 * Math.PI * t) / T2;
  const glug = 1 + GLUG_DEPTH * Math.sin((2 * Math.PI * t) / GLUG_T);
  const surge = SURGE_A * Math.sin((2 * Math.PI * t) / SURGE_T);
  const dy = (x: number, y: number) => {
    // Crest moves most, base not at all…
    const hf = Math.max(0, (BASE_Y - y) / BASE_Y);
    // …the spout tip stays pinned to the cap…
    const r = Math.abs(x - PEAK_X);
    const pf = smooth(Math.min(1, r / PEAK_CALM));
    // …and everything fades with distance from where the stream lands.
    const decay = Math.exp(-r / DECAY);
    const ripple = A1 * Math.sin(k1 * r - ph1) + A2 * Math.sin(k2 * r - ph2 + 1.7);
    return (ripple * glug + surge) * pf * decay * hf;
  };
  const pt = (x: number, y: number) => `${x.toFixed(2)} ${(y + dy(x, y)).toFixed(2)}`;
  let d = `M${pt(SEGS[0][0], SEGS[0][1])}`;
  for (const [, , c1x, c1y, c2x, c2y, x1, y1] of SEGS) {
    d += `C${pt(c1x, c1y)} ${pt(c2x, c2y)} ${pt(x1, y1)}`;
  }
  // Z closes straight back across the base — the bottom edge.
  return d + "Z";
}

// Pristine original outline (what public/c-wave.svg draws) — the SSR /
// reduced-motion shape. The rAF loop takes over from here.
const STATIC_D =
  "M515.188 59.247C614.596 59.2471 618.039 23.8773 607.335 6.19234L621.107 0C622.432 41.9671 668.347 18.4941 692.081 46.4176C715.816 74.341 745.65 130.723 849.844 126.023C1042.34 117.338 1066.67 212.826 1230.03 225.391C1360.71 235.444 1440.85 294.735 1464.58 323.123H0C24.2003 288.685 100.803 215.618 213.614 198.864C354.628 177.922 390.928 59.2469 515.188 59.247Z";

export default function SpillWave() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!svg || !path) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let running = false;
    const t0 = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      path.setAttribute("d", waveD((now - t0) / 1000));
    };
    // Ripple only while on screen — two instances (desktop + mobile twin) are
    // mounted at once and there's no point morphing an off-screen path.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(tick);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(svg);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      overflow="visible"
      style={{ display: "block" }}
      viewBox="0 0 1464.58 323.123"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path ref={pathRef} d={STATIC_D} fill={LIQUID} />
    </svg>
  );
}
