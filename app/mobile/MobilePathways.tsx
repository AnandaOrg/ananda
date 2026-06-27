"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import { mu, MU_VAR } from "./scale";
import { useFlavor } from "../FlavorProvider";
import GlbViewer, { type GlbViewerHandle } from "../GlbViewer";

/** Mobile section 4 — "The Pathways to Bliss" (Figma 198:1787, 390×1176). */

type Crop = { width: string; height: string; left: string; top: string };
type FloatingProps = {
  src: string;
  alt: string;
  rotate: number;
  inner: { width: number; height: number };
  box?: { left: number; top: number; width: number; height: number };
  center?: { x: number; y: number; width: number; height: number };
  crop?: Crop;
  shadow?: boolean;
};

function Floating({ src, alt, rotate, inner, box, center, crop, shadow }: FloatingProps) {
  const place: React.CSSProperties = center
    ? { left: `calc(50% + ${mu(center.x)})`, top: `calc(50% + ${mu(center.y)})`, width: mu(center.width), height: mu(center.height), transform: "translate(-50%, -50%)" }
    : { left: mu(box!.left), top: mu(box!.top), width: mu(box!.width), height: mu(box!.height) };
  return (
    <div className="pointer-events-none absolute flex items-center justify-center" style={place}>
      <div style={{ transform: `rotate(${rotate}deg)` }}>
        <div className="relative overflow-hidden" style={{ width: mu(inner.width), height: mu(inner.height), boxShadow: shadow ? `${mu(4.911)} ${mu(3.571)} ${mu(12.812)} 0 rgba(0,0,0,0.25)` : undefined }}>
          {crop ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} className="absolute max-w-none" style={{ width: crop.width, height: crop.height, left: crop.left, top: crop.top }} />
          ) : (
            <Image src={src} alt={alt} fill sizes="50vw" className="object-cover" />
          )}
        </div>
      </div>
    </div>
  );
}

const BANDS = [
  { color: "#1f5fcd", top: 379.77 },
  { color: "#f8a20f", top: 579.77 },
  { color: "#14a06b", top: 776.23 },
  { color: "#eb4638", top: 976.23 },
];

const FLAVORS = [
  { label: "Santorini", left: -10.13, top: 419.89, width: 922.396, color: "#fff0e5" },
  { label: "Aloha", left: -10.13, top: 615.56, width: 615.744, color: "#eb4638" },
  { label: "Gaia", left: -10.13, top: 812.01, width: 405.195, color: "#fff0e5" },
  { label: "Kyoto", left: -12.13, top: 1012.01, width: 615.744, color: "#ff95ac" },
];

// Same models / cross-fade points as desktop Pathways (module-level = stable ref).
const GLB_MODELS = [
  { src: "/glb/santorini.glb" },
  { src: "/glb/aloha.glb", transitionAt: 0.247 },
  { src: "/glb/gaia.glb", transitionAt: 0.504 },
  { src: "/glb/kyoto.glb", transitionAt: 0.762 },
];

