"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import { useFlavor } from "./FlavorProvider";
import GlbViewer, { type GlbViewerHandle } from "./GlbViewer";

/**
 * Section 4 — "The Pathways to Bliss" flavor poster (Figma node 76:9304, a
 * 1440×2000 frame on a red field). Same width-scaling approach as the collage:
 * one design unit `--u = 100cqw / 1440`, every length `calc(var(--u) * figma-px)`,
 * rotations/percentage crops carried over verbatim.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;

type Box = { left: number; top: number; width: number; height: number };
type Center = { x: number; y: number; width: number; height: number };
type Crop = { width: string; height: string; left: string; top: string };

type FloatingProps = {
  src: string;
  alt: string;
  rotate: number;
  inner: { width: number; height: number };
  box?: Box;
  center?: Center;
  crop?: Crop;
  shadow?: boolean;
  sizes?: string;
};

/** A rotated, optionally cropped image placed by box or by centre offset. */
function Floating({ src, alt, rotate, inner, box, center, crop, shadow, sizes }: FloatingProps) {
  const place: React.CSSProperties = center
    ? {
        left: `calc(50% + ${u(center.x)})`,
        top: `calc(50% + ${u(center.y)})`,
        width: u(center.width),
        height: u(center.height),
        transform: "translate(-50%, -50%)",
      }
    : {
        left: u(box!.left),
        top: u(box!.top),
        width: u(box!.width),
        height: u(box!.height),
      };

  return (
    <div className="pointer-events-none absolute flex items-center justify-center" style={place}>
      <div style={{ transform: `rotate(${rotate}deg)` }}>
        <div
          className="relative overflow-hidden"
          style={{
            width: u(inner.width),
            height: u(inner.height),
            boxShadow: shadow ? `${u(11)} ${u(8)} ${u(28.7)} 0 rgba(0,0,0,0.25)` : undefined,
          }}
        >
          {crop ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              className="absolute max-w-none"
              style={{ width: crop.width, height: crop.height, left: crop.left, top: crop.top }}
            />
          ) : (
            <Image src={src} alt={alt} fill sizes={sizes ?? "40vw"} className="object-cover" />
          )}
        </div>
      </div>
    </div>
  );
}

// Stable reference — must live outside the component to avoid useEffect re-runs
const GLB_MODELS = [
  { src: "/glb/santorini.glb" },
  { src: "/glb/aloha.glb",    transitionAt: 0.247 },
  { src: "/glb/gaia.glb",     transitionAt: 0.504 },
  { src: "/glb/kyoto.glb",    transitionAt: 0.762 },
];

const BANDS = [
  { color: "#1f5fcd", top: 706.75 },
  { color: "#f8a20f", top: 1028.46 },
  { color: "#14a06b", top: 1350.17 },
  { color: "#eb4638", top: 1671.89 },
];

const FLAVORS = [
  { label: "Santorini", left: -11.32, top: 762.6, width: 1458.699, color: "#fff0e5" },
  { label: "Aloha", left: -11.32, top: 1084.32, width: 947.533, color: "#eb4638" },
  { label: "Gaia", left: -23.03, top: 1410.63, width: 947.533, color: "#fff0e5" },
  { label: "Kyoto", left: -11.32, top: 1736.95, width: 947.533, color: "#ff95ac" },
];

