"use client";

import { SkeletonImage, SkeletonImg } from "./MediaSkeleton";
import { useCallback, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useFlavor, wasFlavorModalOpenAtDeath } from "./FlavorProvider";
import GlbViewer, { type GlbViewerHandle } from "./GlbViewer";
import LiquidText from "./LiquidText";
import { LinkWrap, useMediaAsset } from "./MediaProvider";

gsap.registerPlugin(ScrollTrigger);

const u = (n: number) => `calc(var(--u) * ${n})`;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function Floating({ src, alt, rotate, inner, box, center, crop, shadow, sizes }: FloatingProps) {
  const asset = useMediaAsset(src);
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

  if (!asset.active) return null;

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
          <LinkWrap href={asset.link} fill>
            {crop ? (
              <SkeletonImg
                src={asset.url}
                alt={alt}
                loading="lazy"
                decoding="async"
                className="absolute max-w-none"
                style={{ width: crop.width, height: crop.height, left: crop.left, top: crop.top }}
              />
            ) : (
              <SkeletonImage src={asset.url} alt={alt} fill sizes={sizes ?? "40vw"} className="object-cover" />
            )}
          </LinkWrap>
        </div>
      </div>
    </div>
  );
}

const GLB_MODELS = [
  { src: "/glb/santorini.glb" },
  { src: "/glb/aloha.glb",    transitionAt: 0.247 },
  { src: "/glb/gaia.glb",     transitionAt: 0.504 },
  { src: "/glb/kyoto.glb",    transitionAt: 0.762 },
];

