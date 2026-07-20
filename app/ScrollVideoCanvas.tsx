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
    const frames: (HTMLImageElement | undefined)[] = new Array(frameCount);
    let loaded = false;
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

    // Decode every frame into an HTMLImageElement. Held only while the section is
    // near the viewport (see the observer below).
    function loadFrames() {
      if (loaded) return;
      loaded = true;
      for (let i = 0; i < frameCount; i++) {
        const n = String(i + 1).padStart(3, "0");
        const img = new Image();
        img.src = `${frameBase}${n}.jpg`;
        // Redraw only the frame we're currently parked on as it arrives, so a
        // reload after an unload doesn't snap the canvas back to frame 0.
        img.onload = () => {
          if (Math.round(obj.frame) === i) drawFrame(i);
        };
        frames[i] = img;
      }
    }

    // Free the decoded bitmaps. iOS Safari counts these against the tab's memory
    // budget; two frame sequences (240 bitmaps) held at once is enough to crash
    // it. The last-drawn frame stays painted on the canvas, so unloading is
    // invisible until re-entry reloads.
    function unloadFrames() {
      if (!loaded) return;
      loaded = false;
      for (let i = 0; i < frameCount; i++) {
        const img = frames[i];
        if (img) {
          img.onload = null;
          img.src = "";
        }
        frames[i] = undefined;
      }
    }

    // Load when near the viewport, release when it leaves — keeps at most the
    // active section's frames resident.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadFrames();
        else unloadFrames();
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
