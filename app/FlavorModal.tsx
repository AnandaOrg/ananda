"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlbViewer, { type GlbViewerHandle, type ModelEntry } from "./GlbViewer";

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

// All flavour models, ordered to match FLAVORS / the modal index. Module-level so
// the reference is stable: the viewer loads them ALL once and cross-fades by
// activeIndex on nav — no per-arrow reload.
const MODAL_GLB_MODELS: ModelEntry[] = [
  { src: "/glb/santorini.glb" },
  { src: "/glb/aloha.glb" },
  { src: "/glb/gaia.glb" },
  { src: "/glb/kyoto.glb" },
];

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

// (Letter-by-letter reveal removed — ingredient text now renders statically.)

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

/** The decorative scene (mandala backdrop + scattered fruit), positioned in the
 *  1920×1080 space via the ambient `--u`. Used by both the desktop stage and the
 *  mobile cover layer. */
function Scene({ f }: { f: Flavor }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={f.pattern} alt="" className="pointer-events-none absolute -translate-x-1/2" style={{ left: "50%", top: u(-1165.4), width: u(1920), height: u(1920) }} />
      {f.fruits.map((fr, i) => (
        <FruitImg key={i} f={fr} />
      ))}
    </>
  );
}

export default function FlavorModal({
  index,
  origin,
  onClose,
  onNav,
}: {
  index: number;
  origin: { x: number; y: number };
  onClose: () => void;
  onNav: (dir: number) => void;
}) {
  // true once the initial open animation completes — enables nav scale transitions
  const [outerReady, setOuterReady] = useState(false);
  useEffect(() => { const id = setTimeout(() => setOuterReady(true), 900); return () => clearTimeout(id); }, []);

  const desktopGlbRef = useRef<GlbViewerHandle>(null);
  const mobileGlbRef  = useRef<GlbViewerHandle>(null);

  // The GLB always renders above the modal's scene/text (high z-index set on the
  // viewer itself, below). Clicking the stage lays the bottle flat at +90°.
  const liftGlb = () => {
    desktopGlbRef.current?.tiltTo90();
    mobileGlbRef.current?.tiltTo90();
  };

  useEffect(() => {
    // Spin is handled by the viewer's spinOnMount as the new model loads.
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
  }, [onClose, onNav]);

  const f = FLAVORS[index];

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${f.name} cocktail`}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ originX: origin.x, originY: origin.y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        scale:   { type: "tween", duration: 0.9, ease: [0.16, 1, 0.3, 1] },
        opacity: { type: "tween", duration: 0.3, ease: "easeOut" },
      }}
    >
      {/* Background layer lives outside AnimatePresence so it keeps the correct
          color while exiting content is still on screen with the OLD flavor. */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ backgroundColor: f.bg }}
        transition={{ type: "tween", duration: 0.25, delay: 0.4 }}
      />

      {/* ───────── Desktop / tablet: 16:9 stage that fits inside the viewport ───────── */}
      <div className="hidden size-full md:flex md:items-center md:justify-center">
        <div
          onClick={liftGlb}
          className="relative overflow-hidden w-full"
          style={{ aspectRatio: "16 / 9", containerType: "inline-size", ["--u" as string]: "calc(100cqw / 1920)" }}
        >
          {/* GLB: persistent — stays visible while scene/text transitions */}
          <GlbViewer
            ref={desktopGlbRef}
            models={MODAL_GLB_MODELS}
            activeIndex={index}
            initialTilt={0}
            noScroll
            style={{
              position: "absolute",
              left: "50%",
              top: `calc(50% - ${u(150)})`,
              transform: "translate(-50%, -50%)",
              // Wider than the bottle so the spin/tilt is never clipped by the
              // canvas. Same camera FOV → identical on-screen size.
              width: u(1200),
              height: u(1440),
              pointerEvents: "none",
              zIndex: 40,
            }}
          />

          {/* Scene + ingredients: animate on nav, scale from centre where GLB sits */}
          <AnimatePresence mode="wait">
            <motion.div
              key={f.key}
              className="absolute inset-0"
              style={{ originX: 0.5, originY: 0.36 }}
              initial={outerReady ? { scale: 0, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "tween", duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Flavour colour rides WITH the scene so it funnels into / bursts out of the bottle */}
              <div className="absolute inset-0" style={{ backgroundColor: f.bg }} />
              <Scene f={f} />
              <div className="absolute inset-x-0 flex flex-col items-center" style={{ bottom: u(210), gap: u(14), color: f.textColor }}>
                <p aria-label="Ingredients" className="whitespace-nowrap uppercase" style={{ fontFamily: "var(--font-mono-label)", fontSize: u(16), lineHeight: 0.87, letterSpacing: u(1.12) }}>
                  Ingredients
                </p>
                <div className="text-center" style={{ fontFamily: "var(--font-body)", fontSize: u(24), lineHeight: 1.6, letterSpacing: u(0.24), width: u(465.222) }}>
                  <p className="mb-0" aria-label={f.ingredients[0]}>
                    {f.ingredients[0]}
                  </p>
                  <p aria-label={f.ingredients[1]}>
                    {f.ingredients[1]}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav row: persistent — always visible */}
          <div className="absolute inset-x-0 flex items-center justify-between" style={{ bottom: u(40), padding: `0 ${u(60)}` }}>
            <button type="button" aria-label="Previous flavour" onClick={(e) => { e.stopPropagation(); onNav(-1); }} className="cursor-pointer">
              <Chevron color={f.nameColor} flip />
            </button>
            <p className="text-center font-bold uppercase" style={{ fontFamily: "var(--font-display)", fontSize: u(160), lineHeight: 0.8, letterSpacing: u(-12.8), color: f.nameColor, width: u(760.75) }}>
              {f.name}
            </p>
            <button type="button" aria-label="Next flavour" onClick={(e) => { e.stopPropagation(); onNav(1); }} className="cursor-pointer">
              <Chevron color={f.nameColor} />
            </button>
          </div>

          <button type="button" aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute cursor-pointer" style={{ left: u(1813.9), top: u(36), width: u(60), height: u(60) }}>
            <CloseIcon color={f.textColor} />
          </button>
        </div>
      </div>

      {/* ───────── Mobile: scene covers the screen, controls fit the viewport ───────── */}
      <div onClick={liftGlb} className="absolute inset-0 md:hidden">
        {/* GLB: persistent */}
        <GlbViewer
          ref={mobileGlbRef}
          models={MODAL_GLB_MODELS}
          activeIndex={index}
          initialTilt={0}
          noScroll
          style={{
            position: "absolute",
            left: "50%",
            top: "42%",
            transform: "translate(-50%, -50%)",
            // Wider than the bottle so the spin/tilt is never clipped by the canvas.
            width: "72vh",
            height: "84vh",
            pointerEvents: "none",
            zIndex: 40,
          }}
        />

        {/* Scene + text: animate on nav */}
        <AnimatePresence mode="wait">
          <motion.div
            key={f.key}
            className="absolute inset-0"
            style={{ originX: 0.5, originY: 0.42 }}
            initial={outerReady ? { scale: 0, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "tween", duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Flavour colour rides WITH the scene so it funnels into / bursts out of the bottle */}
            <div className="absolute inset-0" style={{ backgroundColor: f.bg }} />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden w-full"
              style={{ aspectRatio: "16 / 9", containerType: "inline-size", ["--u" as string]: "calc(100cqw / 1920)" }}
            >
              <Scene f={f} />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center px-6 pb-4" style={{ gap: "0.5rem", color: f.textColor }}>
              <p aria-label="Ingredients" className="whitespace-nowrap uppercase" style={{ fontFamily: "var(--font-mono-label)", fontSize: 11, lineHeight: 0.87, letterSpacing: "0.8px" }}>
                Ingredients
              </p>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5, maxWidth: "84vw" }}>
                <p className="mb-0" aria-label={f.ingredients[0]}>
                  {f.ingredients[0]}
                </p>
                <p aria-label={f.ingredients[1]}>
                  {f.ingredients[1]}
                </p>
              </div>
              <p
                className="text-center font-bold uppercase"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 13vw, 5.5rem)", lineHeight: 0.8, letterSpacing: "-0.06em", color: f.nameColor }}
              >
                {f.name}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <button type="button" aria-label="Previous flavour" onClick={(e) => { e.stopPropagation(); onNav(-1); }} className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer p-3">
          <Chevron color={f.nameColor} flip width="22px" height="43px" />
        </button>
        <button type="button" aria-label="Next flavour" onClick={(e) => { e.stopPropagation(); onNav(1); }} className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer p-3">
          <Chevron color={f.nameColor} width="22px" height="43px" />
        </button>

        <button type="button" aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute right-4 top-4 size-10 cursor-pointer">
          <CloseIcon color={f.textColor} />
        </button>
      </div>
    </motion.div>
  );
}