const GLB_TRANSITION_DURATION = 0.04;

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
  const t = useTranslations("flavors");
  const bg = useLocale() === "bg";
  const { open } = useFlavor();
  const glbRef = useRef<GlbViewerHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const kyotoAutoOpenedRef = useRef(false);
  const modalOpenedRef = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const glbWrapRef = useRef<HTMLDivElement>(null);
  const arrowIcon = useMediaAsset("/s4-arrow.svg");

  const openWithSpin = useCallback((i: number, onClosed?: () => void) => {
    modalOpenedRef.current = true;
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    glbRef.current?.spin();
    glbRef.current?.spin360();
    const rect = glbRef.current?.getRect() ?? new DOMRect();
    const origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
    setTimeout(() => glbRef.current?.spin360(), 1650);
    setTimeout(() => open(i, origin,
      () => {
        html.style.overflow = prevHtmlOverflow;
        glbRef.current?.resetTilt();
        onClosed?.();
      },
      () => glbRef.current?.spin360(),
    ), 2400);
  }, [open]);

  const KYOTO_INDEX = 3;
  const kyotoTransitionAt = GLB_MODELS[KYOTO_INDEX].transitionAt;
  const handleGlbProgress = useCallback(() => {
    if (kyotoAutoOpenedRef.current || modalOpenedRef.current || kyotoTransitionAt === undefined) return;
    if (glbRef.current?.getDominantIndex() !== KYOTO_INDEX) return;
    kyotoAutoOpenedRef.current = true;

    const el = scrollRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const absTop = rect.top + window.scrollY;
      const kyotoFrac = kyotoTransitionAt + GLB_TRANSITION_DURATION;
      const targetY = kyotoFrac * rect.height + absTop - window.innerHeight * 0.5;
      window.scrollTo({ top: targetY, behavior: "auto" });
    }

    openWithSpin(KYOTO_INDEX);
  }, [kyotoTransitionAt, openWithSpin]);

  useEffect(() => {
    if (wasFlavorModalOpenAtDeath()) modalOpenedRef.current = true;
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const scrollTrigger = { trigger: section, start: "top 80%", once: true } as const;
      gsap.from(content, { opacity: 0, y: -70, duration: 0.9, ease: "power3.out", scrollTrigger });
      if (glbWrapRef.current) {
        gsap.from(glbWrapRef.current, { opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger });
      }
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#eb4638]"
      style={{ containerType: "inline-size", ["--u" as string]: "calc(100cqw / 1440)" }}
    >
      <div
        ref={contentRef}
        className="relative mx-auto overflow-hidden"
        style={{ width: u(1440), height: u(2000) }}
      >
        <div className="absolute" style={{ left: u(81.75), top: u(212.79), padding: `${u(10)} ${u(14)}` }}>
          <p
            className="whitespace-nowrap uppercase text-[#fff0e5]"
            style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98) }}
            dangerouslySetInnerHTML={{ __html: t.raw("eyebrow") }}
          />
        </div>

        <LiquidText
          text={t("title")}
          className="absolute font-bold uppercase text-[#fff0e5]"
          style={{
            left: u(95.75),
            top: u(297.49),
            width: u(1102.287),
            fontFamily: "var(--font-display)",
            fontSize: u(bg ? 180 : 170),
            lineHeight: 0.8,
            letterSpacing: u(bg ? -5.4 : -14.4),
          }}
        />

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

        <Floating
          src="/s4-lemon.png"
          alt="Fresh lemon with leaves"
          rotate={-8.95}
          box={{ left: 1091.12, top: 511.44, width: 383.906, height: 442.232 }}
          inner={{ width: 326.198, height: 396.289 }}
          crop={{ width: "134.65%", height: "166.26%", left: "-22.14%", top: "-38.75%" }}
        />

        <Floating
          src="/s4-mango.png"
          alt="Ripe mango"
          rotate={-7.55}
          box={{ left: 34.77, top: 841.33, width: 336.961, height: 383 }}
          inner={{ width: 293.887, height: 347.418 }}
          crop={{ width: "143.08%", height: "181.55%", left: "-22.78%", top: "-36.97%" }}
        />

        <Floating
          src="/s4-flowers.png"
          alt="White elderflower blossom"
          rotate={15.25}
          box={{ left: 830.64, top: 1171.01, width: 396.087, height: 426.724 }}
          inner={{ width: 313.253, height: 356.907 }}
        />

        <Floating
          src="/s4-raspberry.png"
          alt="Fresh raspberry"
          rotate={46.6}
          box={{ left: 232.63, top: 1751.43, width: 290.952, height: 290.693 }}
          inner={{ width: 202.429, height: 209.017 }}
        />

        <div ref={scrollRef} aria-hidden className="pointer-events-none absolute" style={{ left: 0, top: u(720), width: u(1), height: u(1250), visibility: "hidden" }} />

        <button
          type="button"
          onClick={() => openWithSpin(0)}
          className="absolute flex cursor-pointer appearance-none items-center justify-center overflow-hidden border-0 bg-[#fff0e5]"
          style={{ ...(bg ? { right: u(25) } : { left: u(1125) }), top: u(48.25), padding: `${u(14)} ${u(24)}`, borderRadius: u(50.032) }}
        >
          <div className="flex items-center" style={{ gap: u(15.01) }}>
            <span
              className="whitespace-nowrap font-semibold uppercase text-[#eb4638]"
              style={{ fontFamily: "var(--font-display)", fontSize: u(40), lineHeight: 0.8, letterSpacing: u(-2.8), textBoxTrim: "trim-both", textBoxEdge: "cap alphabetic" } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: t.raw("cta") }}
            />
            {arrowIcon.active && <img src={arrowIcon.url} alt="" style={{ width: u(15.644), height: u(30.807) }} />}
          </div>
        </button>
      </div>

      <div
        ref={glbWrapRef}
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{ width: u(1440), height: u(2000), zIndex: 50 }}
      >
        <GlbViewer
          ref={glbRef}
          models={GLB_MODELS}
          transitionDuration={GLB_TRANSITION_DURATION}
          scrollRef={scrollRef}
          scrollTravel={u(965)}
          onProgress={handleGlbProgress}
          style={{
            position: "absolute",
            left: u(60),
            top: u(242),
            width: u(1250),
            height: u(1250),
            pointerEvents: "none",
          }}
        />
      </div>
    </section>
  );
}