export default function Pathways() {
  const { open } = useFlavor();
  const glbRef = useRef<GlbViewerHandle>(null);

  const openWithSpin = useCallback((i: number) => {
    glbRef.current?.spin();
    // Capture GLB centre now (before any scroll shift during the delay)
    const rect = glbRef.current?.getRect() ?? new DOMRect();
    const origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
    setTimeout(() => open(i, origin,
      () => glbRef.current?.resetTilt(),
      () => glbRef.current?.spin360(),
    ), 500);
  }, [open]);

  return (
    <section
      className="relative w-full overflow-hidden bg-[#eb4638]"
      style={{ containerType: "inline-size" }}
    >
      <div
        className="relative mx-auto"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), height: u(2000) }}
      >
        {/* Eyebrow label */}
        <div className="absolute" style={{ left: u(81.75), top: u(212.79), padding: `${u(10)} ${u(14)}` }}>
          <p
            className="whitespace-nowrap uppercase text-[#fff0e5]"
            style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98) }}
          >
            [02] Choose your ANANDA
          </p>
        </div>

        {/* Headline */}
        <p
          className="absolute font-bold uppercase text-[#fff0e5]"
          style={{
            left: u(95.75),
            top: u(297.49),
            width: u(1102.287),
            fontFamily: "var(--font-display)",
            fontSize: u(180),
            lineHeight: 0.8,
            letterSpacing: u(-14.4),
          }}
        >
          The Pathways to Bliss
        </p>

        {/* Colour bands (click to open flavour) */}
        {BANDS.map((b, i) => (
          <button
            key={b.color + b.top}
            type="button"
            aria-label={`Open ${FLAVORS[i].label}`}
            onClick={() => openWithSpin(i)}
            className="absolute cursor-pointer appearance-none border-0 p-0"
            style={{ left: u(-1.97), top: u(b.top), width: u(1477), height: u(321.713), backgroundColor: b.color }}
          />
        ))}

        {/* Giant flavour names (over the bands) */}
        {FLAVORS.map((f, i) => (
          <button
            key={f.label}
            type="button"
            onClick={() => openWithSpin(i)}
            className="absolute cursor-pointer appearance-none whitespace-nowrap border-0 bg-transparent p-0 text-left font-bold uppercase"
            style={{
              left: u(f.left),
              top: f.top != null ? u(f.top) : undefined,
              width: u(f.width),
              color: f.color,
              fontFamily: "var(--font-display)",
              fontSize: u(350.179),
              lineHeight: 0.8,
              letterSpacing: u(-28.0143),
            }}
          >
            {f.label}
          </button>
        ))}

        {/* Lemon — top right */}
        <Floating
          src="/s4-lemon.png"
          alt="Fresh lemon with leaves"
          rotate={-8.95}
          box={{ left: 1091.12, top: 511.44, width: 383.906, height: 442.232 }}
          inner={{ width: 326.198, height: 396.289 }}
          crop={{ width: "134.65%", height: "166.26%", left: "-22.14%", top: "-38.75%" }}
        />

        {/* Mango — left, over Aloha */}
        <Floating
          src="/s4-mango.png"
          alt="Ripe mango"
          rotate={-7.55}
          box={{ left: 34.77, top: 841.33, width: 336.961, height: 383 }}
          inner={{ width: 293.887, height: 347.418 }}
          crop={{ width: "143.08%", height: "181.55%", left: "-22.78%", top: "-36.97%" }}
        />

        {/* Santorini GLB — replaced by 3-D viewer */}

        {/* Elderflower — right, over Gaia */}
        <Floating
          src="/s4-flowers.png"
          alt="White elderflower blossom"
          rotate={15.25}
          box={{ left: 830.64, top: 1171.01, width: 396.087, height: 426.724 }}
          inner={{ width: 313.253, height: 356.907 }}
        />

        {/* Raspberry — lower left, over Kyoto */}
        <Floating
          src="/s4-raspberry.png"
          alt="Fresh raspberry"
          rotate={46.6}
          box={{ left: 232.63, top: 1751.43, width: 290.952, height: 290.693 }}
          inner={{ width: 202.429, height: 209.017 }}
        />

        {/* Kyoto GLB — replaced by 3-D viewer */}

        {/* 3-D viewer — model tracks viewport centre through all 4 bands.
            Canvas top u(720) → bottom u(1970); Gaia/Kyoto boundary is at 76 % of canvas.
            transitionAt=0.765 fires just after that boundary; 0.04 window = crisp cut.
            u(1250) is the minimum height to reach Kyoto centre (u 1832) without clipping. */}
        <GlbViewer
          ref={glbRef}
          models={GLB_MODELS}
          transitionDuration={0.04}
          style={{
            position: "absolute",
            left: u(375),
            top: u(720),
            width: u(620),
            height: u(1250),
            pointerEvents: "none",
            zIndex: 3
          }}
        />

        {/* SEE FLAVORS pill */}
        <button
          type="button"
          onClick={() => openWithSpin(0)}
          className="absolute flex cursor-pointer appearance-none items-center justify-center overflow-hidden border-0 bg-[#fff0e5]"
          style={{ left: u(1125), top: u(48.25), padding: `${u(14)} ${u(24)}`, borderRadius: u(50.032) }}
        >
          <div className="flex items-center" style={{ gap: u(15.01) }}>
            <span
              className="font-semibold uppercase text-[#eb4638]"
              style={{ fontFamily: "var(--font-display)", fontSize: u(40), lineHeight: 0.8, letterSpacing: u(-2.8), textBoxTrim: "trim-both", textBoxEdge: "cap alphabetic" } as React.CSSProperties}
            >
              see flavors
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/s4-arrow.svg" alt="" style={{ width: u(15.644), height: u(30.807) }} />
          </div>
        </button>
      </div>
    </section>
  );
}
