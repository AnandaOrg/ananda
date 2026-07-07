"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Pinned-can scroll demo (MAMA-style flavour switching).
 *
 * One can stays pinned dead-centre for the whole scroll; each 100vh section is
 * a flavour. Scrolling between sections scrubs (scrub: 1, snap to sections):
 *   - a full 360° can rotation (procedural canvas placeholder — see drawCan for
 *     where a real 120-frame webp sequence plugs in),
 *   - a background colour crossfade,
 *   - the CTA pill's accent colour + label swap at the midpoint,
 *   - outgoing illustrations flying away from centre / incoming flying in with
 *     stagger and back.out overshoot — fully scrub-reversible.
 * Idle motion (can bob, illustration float, mouse parallax) is time-based and
 * independent of scroll. prefers-reduced-motion: spin → plain crossfade,
 * transitions → opacity-only, no parallax/idle; pin + snap stay.
 */

type Illo = {
  shape: "circle" | "ring" | "triangle" | "star" | "cross" | "squiggle";
  x: number; // % of stage width
  y: number; // % of stage height
  size: number; // px
  depth: number; // mouse-parallax depth, 0.2–0.8
  rotate?: number; // deg
};

type Flavor = {
  name: string;
  bg: string;
  accent: string;
  /** REAL ASSETS: folder of this flavour's 120-frame rotation sequence, e.g.
   *  "/frames/flavor-0/" holding frame-0000.webp … frame-0119.webp. Preload it
   *  when the flavour is one section away (see preloadSequence below). */
  frames: string;
  illos: Illo[];
};

const FLAVORS: Flavor[] = [
  {
    name: "Lime Rush",
    bg: "#17a06b",
    accent: "#0b6b45",
    frames: "/frames/flavor-0/",
    illos: [
      { shape: "circle", x: 12, y: 18, size: 90, depth: 0.6 },
      { shape: "ring", x: 82, y: 14, size: 120, depth: 0.3 },
      { shape: "triangle", x: 8, y: 68, size: 110, depth: 0.8, rotate: -18 },
      { shape: "star", x: 88, y: 60, size: 80, depth: 0.5, rotate: 12 },
      { shape: "squiggle", x: 24, y: 42, size: 130, depth: 0.2, rotate: 8 },
      { shape: "cross", x: 72, y: 82, size: 60, depth: 0.7, rotate: 20 },
    ],
  },
  {
    name: "Mango Sun",
    bg: "#f8b70f",
    accent: "#d9760a",
    frames: "/frames/flavor-1/",
    illos: [
      { shape: "ring", x: 14, y: 22, size: 100, depth: 0.5 },
      { shape: "star", x: 84, y: 20, size: 95, depth: 0.7, rotate: -10 },
      { shape: "circle", x: 10, y: 74, size: 70, depth: 0.3 },
      { shape: "squiggle", x: 80, y: 70, size: 140, depth: 0.4, rotate: -14 },
      { shape: "cross", x: 26, y: 50, size: 55, depth: 0.8, rotate: 45 },
      { shape: "triangle", x: 70, y: 40, size: 85, depth: 0.2, rotate: 30 },
    ],
  },
  {
    name: "Berry Wave",
    bg: "#1f5fcd",
    accent: "#123f95",
    frames: "/frames/flavor-2/",
    illos: [
      { shape: "squiggle", x: 12, y: 16, size: 130, depth: 0.4, rotate: -6 },
      { shape: "circle", x: 86, y: 24, size: 85, depth: 0.6 },
      { shape: "star", x: 10, y: 60, size: 90, depth: 0.2, rotate: 18 },
      { shape: "ring", x: 82, y: 66, size: 110, depth: 0.8 },
      { shape: "cross", x: 30, y: 80, size: 60, depth: 0.5, rotate: 12 },
      { shape: "triangle", x: 68, y: 12, size: 75, depth: 0.3, rotate: -24 },
    ],
  },
  {
    name: "Pink Guava",
    bg: "#ff6ba9",
    accent: "#d63a7e",
    frames: "/frames/flavor-3/",
    illos: [
      { shape: "star", x: 14, y: 14, size: 85, depth: 0.7, rotate: -8 },
      { shape: "squiggle", x: 82, y: 18, size: 125, depth: 0.3, rotate: 10 },
      { shape: "ring", x: 8, y: 66, size: 105, depth: 0.5 },
      { shape: "circle", x: 88, y: 72, size: 75, depth: 0.2 },
      { shape: "triangle", x: 26, y: 44, size: 95, depth: 0.4, rotate: 14 },
      { shape: "cross", x: 74, y: 86, size: 55, depth: 0.8, rotate: -30 },
    ],
  },
];

