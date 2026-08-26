"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useSpring, type Transition, type Variants } from "framer-motion";
import GlbViewer, { type GlbViewerHandle, type ModelEntry } from "./GlbViewer";
import { LinkWrap, useMediaAsset } from "./MediaProvider";

const u = (n: number) => `calc(var(--u) * ${n})`;
const uCap = (n: number) => `calc(min(var(--u), 100svh / 1080) * ${n})`;
const mu = (n: number) => `calc(var(--mu) * ${n})`;

const NAV_DURATION = 0.5;

const SWING_TRANSITION = { type: "tween", duration: NAV_DURATION, ease: "easeInOut" } as const;
const SWING_IMPACT_DURATION = 0.364;
const SWING_ROTATE_TRANSITION: Transition = {
  type: "spring",
  duration: SWING_IMPACT_DURATION * 1.6,
  bounce: 0.55,
};

const GLB_TILT_MAX = 15;
const GLB_TILT_SPRING = { stiffness: 120, damping: 20, mass: 0.4 } as const;

const SWIPE_MIN_X = 50;
const SWIPE_DOMINANCE = 1.5;

const NAV_LOCK_MS = NAV_DURATION * 1000 + 150;

const AUTO_CLOSE_DELAY_MS = 1200;
const LAYER_VARIANTS: Variants = {
  enter: (dir: number) => ({ rotate: 90 * dir, opacity: 0 }),
  center: {
    rotate: 0,
    opacity: 1,
    transition: { ...SWING_TRANSITION, rotate: SWING_ROTATE_TRANSITION },
  },
  exit: (dir: number) => ({
    rotate: -90 * dir,
    opacity: 1,
    transition: { ...SWING_TRANSITION, rotate: SWING_ROTATE_TRANSITION },
  }),
};
const PLANE_BASE = {
  position: "absolute",
  left: "50%",
  top: "100%",
  transformOrigin: "50% 50%",
} as const;

