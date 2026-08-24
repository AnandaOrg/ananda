"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mu, MU_VAR } from "./scale";
import { useFlavor, wasFlavorModalOpenAtDeath } from "../FlavorProvider";
import GlbViewer, { type GlbViewerHandle } from "../GlbViewer";
import LiquidText from "../LiquidText";
import { LinkWrap, useMediaAsset } from "../MediaProvider";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const asset = useMediaAsset(src);
  const place: React.CSSProperties = center
    ? { left: `calc(50% + ${mu(center.x)})`, top: `calc(50% + ${mu(center.y)})`, width: mu(center.width), height: mu(center.height), transform: "translate(-50%, -50%)" }
    : { left: mu(box!.left), top: mu(box!.top), width: mu(box!.width), height: mu(box!.height) };

  if (!asset.active) return null;

  return (
    <div className="pointer-events-none absolute flex items-center justify-center" style={place}>
      <div style={{ transform: `rotate(${rotate}deg)` }}>
        <div className="relative overflow-hidden" style={{ width: mu(inner.width), height: mu(inner.height), boxShadow: shadow ? `${mu(4.911)} ${mu(3.571)} ${mu(12.812)} 0 rgba(0,0,0,0.25)` : undefined }}>
          <LinkWrap href={asset.link} fill>
            {crop ? (
              <img src={asset.url} alt={alt} loading="lazy" decoding="async" className="absolute max-w-none" style={{ width: crop.width, height: crop.height, left: crop.left, top: crop.top }} />
            ) : (
              <Image src={asset.url} alt={alt} fill sizes="50vw" className="object-cover" />
            )}
          </LinkWrap>
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

const GLB_MODELS = [
  { src: "/glb/santorini.glb" },
  { src: "/glb/aloha.glb", transitionAt: 0.247 },
  { src: "/glb/gaia.glb", transitionAt: 0.504 },
  { src: "/glb/kyoto.glb", transitionAt: 0.762 },
];

const GLB_TRANSITION_DURATION = 0.04;

export default function MobilePathways() {
  const t = useTranslations("flavors");
  const locale = useLocale();
  const { open } = useFlavor();
  const glbRef = useRef<GlbViewerHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const kyotoAutoOpenedRef = useRef(false);
  const modalOpenedRef = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const glbWrapRef = useRef<HTMLDivElement>(null);
  const [glbReady, setGlbReady] = useState(false);
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
    const suspendTimer = setTimeout(() => glbRef.current?.suspend(), 3600);
    setTimeout(() => open(i, origin,
      () => {
        html.style.overflow = prevHtmlOverflow;
        clearTimeout(suspendTimer);
        glbRef.current?.resume();
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
    if (!section) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        setGlbReady(true);
      },
      { rootMargin: "600px" }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const scrollTrigger = { trigger: section, start: "top 80%", once: true } as const;
      gsap.from(content, { opacity: 0, y: -40, duration: 0.9, ease: "power3.out", scrollTrigger });
      if (glbWrapRef.current) {
        gsap.from(glbWrapRef.current, { opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger });
      }
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden bg-[#eb4638] md:hidden" style={{ containerType: "inline-size", ...MU_VAR }}>
      <div ref={contentRef} className="relative overflow-hidden" style={{ width: mu(390), height: mu(1176) }}>
        {BANDS.map((b, i) => (
          <button key={b.color} type="button" aria-label={`Open ${FLAVORS[i].label}`} onClick={() => openWithSpin(i)} className="absolute cursor-pointer appearance-none border-0 p-0" style={{ left: 0, top: mu(b.top), width: mu(390), height: mu(200), backgroundColor: b.color }} />
        ))}

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

        <div className="absolute flex flex-col items-start" style={{ left: mu(locale === "bg" ? 14 : 24), top: mu(43), width: mu(276.93), gap: mu(24) }}>
          <div className="flex flex-col items-start uppercase text-[#fff0e5]" style={{ gap: mu(16) }}>
            <p className="whitespace-nowrap" style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}>
              {t("eyebrow")}
            </p>
            <LiquidText
              text={t("title")}
              className="relative font-bold"
              style={{ fontFamily: "var(--font-display)", fontSize: locale === "bg" ? mu(56) : mu(64), lineHeight: 0.8, letterSpacing: locale === "bg" ? mu(-1.68) : mu(-5.12), width: locale === "bg" ? mu(342) : mu(276.93) }}
            />
          </div>
          <button type="button" onClick={() => openWithSpin(0)} className="flex cursor-pointer appearance-none items-center justify-center overflow-hidden border-0 bg-[#fff0e5]" style={{ padding: `${mu(8)} ${mu(12)}`, borderRadius: mu(25.016) }}>
            <div className="flex items-center" style={{ gap: mu(7.505) }}>
              <span className="whitespace-nowrap font-semibold uppercase text-[#eb4638]" style={{ fontFamily: "var(--font-display)", fontSize: mu(20), lineHeight: 0.8, letterSpacing: mu(-1.4), textBoxTrim: "trim-both", textBoxEdge: "cap alphabetic" } as React.CSSProperties}>
                {t("cta")}
              </span>
              {arrowIcon.active && <img src={arrowIcon.url} alt="" style={{ width: mu(7.822), height: mu(15.404) }} />}
            </div>
          </button>
        </div>

        <Floating src="/s4-mango.png" alt="Ripe mango" rotate={-7.55} box={{ left: -10.13, top: 514.54, width: 152.327, height: 173.139 }} inner={{ width: 132.855, height: 157.054 }} crop={{ width: "143.08%", height: "181.55%", left: "-22.78%", top: "-36.97%" }} />
        <Floating src="/s4-raspberry.png" alt="Fresh lychee" rotate={46.6} box={{ left: 25.53, top: 1066.39, width: 131.528, height: 131.411 }} inner={{ width: 91.51, height: 94.488 }} />
        <Floating src="/s4-lemon.png" alt="Fresh lemon with leaves" rotate={-8.95} box={{ left: 221.52, top: 260.19, width: 173.549, height: 199.915 }} inner={{ width: 147.461, height: 179.146 }} crop={{ width: "134.65%", height: "166.26%", left: "-22.14%", top: "-38.75%" }} />
        <Floating src="/s4-flowers.png" alt="White elderflower blossom" rotate={15.25} box={{ left: 230.24, top: 699.44, width: 179.055, height: 192.905 }} inner={{ width: 141.609, height: 161.344 }} />
        <div ref={scrollRef} aria-hidden className="pointer-events-none absolute" style={{ left: 0, top: mu(360), width: mu(1), height: mu(816), visibility: "hidden" }} />
      </div>

      <div
        ref={glbWrapRef}
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{ width: mu(390), height: mu(1176), zIndex: 50 }}
      >
        {glbReady && (
          <GlbViewer
            ref={glbRef}
            models={GLB_MODELS}
            transitionDuration={GLB_TRANSITION_DURATION}
            scrollRef={scrollRef}
            scrollTravel={mu(596.46)}
            onProgress={handleGlbProgress}
            dropCacheAfterParse
            style={{
              position: "absolute",
              left: `calc(50% - ${mu(408)})`,
              top: mu(72),
              width: mu(816),
              height: mu(816),
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </section>
  );
}
