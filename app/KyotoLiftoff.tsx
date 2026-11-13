"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useTranslations } from "next-intl";
import SpillWave from "./SpillWave";
import { LinkWrap, useMediaAsset } from "./MediaProvider";
import Image from "next/image";
import MediaSkeleton, { SkeletonImage, useMediaLoaded } from "./MediaSkeleton";

const u = (n: number) => `calc(var(--u) * ${n})`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smoothstep = (t: number) => t * t * (3 - 2 * t);

const VIDEO_SRC = "/videos/kyoto.mp4";

const FROM = 0.55;
const TO = 0.12;
const FADE_END = 0.22;
const EMERGE_END = 0.35;
const ROT_DELAY = 0.3;
const EMERGE_SCALE = 0.8;
const EMERGE_DX = 0;
const EMERGE_DY = 0;
const LIFT_U = 150;
const TIP_DROP = 260;
const GROW = 0.12;
const ROT_START = 0;
const ROT_END = 160;
const PANEL_W = 789.24;
const SCENE_H = 905.94;
const POUCH_W = 740;
const POUCH_X = "50%";
const POUCH_Y = "65%";
const WAVE_FLOOR_Y = 1301.643;
const SPILL_OVERLAP = 100;
const CANVAS_W = 1440;
const POUCH_CX = (parseFloat(POUCH_X) / 100) * PANEL_W;
const POUCH_CY = (parseFloat(POUCH_Y) / 100) * SCENE_H;
const CAP_D = 315;
const SPILL_Y_PUSH = -10;
const WAVE_PEAK_X = 0.42;
const SPILL_W = CANVAS_W * 1.45;
const CAP_RAD_SETTLED = (ROT_END * Math.PI) / 180;
const SCALE_SETTLED = 1 + GROW;
const CAP_D_SETTLED = CAP_D * SCALE_SETTLED;
const CAP_X_SETTLED = POUCH_CX + CAP_D_SETTLED * Math.sin(CAP_RAD_SETTLED);
const CAP_Y_SETTLED =
  POUCH_CY - LIFT_U + TIP_DROP - CAP_D_SETTLED * Math.cos(CAP_RAD_SETTLED) + SPILL_Y_PUSH;