const N = FLAVORS.length;
const FRAMES = 120; // frames per full 360° rotation
const CAN_W = 300; // canvas CSS px
const CAN_H = 460;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const mixHex = (a: string, b: string, t: number) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const m = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
};

/* REAL ASSETS: warm a flavour's frame sequence when it is one section away.
   Store the resolved images per flavour and drawImage(frames[i], …) in drawCan
   instead of the procedural placeholder.

async function preloadSequence(fl: Flavor): Promise<HTMLImageElement[]> {
  return Promise.all(
    Array.from({ length: FRAMES }, (_, k) => new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.src = `${fl.frames}frame-${String(k).padStart(4, "0")}.webp`;
      img.onload = () => resolve(img);
    }))
  );
}
*/

/** Placeholder geometric illustration. Swap for real SVG/PNG art per flavour. */
function Shape({ illo, color }: { illo: Illo; color: string }) {
  const s = illo.size;
  const common = { width: s, height: s, viewBox: "0 0 100 100", "aria-hidden": true as const };
  const body = (() => {
    switch (illo.shape) {
      case "circle":
        return <circle cx="50" cy="50" r="42" fill={color} />;
      case "ring":
        return <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="12" />;
      case "triangle":
        return <polygon points="50,10 92,84 8,84" fill={color} />;
      case "star":
        return <polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38" fill={color} />;
      case "cross":
        return (
          <g fill={color}>
            <rect x="40" y="8" width="20" height="84" rx="8" />
            <rect x="8" y="40" width="84" height="20" rx="8" />
          </g>
        );
      case "squiggle":
        return <path d="M6 60 Q 22 24 40 52 T 72 48 T 96 40" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />;
    }
  })();
  return (
    <svg {...common} style={{ display: "block", transform: illo.rotate ? `rotate(${illo.rotate}deg)` : undefined }}>
      {body}
    </svg>
  );
}

