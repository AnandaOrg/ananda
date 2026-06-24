"use client";

import { CSSProperties, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  frameBase: string;
  frameCount: number;
  alt: string;
  /** When true, plays frames in a continuous loop instead of scrubbing on scroll. */
  autoLoop?: boolean;
  /** Playback speed for autoLoop in frames-per-second. Default 24. */
  fps?: number;
  className?: string;
  style?: CSSProperties;
};

export default function ScrollVideoCanvas({
  frameBase,
  frameCount,
  alt,
  autoLoop = false,
  fps = 24,
  className,
  style,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const frames: HTMLImageElement[] = new Array(frameCount);
    let loadedCount = 0;
    const obj = { frame: 0 };

    function sizeCanvas() {
      if (!canvas || !wrap) return;
      // Use offsetWidth/offsetHeight (layout dims, pre-transform) not getBoundingClientRect,
      // which would return transposed dimensions when a parent has a 90° rotation.
      const width = wrap.offsetWidth;
      const height = wrap.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    function drawFrame(index: number) {
      const img = frames[Math.round(index)];
      if (!canvas || !ctx || !img?.complete || img.naturalWidth === 0) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    sizeCanvas();

    const ro = new ResizeObserver(() => {
      sizeCanvas();
      drawFrame(obj.frame);
    });
    ro.observe(wrap);

    // Lazy-load frames once section nears viewport
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();

        for (let i = 0; i < frameCount; i++) {
          const n = String(i + 1).padStart(3, "0");
          const img = new Image();
          img.src = `${frameBase}${n}.jpg`;
          img.onload = () => {
            loadedCount++;
            if (loadedCount === 1) drawFrame(0);
          };
          frames[i] = img;
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(wrap);

    let rafId = 0;
    let tween: gsap.core.Tween | null = null;

    if (autoLoop) {
      const msPerFrame = 1000 / fps;
      let lastTime = 0;
      let currentFrame = 0;

      const loop = (now: number) => {
        rafId = requestAnimationFrame(loop);
        if (now - lastTime < msPerFrame) return;
        lastTime = now;
        currentFrame = (currentFrame + 1) % frameCount;
        drawFrame(currentFrame);
      };
      rafId = requestAnimationFrame(loop);
    } else {
      // GSAP ScrollTrigger with scrub: 1 (1-second smoothing)
      tween = gsap.to(obj, {
        frame: frameCount - 1,
        ease: "none",
        onUpdate: () => drawFrame(obj.frame),
        scrollTrigger: {
          trigger: wrap,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    }

    return () => {
      cancelAnimationFrame(rafId);
      tween?.scrollTrigger?.kill();
      tween?.kill();
      ro.disconnect();
      io.disconnect();
    };
  }, [frameBase, frameCount, autoLoop, fps]);

  return (
    <div ref={wrapRef} className={className} style={style} aria-label={alt} role="img">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