const SPILL_LEFT = CAP_X_SETTLED - WAVE_PEAK_X * SPILL_W;
const SPILL_H = Math.max(0, WAVE_FLOOR_Y + SPILL_OVERLAP - CAP_Y_SETTLED);
const POUR_ROT_START = 135;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function KyotoLiftoff({
  posLeft = 297.52,
  posTop = 1878.54,
}: {
  posLeft?: number;
  posTop?: number;
} = {}) {
  const tA11y = useTranslations("a11y");
  const wrapRef = useRef<HTMLDivElement>(null);
  const pouchRef = useRef<HTMLDivElement>(null);
  const spillRef = useRef<HTMLDivElement>(null);
  const spillInnerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const { loaded: videoLoaded, mediaRef: videoMediaRef, onLoadedData: onVideoLoaded } = useMediaLoaded();
  const engagedRef = useRef(false);
  const spillAliveRef = useRef(false);
  const spillIdleRef = useRef<gsap.core.Tween | null>(null);
  const background = useMediaAsset("/kyoto/kyoto-background.png");
  const pouchImage = useMediaAsset("/kyoto/kyoto-image.png");

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    if (prefersReducedMotion()) {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.style.display = "none";
      }
      if (bgRef.current) bgRef.current.style.opacity = "1";
      const pouch = pouchRef.current;
      if (pouch) {
        pouch.style.opacity = "1";
        pouch.style.transform = "translate(-50%, -50%)";
      }
      const spill = spillRef.current;
      if (spill) {
        spill.style.opacity = "1";
        spill.style.transform = "translate(0px, 0px) scale(1)";
      }
      return;
    }
    let raf = 0;
    let srcLoaded = false;
    const ensureLoaded = () => {
      const video = videoRef.current;
      if (srcLoaded || !video) return;
      srcLoaded = true;
      video.src = VIDEO_SRC;
      video.load();
    };

    const update = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const centerY = rect.top + rect.height / 2;
      const p = clamp((FROM * vh - centerY) / ((FROM - TO) * vh), 0, 1);

      if (p > 0 && !engagedRef.current) {
        engagedRef.current = true;
        videoRef.current?.pause();
      } else if (p === 0 && engagedRef.current) {
        engagedRef.current = false;
        ensureLoaded();
        videoRef.current?.play().catch(() => {});
      }

      const fade = smoothstep(clamp(p / FADE_END, 0, 1));
      if (videoRef.current) videoRef.current.style.opacity = (1 - fade).toFixed(3);
      if (bgRef.current) bgRef.current.style.opacity = fade.toFixed(3);

      const rp = smoothstep(clamp((p - ROT_DELAY) / (1 - ROT_DELAY), 0, 1));
      const rot = ROT_START + (ROT_END - ROT_START) * rp;
      const emerge = smoothstep(clamp(p / EMERGE_END, 0, 1));
      const scale = (EMERGE_SCALE + (1 - EMERGE_SCALE) * emerge) * (1 + GROW * p);
      const pouch = pouchRef.current;
      if (pouch) {
        const dx = EMERGE_DX * (1 - emerge);
        const dy = EMERGE_DY * (1 - emerge) - LIFT_U * p + TIP_DROP * rp;
        pouch.style.opacity = clamp(p / 0.12, 0, 1).toFixed(3);
        pouch.style.transform = `translate(-50%, -50%) translate(calc(var(--u) * ${dx.toFixed(
          2
        )}), calc(var(--u) * ${dy.toFixed(2)})) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(
          2
        )}deg)`;
      }

      const spill = spillRef.current;
      if (spill) {
        const pourProg = smoothstep(
          clamp((rot - POUR_ROT_START) / (ROT_END - POUR_ROT_START), 0, 1)
        );
        const rad = (rot * Math.PI) / 180;
        const capD = CAP_D * scale;
        const capX = POUCH_CX + capD * Math.sin(rad);
        const capY = POUCH_CY - LIFT_U * p + TIP_DROP * rp - capD * Math.cos(rad) + SPILL_Y_PUSH;
        const dx = capX - CAP_X_SETTLED;
        const dy = capY - CAP_Y_SETTLED;
        const pourOpacity = clamp(pourProg / 0.1, 0, 1);
        spill.style.opacity = pourOpacity.toFixed(3);
        spill.style.transform = `translate(${u(dx)}, ${u(dy)}) scale(${pourProg.toFixed(4)})`;

        const alive = pourProg >= 0.15;
        if (alive && !spillAliveRef.current) {
          spillAliveRef.current = true;
          const inner = spillInnerRef.current;
          if (inner) {
            spillIdleRef.current = gsap.to(inner, {
              scaleX: 1.02,
              skewX: 1.1,
              duration: 4,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
          }
        } else if (!alive && spillAliveRef.current) {
          spillAliveRef.current = false;
          spillIdleRef.current?.kill();
          spillIdleRef.current = null;
          if (spillInnerRef.current) gsap.set(spillInnerRef.current, { scaleX: 1, skewX: 0 });
        }
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    let io: IntersectionObserver | undefined;
    const video = videoRef.current;
    if (video) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (engagedRef.current) return;
          if (entry.isIntersecting) {
            ensureLoaded();
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        },
        { threshold: 0.25 }
      );
      io.observe(wrap);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      spillIdleRef.current?.kill();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="absolute"
      style={{ left: u(posLeft), top: u(posTop), width: u(PANEL_W), height: u(SCENE_H) }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 2 }}>
        <MediaSkeleton hidden={videoLoaded} />
        {background.active && (
          <Image
            ref={bgRef}
            src={background.url}
            alt=""
            aria-hidden="true"
            fill
            sizes="55vw"
            className="pointer-events-none object-cover"
            style={{ opacity: 0 }}
          />
        )}

        <video
          ref={(el) => { videoRef.current = el; videoMediaRef(el); }}
          onLoadedData={onVideoLoaded}
          className="pointer-events-none absolute inset-0 size-full object-cover"
          style={{ opacity: 1, willChange: "opacity" }}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />

      </div>

      <div
        ref={spillRef}
        className="pointer-events-none absolute"
        style={{
          left: u(SPILL_LEFT),
          top: u(CAP_Y_SETTLED),
          width: u(SPILL_W),
          height: u(SPILL_H),
          zIndex: 3,
          opacity: 0,
          transform: "scale(0)",
          transformOrigin: `${(WAVE_PEAK_X * 100).toFixed(2)}% 0%`,
          willChange: "transform, opacity",
        }}
      >
        <div
          ref={spillInnerRef}
          className="size-full"
          style={{ transformOrigin: `${(WAVE_PEAK_X * 100).toFixed(2)}% 0%` }}
        >
          <SpillWave />
        </div>
      </div>

      <div
        className="pointer-events-none absolute"
        style={{ left: 0, top: 0, width: u(PANEL_W), height: u(SCENE_H), zIndex: 4 }}
      >
        <div
          ref={pouchRef}
          className="pointer-events-none absolute"
          style={{
            left: u(POUCH_CX),
            top: u(POUCH_CY),
            width: u(POUCH_W),
            height: u(POUCH_W),
            opacity: 0,
            transform: `translate(-50%, -50%) translate(${u(EMERGE_DX)}, ${u(
              EMERGE_DY
            )}) scale(${EMERGE_SCALE})`,
            transformOrigin: "50% 50%",
            willChange: "transform, opacity",
          }}
        >
          {pouchImage.active && (
            <LinkWrap href={pouchImage.link} fill>
              <SkeletonImage
                src={pouchImage.url}
                alt={tA11y("kyotoPouch")}
                fill
                sizes="35vw"
                className="select-none"
              />
            </LinkWrap>
          )}
        </div>
      </div>
    </div>
  );
}