export default function MobilePathways() {
  const { open } = useFlavor();
  const glbRef = useRef<GlbViewerHandle>(null);
  // Fixed band-region reference — drives cross-fade/turntable progress; stays put
  // while the GLB canvas translates to ride the bands.
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mirror desktop Pathways: spin the bottle, then open the modal from the
  // bottle's centre once the spin reads, wiring the modal's nav/close back to
  // the GLB (reset tilt on close, 360° spin on nav).
  const openWithSpin = useCallback((i: number) => {
    // Beat 1: tilt to 90° AND start spinning at the same time.
    glbRef.current?.spin();
    glbRef.current?.spin360();
    const rect = glbRef.current?.getRect() ?? new DOMRect();
    const origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
    // Keep it spinning through the tilt so it's still spinning when it hits 90°.
    setTimeout(() => glbRef.current?.spin360(), 650);
    // Beat 2: at ~90° the still-spinning bottle becomes the modal — the modal
    // scales out of the captured position, its own bottle continuing the spin.
    setTimeout(() => open(i, origin,
      () => glbRef.current?.resetTilt(),
      () => glbRef.current?.spin360(),
    ), 1000);
  }, [open]);

  return (
    <section className="w-full bg-[#eb4638] md:hidden" style={{ containerType: "inline-size", ...MU_VAR }}>
      {/* Content layer — clipped (bands / names / fruit) */}
      <div className="relative overflow-hidden" style={{ width: mu(390), height: mu(1176) }}>
        {/* Colour bands (click to open flavour) */}
        {BANDS.map((b, i) => (
          <button key={b.color} type="button" aria-label={`Open ${FLAVORS[i].label}`} onClick={() => openWithSpin(i)} className="absolute cursor-pointer appearance-none border-0 p-0" style={{ left: 0, top: mu(b.top), width: mu(390), height: mu(200), backgroundColor: b.color }} />
        ))}

        {/* Giant flavour names */}
        {FLAVORS.map((f, i) => (
          <button
            key={f.label}
            type="button"
            onClick={() => openWithSpin(i)}
            className="absolute cursor-pointer appearance-none whitespace-nowrap border-0 bg-transparent p-0 text-left font-bold uppercase"
            style={{ left: mu(f.left), top: mu(f.top), width: mu(f.width), color: f.color, fontFamily: "var(--font-display)", fontSize: mu(200), lineHeight: 0.8, letterSpacing: mu(-16) }}
          >
            {f.label}
          </button>
        ))}

        {/* Heading + see-flavors pill */}
        <div className="absolute flex flex-col items-start" style={{ left: mu(24), top: mu(43), width: mu(276.93), gap: mu(24) }}>
          <div className="flex flex-col items-start uppercase text-[#fff0e5]" style={{ gap: mu(16) }}>
            <p className="whitespace-nowrap" style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}>
              [02] Choose your ANANDA
            </p>
            <p className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: mu(64), lineHeight: 0.8, letterSpacing: mu(-5.12), width: mu(276.93) }}>
              The Pathways to Bliss
            </p>
          </div>
          <button type="button" onClick={() => openWithSpin(0)} className="flex cursor-pointer appearance-none items-center justify-center overflow-hidden border-0 bg-[#fff0e5]" style={{ padding: `${mu(8)} ${mu(12)}`, borderRadius: mu(25.016) }}>
            <div className="flex items-center" style={{ gap: mu(7.505) }}>
              <span className="font-semibold uppercase text-[#eb4638]" style={{ fontFamily: "var(--font-display)", fontSize: mu(20), lineHeight: 0.8, letterSpacing: mu(-1.4), textBoxTrim: "trim-both", textBoxEdge: "cap alphabetic" } as React.CSSProperties}>
                see flavors
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/s4-arrow.svg" alt="" style={{ width: mu(7.822), height: mu(15.404) }} />
            </div>
          </button>
        </div>

        {/* Mango */}
        <Floating src="/s4-mango.png" alt="Ripe mango" rotate={-7.55} box={{ left: -10.13, top: 514.54, width: 152.327, height: 173.139 }} inner={{ width: 132.855, height: 157.054 }} crop={{ width: "143.08%", height: "181.55%", left: "-22.78%", top: "-36.97%" }} />
        {/* Lychee */}
        <Floating src="/s4-raspberry.png" alt="Fresh lychee" rotate={46.6} box={{ left: 25.53, top: 1066.39, width: 131.528, height: 131.411 }} inner={{ width: 91.51, height: 94.488 }} />
        {/* Lemon */}
        <Floating src="/s4-lemon.png" alt="Fresh lemon with leaves" rotate={-8.95} box={{ left: 221.52, top: 260.19, width: 173.549, height: 199.915 }} inner={{ width: 147.461, height: 179.146 }} crop={{ width: "134.65%", height: "166.26%", left: "-22.14%", top: "-38.75%" }} />
        {/* Elderflower */}
        <Floating src="/s4-flowers.png" alt="White elderflower blossom" rotate={15.25} box={{ left: 230.24, top: 699.44, width: 179.055, height: 192.905 }} inner={{ width: 141.609, height: 161.344 }} />
        {/* Fixed band-region reference for the scroll progress (invisible). */}
        <div ref={scrollRef} aria-hidden className="pointer-events-none absolute" style={{ left: 0, top: mu(360), width: mu(1), height: mu(816), visibility: "hidden" }} />
      </div>

      {/* GLB overlay — NOT clipped by the content box; renders in front. The
          model stays centred in a square canvas (never reaches the framebuffer
          edge); the canvas CSS-translates down to ride the bands. */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{ width: mu(390), height: mu(1176), zIndex: 50 }}
      >
        <GlbViewer
          ref={glbRef}
          models={GLB_MODELS}
          transitionDuration={0.04}
          scrollRef={scrollRef}
          scrollTravel={mu(596.46)}
          style={{
            position: "absolute",
            left: `calc(50% - ${mu(408)})`,
            top: mu(72),
            width: mu(816),
            height: mu(816),
            pointerEvents: "none",
          }}
        />
      </div>
    </section>
  );
}
