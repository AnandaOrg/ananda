"use client";

import { useEffect, useState } from "react";

/**
 * Full-screen flavour detail overlay (Figma 198:4281 / 4607 / 5127 / 5571).
 * A 16:9 stage (1920×1080) scaled to fit the viewport via `--u = 100cqw / 1920`,
 * with the flavour colour bleeding into any letterbox. Prev/next cycles flavours.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;

type Crop = { w: string; h: string; left: string; top: string };
type Fruit = {
  src: string;
  box?: { left: number; top: number; w: number; h: number };
  inset?: { left: string; top: string; w: string; h: string };
  inner?: { w: number; h: number };
  rotate?: number;
  blur?: number;
  crop?: Crop;
};
type Flavor = {
  key: string;
  name: string;
  bg: string;
  nameColor: string;
  textColor: string;
  pattern: string;
  patternH?: number;
  pouch: { src: string; w: number; crop?: Crop };
  ingredients: [string, string];
  fruits: Fruit[];
};

const LEMON: Crop = { w: "134.65%", h: "166.26%", left: "-22.14%", top: "-38.75%" };
const ANIS: Crop = { w: "198.31%", h: "263.23%", left: "-50.89%", top: "-95.48%" };
const MANGO: Crop = { w: "143.08%", h: "181.55%", left: "-22.78%", top: "-36.97%" };
const PINE: Crop = { w: "318.65%", h: "241.79%", left: "-157.51%", top: "-72.22%" };
const STRAW: Crop = { w: "249.36%", h: "325.34%", left: "-77.04%", top: "-111.33%" };
const YUZU: Crop = { w: "104.99%", h: "155.12%", left: "-2.11%", top: "-28.8%" };

export const FLAVORS: Flavor[] = [
  {
    key: "santorini",
    name: "Santorini",
    bg: "#1f5fcd",
    nameColor: "#fff0e5",
    textColor: "#fff0e5",
    pattern: "/fl-bg-blue.svg",
    pouch: { src: "/fl-pouch-blue.png", w: 239.498, crop: { w: "309.93%", h: "112.64%", left: "-107.01%", top: "-8.24%" } },
    ingredients: ["Lemon, Mint and Anise.", "Mediterranean freshness."],
    fruits: [
      { src: "/fl-lemon.png", box: { left: 1394.65, top: 129.43, w: 498.3, h: 511.147 }, inner: { w: 325.032, h: 394.871 }, rotate: 37.53, crop: LEMON },
      { src: "/fl-lemon.png", box: { left: -273.6, top: 129.43, w: 860.531, h: 887.238 }, inner: { w: 564.863, h: 686.234 }, rotate: -36.05, blur: 4.148, crop: LEMON },
      { src: "/fl-lemon.png", box: { left: 434.09, top: -115.59, w: 365.229, h: 391.289 }, inner: { w: 256.295, h: 311.365 }, rotate: -25.45, crop: LEMON },
      { src: "/fl-anis.png", box: { left: 1224.21, top: 453.54, w: 116.161, h: 109.389 }, crop: ANIS },
      { src: "/fl-anis.png", box: { left: 642.63, top: 229.68, w: 153.181, h: 153.748 }, inner: { w: 111.985, h: 105.457 }, rotate: -48.52, crop: ANIS },
      { src: "/fl-mint2.png", inset: { left: "36.07%", top: "20.98%", w: "12.42%", h: "17.75%" }, rotate: -168.51 },
      { src: "/fl-mint1.png", inset: { left: "68.69%", top: "12.32%", w: "16.38%", h: "26.41%" }, rotate: -47.15 },
    ],
  },
  {
    key: "aloha",
    name: "Aloha",
    bg: "#f8a20f",
    nameColor: "#eb4638",
    textColor: "#eb4638",
    pattern: "/fl-bg-orange.svg",
    pouch: { src: "/fl-pouch-orange.png", w: 239.529, crop: { w: "306.37%", h: "111.19%", left: "-102.61%", top: "-6.91%" } },
    ingredients: ["Mango, Pineapple and Passion fruit.", "A sweet tropical breeze."],
    fruits: [
      { src: "/fl-passion-a.png", inset: { left: "78.63%", top: "16.12%", w: "11.35%", h: "19.36%" }, blur: 4.05 },
      { src: "/fl-mango.png", box: { left: 340.38, top: -31.41, w: 361.572, h: 410.974 }, inner: { w: 315.352, h: 372.794 }, rotate: -7.55, crop: MANGO },
      { src: "/fl-mango.png", box: { left: 1275.34, top: 168.75, w: 852.623, h: 805.248 }, inner: { w: 567.826, h: 671.256 }, rotate: 63.9, blur: 6.75, crop: MANGO },
      { src: "/fl-pineapple.png", box: { left: -138.51, top: 118.16, w: 570.478, h: 546.688 }, inner: { w: 299.428, h: 493.512 }, rotate: -49.97, crop: PINE },
      { src: "/fl-pineapple.png", box: { left: 1139.75, top: -64.16, w: 386.372, h: 290.367 }, inner: { w: 208.857, h: 344.235 }, rotate: 75.1, crop: PINE },
      { src: "/fl-passion-a.png", inset: { left: "7.23%", top: "52.09%", w: "9.68%", h: "16.52%" } },
    ],
  },
  {
    key: "gaia",
    name: "Gaia",
    bg: "#14a06b",
    nameColor: "#fff0e5",
    textColor: "#fff0e5",
    pattern: "/fl-bg-green.svg",
    pouch: { src: "/fl-pouch-green.png", w: 238.055 },
    ingredients: ["Passion fruit, Lemongrass and Elderflower.", "The power of wild nature."],
    fruits: [
      { src: "/fl-elderflower.png", box: { left: 943, top: 216.4, w: 459, h: 471 }, rotate: 34.04 },
      { src: "/fl-elderflower.png", box: { left: -413, top: -184.13, w: 1151, h: 1176 }, rotate: 35.61, blur: 3.95 },
      { src: "/fl-passion-g4.png", inset: { left: "27.66%", top: "-6.76%", w: "11.14%", h: "19.03%" } },
      { src: "/fl-passion-g4.png", inset: { left: "56.87%", top: "18.7%", w: "12.15%", h: "21.18%" }, rotate: 18.79 },
      { src: "/fl-passion-g4.png", inset: { left: "-3.07%", top: "46.26%", w: "19.24%", h: "32.82%" }, blur: 4.85 },
      { src: "/fl-passion-g1.png", inset: { left: "82.66%", top: "5.53%", w: "23.23%", h: "41.11%" }, rotate: -43.6, blur: 3.9 },
    ],
  },
  {
    key: "kyoto",
    name: "Kyoto",
    bg: "#eb4638",
    nameColor: "#ff95ac",
    textColor: "#fff0e5",
    pattern: "/fl-bg-red.svg",
    pouch: { src: "/fl-pouch-red.png", w: 251.076, crop: { w: "305.8%", h: "116.33%", left: "-100.79%", top: "-9.26%" } },
    ingredients: ["Strawberry, Lychee and Yuzu.", "Precise Japanese elegance."],
    fruits: [
      { src: "/fl-lychee.png", box: { left: 535.66, top: 3.38, w: 290.952, h: 290.693 }, inner: { w: 202.429, h: 209.017 }, rotate: 46.6 },
      { src: "/fl-lychee.png", box: { left: 1112.58, top: 469, w: 227.796, h: 231.241 }, inner: { w: 176.367, h: 182.106 }, rotate: -19.89 },
      { src: "/fl-lychee.png", box: { left: -55.82, top: 267.12, w: 227.796, h: 231.241 }, inner: { w: 176.367, h: 182.106 }, rotate: -19.89 },
      { src: "/fl-yuzu.png", box: { left: 1637.45, top: 422.34, w: 382.172, h: 387.98 }, blur: 6.15, crop: YUZU },
      { src: "/fl-strawberry.png", box: { left: 1432.35, top: -75.16, w: 776.004, h: 812.933 }, inner: { w: 551.02, h: 633.483 }, rotate: 26.54, blur: 6.85, crop: STRAW },
      { src: "/fl-strawberry.png", box: { left: 434.09, top: 84.99, w: 300.487, h: 317.819 }, inner: { w: 219.253, h: 252.065 }, rotate: -23.07, crop: STRAW },
      { src: "/fl-strawberry.png", box: { left: -91.69, top: 445.8, w: 502.246, h: 479.813 }, inner: { w: 339.982, h: 390.862 }, rotate: 116.83, blur: 3.25, crop: STRAW },
      { src: "/fl-yuzu.png", box: { left: 314.54, top: -119.19, w: 274.637, h: 278.811 }, crop: YUZU },
    ],
  },
];

/** Letter-by-letter opacity "fill": each character starts faint and rises to full,
 *  staggered left-to-right. Remounts (re-animates) whenever its `key` changes. */
