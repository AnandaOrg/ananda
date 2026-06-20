"use client";

import { CSSProperties, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  frameBase: string;
  frameCount: number;
  alt: string;
  className?: string;
  style?: CSSProperties;
};

export default function ScrollVideoCanvas({
  frameBase,
  frameCount,
  alt,
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
      const { width, height } = wrap.getBoundingClientRect();
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

    // GSAP ScrollTrigger with scrub: 1 (1-second smoothing)
    const tween = gsap.to(obj, {
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

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      ro.disconnect();
      io.disconnect();
    };
  }, [frameBase, frameCount]);

  return (
    <div ref={wrapRef} className={className} style={style} aria-label={alt} role="img">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
