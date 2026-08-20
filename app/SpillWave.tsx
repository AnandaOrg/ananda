"use client";

import { useEffect, useRef } from "react";

const LIQUID = "var(--fill-0, #EB4638)";
const BASE_Y = 323.123;
const PEAK_X = 621.107;

type Cubic = [number, number, number, number, number, number, number, number];

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

const SEGS: Cubic[] = RAW.flatMap((c) => {
  const [l, r] = splitCubic(c, 0.5);
  const [a, b] = splitCubic(l, 0.5);
  const [d, e] = splitCubic(r, 0.5);
  return [a, b, d, e];
});

const A1 = 24;
const WL1 = 380;
const T1 = 2.0;
const A2 = 10;
const WL2 = 170;
const T2 = 1.15;
const DECAY = 600;
const GLUG_DEPTH = 0.35;
const GLUG_T = 1.4;
const SURGE_A = 10;
const SURGE_T = 2.9;
const PEAK_CALM = 80;

const smooth = (t: number) => t * t * (3 - 2 * t);

function waveD(t: number): string {
  const k1 = (2 * Math.PI) / WL1;
  const k2 = (2 * Math.PI) / WL2;
  const ph1 = (2 * Math.PI * t) / T1;
  const ph2 = (2 * Math.PI * t) / T2;
  const glug = 1 + GLUG_DEPTH * Math.sin((2 * Math.PI * t) / GLUG_T);
  const surge = SURGE_A * Math.sin((2 * Math.PI * t) / SURGE_T);
  const dy = (x: number, y: number) => {
    const hf = Math.max(0, (BASE_Y - y) / BASE_Y);
    const r = Math.abs(x - PEAK_X);
    const pf = smooth(Math.min(1, r / PEAK_CALM));
    const decay = Math.exp(-r / DECAY);
    const ripple = A1 * Math.sin(k1 * r - ph1) + A2 * Math.sin(k2 * r - ph2 + 1.7);
    return (ripple * glug + surge) * pf * decay * hf;
  };
  const pt = (x: number, y: number) => `${x.toFixed(2)} ${(y + dy(x, y)).toFixed(2)}`;
  let d = `M${pt(SEGS[0][0], SEGS[0][1])}`;
  for (const [, , c1x, c1y, c2x, c2y, x1, y1] of SEGS) {
    d += `C${pt(c1x, c1y)} ${pt(c2x, c2y)} ${pt(x1, y1)}`;
  }
  return d + "Z";
}

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
    let last = 0;
    let sizeCheckAt = 0;
    let painted = false;
    const frameMs = window.matchMedia("(max-width: 767px)").matches ? 1000 / 30 : 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now >= sizeCheckAt) {
        sizeCheckAt = now + 400;
        painted = svg.getBoundingClientRect().width > 4;
      }
      if (!painted || now - last < frameMs) return;
      last = now;
      path.setAttribute("d", waveD((now - t0) / 1000));
    };
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