function Reveal({ text, base = 0.18, step = 28, delay = 0 }: { text: string; base?: number; step?: number; delay?: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <>
      {[...text].map((c, i) => (
        <span
          key={i}
          aria-hidden
          style={{ opacity: on ? 1 : base, transition: "opacity 480ms ease-out", transitionDelay: `${delay + i * step}ms` }}
        >
          {c === " " ? " " : c}
        </span>
      ))}
    </>
  );
}

function FruitImg({ f }: { f: Fruit }) {
  const filter = f.blur ? { filter: `blur(${u(f.blur)})` } : undefined;
  const inner = f.inner ?? (f.box ? { w: f.box.w, h: f.box.h } : null);

  const media = f.crop ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={f.src} alt="" className="absolute max-w-none" style={{ width: f.crop.w, height: f.crop.h, left: f.crop.left, top: f.crop.top }} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={f.src} alt="" className="absolute inset-0 size-full max-w-none object-cover" />
  );

  if (f.inset) {
    return (
      <div className="pointer-events-none absolute" style={{ left: f.inset.left, top: f.inset.top, width: f.inset.w, height: f.inset.h, ...filter }}>
        <div className="relative size-full overflow-hidden" style={{ transform: f.rotate ? `rotate(${f.rotate}deg)` : undefined }}>
          {media}
        </div>
      </div>
    );
  }

  const b = f.box!;
  return (
    <div className="pointer-events-none absolute flex items-center justify-center" style={{ left: u(b.left), top: u(b.top), width: u(b.w), height: u(b.h) }}>
      <div style={{ transform: f.rotate ? `rotate(${f.rotate}deg)` : undefined, ...filter }}>
        <div className="relative overflow-hidden" style={{ width: u(inner!.w), height: u(inner!.h) }}>
          {media}
        </div>
      </div>
    </div>
  );
}