export default function PinnedCanDemo() {
  const mainRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const bobRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // fly layer per illustration, grouped by flavour — the scrubbed fly-in/out target
  const flyRefs = useRef<(HTMLDivElement | null)[][]>(FLAVORS.map(() => []));
  // idle float layer per illustration (time-based, nested inside the fly layer)
  const idleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const mainEl = mainRef.current;
    const stage = stageRef.current;
    const bg = bgRef.current;
    const canvas = canvasRef.current;
    const cta = ctaRef.current;
    if (!mainEl || !stage || !bg || !canvas || !cta) return;
    const c2d = canvas.getContext("2d");
    if (!c2d) return;

    let ctx: gsap.Context | null = null;
    let cleanupFns: (() => void)[] = [];

    const build = () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // ── Canvas: DPR-aware sizing ──────────────────────────────────────────
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(CAN_W * dpr);
      canvas.height = Math.round(CAN_H * dpr);
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      let lastKey = "";
      /** Procedural placeholder can. REAL ASSETS: replace the drawing below
       *  with c2d.drawImage(sequences[pair][frame], 0, 0, CAN_W, CAN_H) once
       *  the webp sequences exist (see preloadSequence above). */
      const drawCan = (pair: number, local: number) => {
        const frame = Math.round(local * (FRAMES - 1));
        const key = reduce ? `${pair}:${Math.round(local * 200)}` : `${pair}:${frame}`;
        if (key === lastKey) return; // draw only when the frame actually changes
        lastKey = key;

        const fA = FLAVORS[pair];
        const fB = FLAVORS[Math.min(pair + 1, N - 1)];
        const theta = reduce ? 0 : (frame / FRAMES) * Math.PI * 2;
        // texture crossfade midway through the spin (frames 40–80), or a plain
        // full-transition crossfade under reduced motion
        const blend = reduce ? local : smooth(clamp01((frame - 40) / 40));
        const label = mixHex(fA.accent, fB.accent, blend);
        const name = blend < 0.5 ? fA.name : fB.name;

        const cx = CAN_W / 2;
        const top = 26;
        const bodyW = 192;
        const bodyH = 402;
        const r = bodyW / 2;

        c2d.clearRect(0, 0, CAN_W, CAN_H);

        // body — brushed metal
        const metal = c2d.createLinearGradient(cx - r, 0, cx + r, 0);
        metal.addColorStop(0, "#c7c7cf");
        metal.addColorStop(0.28, "#f2f2f5");
        metal.addColorStop(0.55, "#dcdce2");
        metal.addColorStop(1, "#b9b9c2");
        c2d.beginPath();
        c2d.roundRect(cx - r, top + 12, bodyW, bodyH, 30);
        c2d.fillStyle = metal;
        c2d.fill();

        // label band (clipped to the body)
        c2d.save();
        c2d.clip();
        c2d.fillStyle = label;
        c2d.fillRect(cx - r, top + 76, bodyW, 268);

        // rotating dot motifs — sell the spin by orbiting the band
        for (let k = 0; k < 6; k++) {
          const ang = theta + (k * Math.PI * 2) / 6;
          const cos = Math.cos(ang);
          if (cos <= 0.08) continue; // behind the can
          c2d.beginPath();
          c2d.ellipse(cx + Math.sin(ang) * r * 0.78, top + 108, 7 * cos, 7, 0, 0, Math.PI * 2);
          c2d.fillStyle = "rgba(255, 255, 255, 0.55)";
          c2d.fill();
        }

        // name — horizontal sine-shift + width squash fakes the rotation
        const cosT = reduce ? 1 : Math.cos(theta);
        if (cosT > 0.06) {
          c2d.save();
          c2d.translate(cx + Math.sin(theta) * r * 0.55, top + 218);
          c2d.scale(Math.max(0.12, cosT), 1);
          c2d.fillStyle = "#ffffff";
          c2d.textAlign = "center";
          c2d.font = "800 29px Arial, sans-serif";
          c2d.fillText(name.toUpperCase(), 0, 0);
          c2d.font = "600 13px Arial, sans-serif";
          c2d.fillStyle = "rgba(255, 255, 255, 0.75)";
          c2d.fillText("SPARKLING COCKTAIL", 0, 26);
          c2d.restore();
        }
        c2d.restore();

        // lid
        c2d.beginPath();
        c2d.ellipse(cx, top + 14, r - 6, 13, 0, 0, Math.PI * 2);
        c2d.fillStyle = "#aeaeb8";
        c2d.fill();
        c2d.beginPath();
        c2d.ellipse(cx, top + 12, r - 14, 9, 0, 0, Math.PI * 2);
        c2d.fillStyle = "#d4d4db";
        c2d.fill();

        // standing highlight
        const shine = c2d.createLinearGradient(cx - r * 0.55, 0, cx - r * 0.25, 0);
        shine.addColorStop(0, "rgba(255, 255, 255, 0)");
        shine.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
        shine.addColorStop(1, "rgba(255, 255, 255, 0)");
        c2d.fillStyle = shine;
        c2d.fillRect(cx - r * 0.55, top + 20, r * 0.3, bodyH - 20);
      };

      // fly-out/in vector: straight away from the stage centre, far enough to
      // clear the viewport
      const dist = Math.max(window.innerWidth, window.innerHeight) * 0.75;
      const flyVec = (il: Illo) => {
        const dx = il.x - 50;
        const dy = il.y - 50;
        const len = Math.hypot(dx, dy) || 1;
        return { x: (dx / len) * dist, y: (dy / len) * dist };
      };

      ctx = gsap.context(() => {
        const flat = (s: number) =>
          flyRefs.current[s].filter((el): el is HTMLDivElement => el !== null);

        // ── Initial states ──────────────────────────────────────────────────
        FLAVORS.forEach((fl, s) => {
          const lab = labelRefs.current[s];
          if (lab) gsap.set(lab, { opacity: s === 0 ? 1 : 0, y: s === 0 ? 0 : 10 });
          if (s !== 0) {
            flat(s).forEach((el, j) => {
              const v = flyVec(fl.illos[j]);
              gsap.set(el, reduce ? { opacity: 0 } : { x: v.x, y: v.y, scale: 0.6, opacity: 0 });
            });
          }
        });
        drawCan(0, 0);

        // ── Master scrubbed timeline: one pin, one trigger ─────────────────
        const proxy = { t: 0 };
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: mainEl,
            start: "top top",
            end: "bottom bottom",
            pin: stage,
            pinSpacing: false,
            scrub: 1,
            snap: { snapTo: 1 / (N - 1), duration: 0.6, ease: "power2.inOut" },
            invalidateOnRefresh: true,
          },
        });

        // can rotation driver — one tween over the whole scroll; the canvas
        // redraws only when the rounded frame index changes
        tl.to(
          proxy,
          {
            t: N - 1,
            duration: N - 1,
            onUpdate() {
              const pair = Math.min(N - 2, Math.floor(proxy.t));
              drawCan(pair, proxy.t - pair);
            },
          },
          0
        );

        // per-section-pair choreography, ranges computed from the pair index
        for (let i = 0; i < N - 1; i++) {
          const next = FLAVORS[i + 1];

          // background + CTA colour crossfade across the whole pair range
          tl.to(bg, { backgroundColor: next.bg, duration: 1 }, i);
          tl.to(cta, { backgroundColor: next.accent, duration: 1 }, i);

          // CTA label swap at the 50% point
          const labOut = labelRefs.current[i];
          const labIn = labelRefs.current[i + 1];
          if (labOut) tl.to(labOut, { opacity: 0, y: -10, duration: 0.35, ease: "power1.in" }, i + 0.1);
          if (labIn) {
            tl.fromTo(
              labIn,
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.35, ease: "power1.out", immediateRender: false },
              i + 0.55
            );
          }

          // illustrations: out during the first half, in during the second —
          // scrubbed, so scrolling back reverses them perfectly
          const out = flat(i);
          const inn = flat(i + 1);
          const step = 0.22 / Math.max(out.length, 1); // ≈0.037 for 6 items
          out.forEach((el, j) => {
            const v = flyVec(FLAVORS[i].illos[j]);
            if (reduce) tl.to(el, { opacity: 0, duration: 0.4 }, i + j * 0.01);
            else tl.to(el, { x: v.x, y: v.y, scale: 0.6, opacity: 0, duration: 0.26, ease: "power2.in" }, i + j * step);
          });
          inn.forEach((el, j) => {
            const v = flyVec(FLAVORS[i + 1].illos[j]);
            if (reduce) {
              tl.to(el, { opacity: 1, duration: 0.4, immediateRender: false }, i + 0.55 + j * 0.01);
            } else {
              tl.fromTo(
                el,
                { x: v.x, y: v.y, scale: 0.6, opacity: 0 },
                { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.26, ease: "back.out(1.4)", immediateRender: false },
                i + 0.55 + j * step
              );
            }
          });
        }

        // ── Idle motion — time-based, independent of scroll ─────────────────
        if (!reduce) {
          if (bobRef.current) {
            gsap.fromTo(bobRef.current, { y: -8 }, { y: 8, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
          }
          idleRefs.current.forEach((el) => {
            if (!el) return;
            gsap.to(el, {
              y: gsap.utils.random(-8, -14),
              duration: gsap.utils.random(3, 5),
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              delay: gsap.utils.random(0, 2),
            });
          });

          // mouse parallax on the [data-depth] layers, ±15px at depth 1
          const layers = Array.from(stage.querySelectorAll<HTMLElement>("[data-depth]"));
          const setters = layers.map((el) => ({
            x: gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" }),
            y: gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" }),
            d: parseFloat(el.dataset.depth || "0.5"),
          }));
          const onMove = (e: MouseEvent) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            setters.forEach((s) => {
              s.x(nx * 30 * s.d);
              s.y(ny * 30 * s.d);
            });
          };
          window.addEventListener("mousemove", onMove);
          cleanupFns.push(() => window.removeEventListener("mousemove", onMove));
        }
      }, mainEl);
    };

    const teardown = () => {
      cleanupFns.forEach((fn) => fn());
      cleanupFns = [];
      ctx?.revert();
      ctx = null;
    };

    build();

    // rebuild on resize: fly vectors and the DPR canvas are pixel-based
    let resizeId: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeId);
      resizeId = setTimeout(() => {
        teardown();
        build();
      }, 250);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(resizeId);
      window.removeEventListener("resize", onResize);
      teardown();
    };
  }, []);

  return (
    <main ref={mainRef} className="relative" style={{ fontFamily: "var(--font-body)" }}>
      {/* Pinned stage — everything visible lives here; the sections below only
          provide scroll length */}
      <div ref={stageRef} className="absolute inset-x-0 top-0 z-10 h-screen w-full overflow-hidden">
        <div ref={bgRef} className="absolute inset-0" style={{ backgroundColor: FLAVORS[0].bg }} />

        {/* Illustrations — one group per flavour; position → parallax → fly → idle */}
        {FLAVORS.map((fl, s) => (
          <div key={fl.name} className="pointer-events-none absolute inset-0">
            {fl.illos.map((il, j) => (
              <div key={j} className="absolute" style={{ left: `${il.x}%`, top: `${il.y}%`, transform: "translate(-50%, -50%)" }}>
                <div data-depth={il.depth}>
                  <div ref={(el) => { flyRefs.current[s][j] = el; }}>
                    <div ref={(el) => { idleRefs.current[s * 8 + j] = el; }}>
                      <Shape illo={il} color={j % 2 ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.18)"} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* The can — a single persistent element, never duplicated per section */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div ref={bobRef}>
            <canvas
              ref={canvasRef}
              role="img"
              aria-label="Rotating product can"
              style={{ width: CAN_W, height: CAN_H, display: "block" }}
            />
          </div>
        </div>

        {/* CTA pill — accent colour tweens, label swaps at the midpoint */}
        <button
          ref={ctaRef}
          type="button"
          className="absolute left-1/2 -translate-x-1/2 cursor-pointer rounded-full px-10 py-4 font-bold uppercase tracking-widest text-white"
          style={{ bottom: "7%", backgroundColor: FLAVORS[0].accent }}
        >
          <span className="grid text-center">
            {FLAVORS.map((fl, s) => (
              <span key={fl.name} ref={(el) => { labelRefs.current[s] = el; }} className="whitespace-nowrap" style={{ gridArea: "1 / 1" }}>
                Shop {fl.name}
              </span>
            ))}
          </span>
        </button>
      </div>

      {/* Scroll track: one 100vh section per flavour */}
      {FLAVORS.map((fl) => (
        <section key={fl.name} aria-hidden className="h-screen" />
      ))}
    </main>
  );
}
