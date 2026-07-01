"use client";

import { useEffect, useRef } from "react";
import ScrollVideoCanvas from "./ScrollVideoCanvas";
import GlbViewer, { type GlbViewerHandle } from "./GlbViewer";

/**
 * Section 3 — the kyoto "pour" video loops at rest. As you scroll past it, the
 * video hands off to the 3-D KYOTO pouch (kyoto.glb): the video fades out while
 * the GLB — sized and placed to match the video's pouch — fades in at the same
 * spot, then literally comes OUT of the video (scales/lifts toward the viewer)
 * and rotates from 90° (lying) down to 0° (upright). Scroll-scrubbed (reverses).
 * Only ONE pouch is ever prominent: the video's, until the GLB takes over.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const KYOTO = [{ src: "/glb/kyoto.glb" }];

// ── Tunables (eyeball in dev) ──────────────────────────────────────────────
// The model's UPRIGHT (visual 0°) is rotation.z = -π/2 (same as Pathways), and a
// quarter-turn from there (rotation.z = 0) is visual 90° (lying). So we scrub the
// tilt from 0 (90° lying) → -π/2 (0° upright).
const TILT_LYING = 0;              // visual 90°
const TILT_UPRIGHT = -Math.PI / 2; // visual 0°
const LIFT_U = 150;             // how far (design px) it rises as it comes out
const GROW = 0.12;              // extra scale as it pops out of the video
const HANDOFF = 0.18;           // p over which the video→GLB cross-fade completes
// Scroll window: emerge runs as the video's centre travels FROM→TO of viewport height.
const FROM = 0.55; // ~video fully shown
const TO = 0.12;
// Where the pouch sits inside the 789×906 video box (matches the 2-D pouch).
const POUCH_X = "50%";
const POUCH_Y = "67%";

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
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const glbRef = useRef<GlbViewerHandle>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoWrapRef.current;
    const lift = liftRef.current;
    if (!wrap || !video || !lift) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const centerY = rect.top + rect.height / 2;
      const p = clamp((FROM * vh - centerY) / ((FROM - TO) * vh), 0, 1);

      // Hand off: video fades out, the matched 3-D pouch fades in (one pouch).
      const fade = clamp(p / HANDOFF, 0, 1);
      video.style.opacity = String(1 - fade);
      lift.style.opacity = String(fade);

      // Come OUT of the video: rise + grow toward the viewer.
      const scale = 1 + GROW * p;
      lift.style.transform = `translateY(calc(var(--u) * ${(-LIFT_U * p).toFixed(2)})) scale(${scale.toFixed(3)})`;

      // Rotate from 90° (lying) down to 0° (upright).
      glbRef.current?.setTilt(TILT_LYING + (TILT_UPRIGHT - TILT_LYING) * p);
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="absolute" style={{ left: u(posLeft), top: u(posTop), width: u(789.24), height: u(905.94) }}>
      {/* Looping pour video — fades out as the 3-D pouch takes over */}
      <div ref={videoWrapRef} className="absolute inset-0 flex items-center justify-center" style={{ willChange: "opacity" }}>
        <div style={{ transform: "rotate(-0.64deg)" }}>
          <ScrollVideoCanvas
            frameBase="/frames/kyoto/"
            frameCount={78}
            alt="Pouring a chilled ANANDA cocktail"
            autoLoop
            style={{ width: u(779.28), height: u(897.12), overflow: "hidden" }}
          />
        </div>
      </div>

      {/* 3-D pouch — sized/placed to match the video pouch, then comes out + rotates */}
      <div
        ref={liftRef}
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0, zIndex: 5, transformOrigin: `${POUCH_X} ${POUCH_Y}`, willChange: "transform, opacity" }}
      >
        <GlbViewer
          ref={glbRef}
          models={KYOTO}
          noScroll
          initialTilt={TILT_LYING}
          style={{
            position: "absolute",
            left: POUCH_X,
            top: POUCH_Y,
            transform: "translate(-50%, -50%)",
            width: u(640),
            height: u(1073),
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