function Chevron({ color, flip, width = u(46), height = u(90) }: { color: string; flip?: boolean; width?: string; height?: string }) {
  return (
    <svg viewBox="0 0 46 90" style={{ width, height, transform: flip ? "scaleX(-1)" : undefined }} fill="none" aria-hidden>
      <path d="M5 5 L41 45 L5 85" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className="size-full" aria-hidden>
      <circle cx="30" cy="30" r="28.5" stroke={color} strokeWidth="2" />
      <path d="M21 21 L39 39 M39 21 L21 39" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** The decorative scene (mandala backdrop + scattered fruit), positioned in the
 *  1920×1080 space via the ambient `--u`. Used by both the desktop stage and the
 *  mobile cover layer. */
function Scene({ f }: { f: Flavor }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={f.pattern} alt="" className="pointer-events-none absolute -translate-x-1/2" style={{ left: "50%", top: u(-1032), width: u(1700), height: u(1700) }} />
      {f.fruits.map((fr, i) => (
        <FruitImg key={i} f={fr} />
      ))}
    </>
  );
}

export default function FlavorModal({
  index,
  onClose,
  onNav,
}: {
  index: number | null;
  onClose: () => void;
  onNav: (dir: number) => void;
}) {
  const [shown, setShown] = useState(false);
  const open = index !== null;

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNav(1);
      else if (e.key === "ArrowLeft") onNav(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, onNav]);

  if (!open) return null;
  const f = FLAVORS[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${f.name} cocktail`}
      className="fixed inset-0 z-50 overflow-hidden transition-opacity duration-300"
      style={{ backgroundColor: f.bg, opacity: shown ? 1 : 0 }}
    >
      {/* ───────── Desktop / tablet: 16:9 stage that fits inside the viewport ───────── */}
      <div className="hidden size-full md:flex md:items-center md:justify-center">
        <div
          className="relative overflow-hidden w-[min(100vw,calc(100vh*16/9))]"
          style={{ aspectRatio: "16 / 9", containerType: "inline-size", ["--u" as string]: "calc(100cqw / 1920)", backgroundColor: f.bg }}
        >
          <Scene f={f} />

          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ gap: u(40) }}>
            <div className="flex flex-col items-center" style={{ gap: u(40) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.pouch.src} alt={`ANANDA ${f.name} pouch`} className="block w-auto max-w-none object-contain" style={{ height: u(720) }} />
              <div key={f.key} className="flex flex-col items-center" style={{ gap: u(14), color: f.textColor }}>
                <p aria-label="Ingredients" className="whitespace-nowrap uppercase" style={{ fontFamily: "var(--font-mono-label)", fontSize: u(16), lineHeight: 0.87, letterSpacing: u(1.12) }}>
                  <Reveal text="Ingredients" delay={0} />
                </p>
                <div className="text-center" style={{ fontFamily: "var(--font-body)", fontSize: u(24), lineHeight: 1.6, letterSpacing: u(0.24), width: u(465.222) }}>
                  <p className="mb-0" aria-label={f.ingredients[0]}>
                    <Reveal text={f.ingredients[0]} delay={260} />
                  </p>
                  <p aria-label={f.ingredients[1]}>
                    <Reveal text={f.ingredients[1]} delay={260 + f.ingredients[0].length * 28} />
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between" style={{ width: u(1800) }}>
              <button type="button" aria-label="Previous flavour" onClick={() => onNav(-1)} className="cursor-pointer">
                <Chevron color={f.nameColor} flip />
              </button>
              <p className="text-center font-bold uppercase" style={{ fontFamily: "var(--font-display)", fontSize: u(160), lineHeight: 0.8, letterSpacing: u(-12.8), color: f.nameColor, width: u(760.75) }}>
                {f.name}
              </p>
              <button type="button" aria-label="Next flavour" onClick={() => onNav(1)} className="cursor-pointer">
                <Chevron color={f.nameColor} />
              </button>
            </div>
          </div>

          <button type="button" aria-label="Close" onClick={onClose} className="absolute cursor-pointer" style={{ left: u(1813.9), top: u(36), width: u(60), height: u(60) }}>
            <CloseIcon color={f.nameColor} />
          </button>
        </div>
      </div>

      {/* ───────── Mobile: scene covers the screen, controls fit the viewport ───────── */}
      <div className="absolute inset-0 md:hidden">
        {/* Cover scene (mandala + fruit), centred & cropped to fill the screen */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden w-[max(100vw,calc(100vh*16/9))]"
          style={{ aspectRatio: "16 / 9", containerType: "inline-size", ["--u" as string]: "calc(100cqw / 1920)" }}
        >
          <Scene f={f} />
        </div>

        {/* Fitted content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6" style={{ gap: "4vh" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.pouch.src} alt={`ANANDA ${f.name} pouch`} className="block w-auto max-w-none object-contain" style={{ height: "42vh" }} />
          <div key={f.key} className="flex flex-col items-center text-center" style={{ gap: "0.7rem", color: f.textColor }}>
            <p aria-label="Ingredients" className="whitespace-nowrap uppercase" style={{ fontFamily: "var(--font-mono-label)", fontSize: 11, lineHeight: 0.87, letterSpacing: "0.8px" }}>
              <Reveal text="Ingredients" delay={0} />
            </p>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5, maxWidth: "84vw" }}>
              <p className="mb-0" aria-label={f.ingredients[0]}>
                <Reveal text={f.ingredients[0]} delay={260} />
              </p>
              <p aria-label={f.ingredients[1]}>
                <Reveal text={f.ingredients[1]} delay={260 + f.ingredients[0].length * 28} />
              </p>
            </div>
          </div>
          <p
            className="text-center font-bold uppercase"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 13vw, 5.5rem)", lineHeight: 0.8, letterSpacing: "-0.06em", color: f.nameColor }}
          >
            {f.name}
          </p>
        </div>

        {/* Edge arrows */}
        <button type="button" aria-label="Previous flavour" onClick={() => onNav(-1)} className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer p-3">
          <Chevron color={f.nameColor} flip width="22px" height="43px" />
        </button>
        <button type="button" aria-label="Next flavour" onClick={() => onNav(1)} className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer p-3">
          <Chevron color={f.nameColor} width="22px" height="43px" />
        </button>

        {/* Close */}
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 size-10 cursor-pointer">
          <CloseIcon color={f.nameColor} />
        </button>
      </div>
    </div>
  );
}