function useSwingPlane(): { plane: React.CSSProperties; content: React.CSSProperties } {
  const measure = () =>
    typeof window === "undefined"
      ? 2400
      : Math.ceil(Math.hypot(window.innerWidth / 2, window.innerHeight) * 1.02);
  const [r, setR] = useState(measure);
  useEffect(() => {
    const update = () => setR(measure());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return {
    plane: { ...PLANE_BASE, width: r * 2, height: r * 2, margin: -r },
    content: {
      position: "absolute",
      left: `calc(${r}px - 50vw)`,
      top: `calc(${r}px - 100svh)`,
      width: "100vw",
      height: "100svh",
    },
  };
}

type Crop = { w: string; h: string; left: string; top: string };
type Fruit = {
  src: string;
  box?: { left: number; top: number; w: number; h: number };
  inset?: { left: string; top: string; w: string; h: string };
  inner?: { w: number; h: number };
  rotate?: number;
  blur?: number;
  crop?: Crop;
  anchor?: "top";
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
  mobileFruits?: Fruit[];
};

const MODAL_GLB_MODELS: ModelEntry[] = [
  { src: "/glb/santorini.glb" },
  { src: "/glb/aloha.glb" },
  { src: "/glb/gaia.glb" },
  { src: "/glb/kyoto.glb" },
];

export const MODAL_GLB_SRCS = MODAL_GLB_MODELS.map((m) => m.src);

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
    ingredients: ["Anise, Mint and Lemon.", "Mediterranean freshness."],
    fruits: [
      { src: "/fl-lemon.png", box: { left: 1394.65, top: 129.43, w: 498.3, h: 511.147 }, inner: { w: 325.032, h: 394.871 }, rotate: 37.53, crop: LEMON },
      { src: "/fl-lemon.png", box: { left: -273.6, top: 129.43, w: 860.531, h: 887.238 }, inner: { w: 564.863, h: 686.234 }, rotate: -36.05, blur: 4.148, crop: LEMON },
      { src: "/fl-lemon.png", box: { left: 434.09, top: -115.59, w: 365.229, h: 391.289 }, inner: { w: 256.295, h: 311.365 }, rotate: -25.45, crop: LEMON },
      { src: "/fl-anis.png", box: { left: 1224.21, top: 453.54, w: 116.161, h: 109.389 }, crop: ANIS },
      { src: "/fl-anis.png", box: { left: 642.63, top: 229.68, w: 153.181, h: 153.748 }, inner: { w: 111.985, h: 105.457 }, rotate: -48.52, crop: ANIS },
      { src: "/fl-mint2.png", inset: { left: "36.07%", top: "20.98%", w: "12.42%", h: "17.75%" }, rotate: -168.51 },
      { src: "/fl-mint1.png", inset: { left: "68.69%", top: "12.32%", w: "16.38%", h: "26.41%" }, rotate: -47.15 },
    ],
    mobileFruits: [
      { src: "/fl-lemon.png", box: { left: 261, top: 16.1, w: 173.06, h: 177.52 }, inner: { w: 112.88, h: 137.14 }, rotate: 37.53, crop: LEMON, anchor: "top" },
      { src: "/fl-lemon.png", box: { left: -137.6, top: 196.6, w: 298.86, h: 308.14 }, inner: { w: 196.18, h: 238.33 }, rotate: -36.05, blur: 1.441, crop: LEMON },
      { src: "/fl-lemon.png", box: { left: 24, top: -1.5, w: 126.84, h: 135.89 }, inner: { w: 89.01, h: 108.13 }, rotate: -25.45, crop: LEMON, anchor: "top" },
      { src: "/fl-anis.png", box: { left: 256.9, top: 302.8, w: 40.34, h: 37.99 }, crop: ANIS },
      { src: "/fl-anis.png", box: { left: 34.7, top: 159.6, w: 53.2, h: 53.4 }, inner: { w: 38.89, h: 36.63 }, rotate: -48.52, crop: ANIS },
      { src: "/fl-mint2.png", box: { left: 60.3, top: 154.1, w: 82.82, h: 66.58 }, rotate: -168.51 },
      { src: "/fl-mint2.png", box: { left: 242.9, top: 44.7, w: 82.82, h: 66.58 }, rotate: -20, anchor: "top" },
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
    mobileFruits: [
      { src: "/fl-passion-a.png", box: { left: 307.2, top: 65.7, w: 75.71, h: 72.55 }, blur: 1.407, anchor: "top" },
      { src: "/fl-mango.png", box: { left: 34.2, top: 58.6, w: 125.57, h: 142.73 }, inner: { w: 109.52, h: 129.47 }, rotate: -7.55, crop: MANGO, anchor: "top" },
      { src: "/fl-mango.png", box: { left: 246.9, top: 138, w: 296.12, h: 279.66 }, inner: { w: 197.21, h: 233.13 }, rotate: 63.9, blur: 2.344, crop: MANGO },
      { src: "/fl-pineapple.png", box: { left: -39, top: 205, w: 198.13, h: 189.86 }, inner: { w: 103.99, h: 171.4 }, rotate: -49.97, crop: PINE },
      { src: "/fl-pineapple.png", box: { left: 192.9, top: -28.4, w: 134.19, h: 100.84 }, inner: { w: 72.54, h: 119.55 }, rotate: 75.1, crop: PINE, anchor: "top" },
      { src: "/fl-passion-a.png", box: { left: 40, top: 321, w: 140, h: 134.4 } },
      { src: "/fl-passion-a.png", box: { left: 329.7, top: 307, w: 64.56, h: 61.96 } },
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
    mobileFruits: [
      { src: "/fl-elderflower.png", box: { left: 210.3, top: 263.2, w: 159.41, h: 163.58 }, rotate: 34.04 },
      { src: "/fl-elderflower.png", box: { left: -144.9, top: 95.8, w: 399.74, h: 408.42 }, rotate: 35.61, blur: 1.372 },
      { src: "/fl-passion-g4.png", box: { left: 102.9, top: -7.7, w: 74.28, h: 71.37 }, anchor: "top" },
      { src: "/fl-passion-g4.png", box: { left: 227.5, top: 215.3, w: 81.02, h: 79.42 }, rotate: 18.79 },
      { src: "/fl-passion-g4.png", box: { left: -54, top: 338, w: 128.29, h: 123.11 }, blur: 1.684 },
      { src: "/fl-passion-g1.png", box: { left: 287.6, top: 44.9, w: 154.89, h: 154.19 }, rotate: -43.6, blur: 1.354, anchor: "top" },
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
    mobileFruits: [
      { src: "/fl-lychee.png", box: { left: 111.08, top: 8.71, w: 101.048, h: 100.958 }, inner: { w: 70.304, h: 72.592 }, rotate: 46.6, anchor: "top" },
      { src: "/fl-lychee.png", box: { left: 266.52, top: 279.5, w: 79.114, h: 80.31 }, inner: { w: 61.252, h: 63.246 }, rotate: -19.89 },
      { src: "/fl-lychee.png", box: { left: -40.48, top: 179.6, w: 79.114, h: 80.31 }, inner: { w: 61.252, h: 63.246 }, rotate: -19.89 },
      { src: "/fl-yuzu.png", box: { left: 318.66, top: 194.05, w: 132.729, h: 134.746 }, blur: 2.136, crop: YUZU },
      { src: "/fl-strawberry.png", box: { left: 247.43, top: 21.27, w: 269.507, h: 282.333 }, inner: { w: 191.37, h: 220.009 }, rotate: 26.54, blur: 2.379, crop: STRAW, anchor: "top" },
      { src: "/fl-strawberry.png", box: { left: 75.81, top: 37.05, w: 104.359, h: 110.379 }, inner: { w: 76.147, h: 87.543 }, rotate: -23.07, crop: STRAW, anchor: "top" },
      { src: "/fl-strawberry.png", box: { left: -52.94, top: 241.65, w: 174.43, h: 166.64 }, inner: { w: 118.076, h: 135.747 }, rotate: 116.83, blur: 1.129, crop: STRAW },
      { src: "/fl-yuzu.png", box: { left: 34.29, top: -40.46, w: 95.382, h: 96.831 }, crop: YUZU, anchor: "top" },
    ],
  },
];

function FruitImg({ f, i, unit = u }: { f: Fruit; i: number; unit?: (n: number) => string }) {
  const asset = useMediaAsset(f.src);
  const filter = f.blur ? { filter: `blur(${unit(f.blur)})` } : undefined;
  const inner = f.inner ?? (f.box ? { w: f.box.w, h: f.box.h } : null);

  const floatStyle = {
    ["--float-x" as string]: `${8 + (i % 3) * 4}px`,
    ["--float-y" as string]: `${-(12 + (i % 4) * 4)}px`,
    ["--float-r" as string]: `${(i % 2 ? -1 : 1) * (2 + (i % 3))}deg`,
    ["--float-dur" as string]: `${8 + (i % 5) * 1.3}s`,
    ["--float-delay" as string]: `${-i * 1.3}s`,
  };

  if (!asset.active) return null;

  const media = (
    <LinkWrap href={asset.link} fill>
      {f.crop ? (
        <img src={asset.url} alt="" className="absolute max-w-none" style={{ width: f.crop.w, height: f.crop.h, left: f.crop.left, top: f.crop.top }} />
      ) : (
        <img src={asset.url} alt="" className="absolute inset-0 size-full max-w-none object-cover" />
      )}
    </LinkWrap>
  );

  if (f.inset) {
    return (
      <div className="pointer-events-none absolute" style={{ left: f.inset.left, top: f.inset.top, width: f.inset.w, height: f.inset.h, ...filter }}>
        <div className="fl-float size-full" style={floatStyle}>
          <div className="relative size-full overflow-hidden" style={{ transform: f.rotate ? `rotate(${f.rotate}deg)` : undefined }}>
            {media}
          </div>
        </div>
      </div>
    );
  }

  const b = f.box!;
  return (
    <div className="pointer-events-none absolute flex items-center justify-center" style={{ left: unit(b.left), top: unit(b.top), width: unit(b.w), height: unit(b.h) }}>
      <div className="fl-float" style={floatStyle}>
        <div style={{ transform: f.rotate ? `rotate(${f.rotate}deg)` : undefined, ...filter }}>
          <div className="relative overflow-hidden" style={{ width: unit(inner!.w), height: unit(inner!.h) }}>
            {media}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chevron({ color, flip, width = u(47), height = u(91) }: { color: string; flip?: boolean; width?: string; height?: string }) {
  return flip ? (
    <svg width={width} height={height} viewBox="0 0 47 91" fill="none" aria-hidden>
      <path d="M39.5635 78.9873C36.6697 76.0787 33.5156 73.02 31.8398 71.582C30.9896 70.4486 30.0285 69.4119 29.1895 68.5332C28.1839 67.4801 27.3848 66.6787 26.6738 65.8574C22.2698 60.0727 13.2037 51.302 6.48926 45.4307C7.66131 44.3343 8.87308 43.271 10.1309 42.1709C12.4727 40.1226 15.0124 37.9058 17.3037 35.2783L25.3057 27.2109L25.5264 26.9883L25.7139 26.7363C28.9504 22.3865 33.5791 18.1841 38.001 13.8311C39.1719 12.6784 40.3163 11.5366 41.4473 10.4043C41.3372 14.8669 41.2257 19.4106 41.1641 23.1826L41.1641 23.2109C41.007 38.9788 40.7613 54.746 40.4268 70.5107L40.4268 70.5225C40.3749 73.2917 40.3953 76.5968 40.3945 79.8262C40.1165 79.5446 39.8389 79.2641 39.5635 78.9873Z" stroke={color} strokeWidth="8.83982" />
    </svg>
  ) : (
    <svg width={width} height={height} viewBox="0 0 47 91" fill="none" aria-hidden>
      <path d="M6.53223 11.79C9.42605 14.6987 12.5801 17.7574 14.2559 19.1953C15.1061 20.3287 16.0672 21.3655 16.9062 22.2441C17.9118 23.2972 18.7109 24.0986 19.4219 24.9199C23.8259 30.7047 32.892 39.4754 39.6064 45.3467C38.4344 46.443 37.2226 47.5063 35.9648 48.6064C33.623 50.6547 31.0833 52.8715 28.792 55.499L20.79 63.5664L20.5693 63.7891L20.3818 64.041C17.1453 68.3909 12.5166 72.5933 8.09473 76.9463C6.92383 78.0989 5.7794 79.2408 4.64844 80.373C4.75855 75.9105 4.87003 71.3668 4.93164 67.5947V67.5664C5.08866 51.7986 5.33442 36.0313 5.66895 20.2666V20.2549C5.72077 17.4857 5.70036 14.1805 5.70117 10.9512C5.97924 11.2327 6.2568 11.5132 6.53223 11.79Z" stroke={color} strokeWidth="8.83982" />
    </svg>
  );
}

function CloseIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 27 27" fill="none" className="size-full" aria-hidden>
      <path d="M25.2 1.19922L1.19995 25.1992M1.19995 1.19922L25.2 25.1992" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Scene({ f }: { f: Flavor }) {
  const pattern = useMediaAsset(f.pattern);
  return (
    <>
      {pattern.active && (
        <img src={pattern.url} alt="" className="pointer-events-none absolute -translate-x-1/2" style={{ left: "50%", top: u(-1165.4), width: u(1920), height: u(1920) }} />
      )}
      {f.fruits.map((fr, i) => (
        <FruitImg key={i} f={fr} i={i} />
      ))}
    </>
  );
}

function MobileScene({ f }: { f: Flavor }) {
  const pattern = useMediaAsset(f.pattern);
  return (
    <>
      {pattern.active && (
        <img
          src={pattern.url}
          alt=""
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/4"
          style={{ top: mu(-107), width: mu(440), height: mu(440) }}
        />
      )}
      <div className="absolute left-0 top-0 w-full" style={{ height: mu(680) }}>
        {(f.mobileFruits ?? []).map((fr, i) =>
          fr.anchor === "top" ? <FruitImg key={i} f={fr} i={i} unit={mu} /> : null
        )}
      </div>
      <div className="absolute bottom-0 left-0 w-full" style={{ height: mu(680) }}>
        {(f.mobileFruits ?? []).map((fr, i) =>
          fr.anchor === "top" ? null : <FruitImg key={i} f={fr} i={i} unit={mu} />
        )}
      </div>
    </>
  );
}

export default function FlavorModal({
  index,
  navDir,
  origin,
  onClose,
  onNav,
}: {
  index: number;
  navDir: number;
  origin: { x: number; y: number };
  onClose: () => void;
  onNav: (dir: number) => void;
}) {
  const t = useTranslations("modal");
  const tFlavors = useTranslations("flavorItems");
  const reduceMotion = useReducedMotion();
  const swing = useSwingPlane();

  const desktopGlbRef = useRef<GlbViewerHandle>(null);
  const mobileGlbRef  = useRef<GlbViewerHandle>(null);

  const layerDir = reduceMotion ? 0 : navDir;

  const tiltRawX = useMotionValue(0);
  const tiltRawY = useMotionValue(0);
  const tiltX = useSpring(tiltRawX, GLB_TILT_SPRING);
  const tiltY = useSpring(tiltRawY, GLB_TILT_SPRING);
  // Separate from the mouse-tilt above on purpose: this rocks around a pivot near
  // the pouch's cap (like it's hanging and swaying), not the center — it needs its
  // own transform-origin, which the ambient tilt above must not inherit.
  const hintSwing = useMotionValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      tiltRawY.set(nx * GLB_TILT_MAX);
      tiltRawX.set(-ny * GLB_TILT_MAX);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduceMotion, tiltRawX, tiltRawY]);

  const [viewed, setViewed] = useState<Set<number>>(() => new Set([index]));
  const [lastIndexSeen, setLastIndexSeen] = useState(index);
  if (index !== lastIndexSeen) {
    setLastIndexSeen(index);
    setViewed((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
  }
  const closing = viewed.size >= FLAVORS.length;

  useEffect(() => {
    if (!closing) return;
    const id = setTimeout(onClose, AUTO_CLOSE_DELAY_MS);
    return () => clearTimeout(id);
  }, [closing, index, onClose]);

  const lastNavRef = useRef(0);
  const hasNavigatedRef = useRef(false);
  const guardedNav = useCallback(
    (dir: number) => {
      const now = Date.now();
      if (now - lastNavRef.current < NAV_LOCK_MS) return;
      lastNavRef.current = now;
      hasNavigatedRef.current = true;
      onNav(dir);
    },
    [onNav]
  );

  // The pouch tilts left-right once, 3s after the modal opens, as a hint that
  // swiping (mobile) / the arrow buttons move between flavors. Skipped once the
  // visitor has actually navigated, so it never nags someone who already knows.
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setTimeout(() => {
      if (hasNavigatedRef.current) return;
      animate(hintSwing, [0, -25, 25, 0], { duration: 1.4, ease: "easeInOut" });
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") guardedNav(1);
      else if (e.key === "ArrowLeft") guardedNav(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, guardedNav]);

  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onSwipeTouchStart = (e: React.TouchEvent) => {
    swipeStart.current =
      e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  };
  const onSwipeTouchEnd = (e: React.TouchEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(dx) < Math.abs(dy) * SWIPE_DOMINANCE) return;
    guardedNav(dx < 0 ? 1 : -1);
  };

  const f = FLAVORS[index];
  const flavorName = tFlavors.has(`${f.key}.name`) ? tFlavors(`${f.key}.name`) : f.name;
  const flavorIngredients: [string, string] = [
    tFlavors.has(`${f.key}.ingredients.0`) ? tFlavors(`${f.key}.ingredients.0`) : f.ingredients[0],
    tFlavors.has(`${f.key}.ingredients.1`) ? tFlavors(`${f.key}.ingredients.1`) : f.ingredients[1],
  ];

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${flavorName} cocktail`}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ originX: origin.x, originY: origin.y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        scale:   { type: "tween", duration: 0.9, ease: [0.16, 1, 0.3, 1] },
        opacity: { type: "tween", duration: 0.3, ease: "easeOut" },
      }}
    >
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ backgroundColor: f.bg }}
        transition={{ type: "tween", duration: NAV_DURATION, ease: "easeInOut" }}
      />

      <div className="hidden size-full md:block">
        <div
          className="relative size-full overflow-hidden"
          style={{ containerType: "inline-size", ["--u" as string]: "calc(100cqw / 1920)", height: "100svh" }}
        >
          <div className="absolute inset-0" style={{ pointerEvents: "none", zIndex: 40 }}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `calc(50% - ${u(150)})`,
                transform: "translate(-50%, -50%)",
                width: uCap(1325.7),
                height: uCap(1590.8),
              }}
            >
              <div className="glb-float size-full" style={{ perspective: 900 }}>
                <motion.div className="size-full" style={{ rotateX: tiltX, rotateY: tiltY }}>
                  <motion.div className="size-full" style={{ rotateZ: hintSwing, transformOrigin: "50% 15%" }}>
                    <GlbViewer
                      ref={desktopGlbRef}
                      models={MODAL_GLB_MODELS}
                      activeIndex={index}
                      navDuration={NAV_DURATION}
                      spinDuration={SWING_IMPACT_DURATION}
                      initialTilt={0}
                      noScroll
                      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
                    />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>

          <AnimatePresence custom={layerDir} initial={false}>
            <motion.div
              key={f.key}
              style={{ ...swing.plane, backgroundColor: f.bg }}
              custom={layerDir}
              variants={LAYER_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SWING_TRANSITION}
            >
              <div style={swing.content}>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ height: u(1080) }}>
                  <Scene f={f} />
                </div>
                <div className="absolute inset-x-0 flex flex-col items-center" style={{ bottom: u(210), gap: u(14), color: f.textColor }}>
                  <p aria-label={t("ingredients")} className="whitespace-nowrap uppercase" style={{ fontFamily: "var(--font-mono-label)", fontSize: u(16), lineHeight: 0.87, letterSpacing: u(1.12) }}>
                    {t("ingredients")}
                  </p>
                  <div className="text-center" style={{ fontFamily: "var(--font-body)", fontSize: u(24), lineHeight: 1.6, letterSpacing: u(0.24), width: u(465.222) }}>
                    <p className="mb-0" aria-label={flavorIngredients[0]}>
                      {flavorIngredients[0]}
                    </p>
                    <p aria-label={flavorIngredients[1]}>
                      {flavorIngredients[1]}
                    </p>
                  </div>
                </div>

                <p
                  className="absolute inset-x-0 text-center font-bold uppercase"
                  style={{ bottom: u(40), fontFamily: "var(--font-display)", fontSize: u(160), lineHeight: 0.8, letterSpacing: u(-12.8), color: f.nameColor, transform: `translateY(${u(22.4)})` }}
                >
                  {flavorName}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-x-0 flex items-center justify-between" style={{ bottom: u(40), padding: `0 ${u(60)}`, height: u(128) }}>
            <button type="button" aria-label={t("prev")} onClick={(e) => { e.stopPropagation(); guardedNav(-1); }} className="cursor-pointer">
              <Chevron color={f.nameColor} flip />
            </button>
            <button type="button" aria-label={t("next")} onClick={(e) => { e.stopPropagation(); guardedNav(1); }} className="cursor-pointer">
              <Chevron color={f.nameColor} />
            </button>
          </div>
          <button type="button" aria-label={t("close")} onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute cursor-pointer" style={{ left: u(1813.9), top: u(36), width: u(60), height: u(60) }}>
            <CloseIcon color={f.textColor} />
          </button>
        </div>
      </div>

      <div
        className="absolute inset-0 md:hidden"
        style={{ containerType: "inline-size", ["--mu" as string]: "calc(100cqw / 390)" }}
        onTouchStart={onSwipeTouchStart}
        onTouchEnd={onSwipeTouchEnd}
      >
        <div className="absolute inset-0" style={{ pointerEvents: "none", zIndex: 40 }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `calc(100% - ${mu(418)})`,
              transform: "translate(-50%, -50%)",
              width: mu(560),
              height: mu(868.8),
            }}
          >
            <div className="glb-float size-full" style={{ perspective: 900 }}>
              <motion.div className="size-full" style={{ rotateX: tiltX, rotateY: tiltY }}>
                <motion.div className="size-full" style={{ rotateZ: hintSwing, transformOrigin: "50% 15%" }}>
                  <GlbViewer
                    ref={mobileGlbRef}
                    models={MODAL_GLB_MODELS}
                    activeIndex={index}
                    navDuration={NAV_DURATION}
                    spinDuration={SWING_IMPACT_DURATION}
                    initialTilt={0}
                    noScroll
                    dropCacheAfterParse
                    style={{ width: "100%", height: "100%", pointerEvents: "none" }}
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        <AnimatePresence custom={layerDir} initial={false}>
          <motion.div
            key={f.key}
            style={{ ...swing.plane, backgroundColor: f.bg }}
            custom={layerDir}
            variants={LAYER_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SWING_TRANSITION}
          >
            <div style={swing.content}>
              <MobileScene f={f} />

              <div className="absolute bottom-0 left-0 w-full" style={{ height: mu(680) }}>
                <div
                  className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center text-center"
                  style={{ top: mu(480), width: mu(221.76), gap: mu(8), color: f.textColor }}
                >
                  <p aria-label={t("ingredients")} className="whitespace-nowrap uppercase" style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}>
                    {t("ingredients")}
                  </p>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: mu(16), lineHeight: 1.2, letterSpacing: mu(0.16), width: mu(214.182) }}>
                    <p className="mb-0" aria-label={flavorIngredients[0]}>{flavorIngredients[0]}</p>
                    <p aria-label={flavorIngredients[1]}>{flavorIngredients[1]}</p>
                  </div>
                </div>

                <div className="absolute flex items-center justify-center" style={{ left: mu(21.67), top: mu(594.83), width: mu(346.667), height: mu(38) }}>
                  <p className="text-center font-bold uppercase" style={{ fontFamily: "var(--font-display)", fontSize: mu(60), lineHeight: 0.8, letterSpacing: mu(-4.8), color: f.nameColor, transform: `translateY(${mu(8.4)})` }}>
                    {flavorName}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 w-full" style={{ height: mu(680), pointerEvents: "none", zIndex: 50 }}>
          <div className="absolute flex items-center justify-between" style={{ left: mu(21.67), top: mu(594.83), width: mu(346.667), height: mu(38) }}>
            <button type="button" aria-label={t("prev")} onClick={(e) => { e.stopPropagation(); guardedNav(-1); }} className="cursor-pointer" style={{ pointerEvents: "auto", padding: mu(16), margin: `-${mu(16)}` }}>
              <Chevron color={f.nameColor} flip width={mu(13)} height={mu(25)} />
            </button>
            <button type="button" aria-label={t("next")} onClick={(e) => { e.stopPropagation(); guardedNav(1); }} className="cursor-pointer" style={{ pointerEvents: "auto", padding: mu(16), margin: `-${mu(16)}` }}>
              <Chevron color={f.nameColor} width={mu(13)} height={mu(25)} />
            </button>
          </div>
        </div>
        <button type="button" aria-label={t("close")} onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute cursor-pointer" style={{ right: mu(24.36), top: mu(26.72), width: mu(24), height: mu(24), zIndex: 50 }}>
          <CloseIcon color={f.textColor} />
        </button>
      </div>
    </motion.div>
  );
}
