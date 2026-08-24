"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type Item = { src: string; alt: string; link?: string | null };

const COPIES = 3;
const SCROLL_SETTLE_MS = 150;
const CLICK_DRAG_THRESHOLD = 6;

export default function WildCarousel({
  items,
  slideW,
  slideH,
  gap,
  pad = "0px",
  snapAlign = "center",
  snapType = "mandatory",
  startIndex = 0,
  autoplay,
}: {
  items: Item[];
  slideW: string;
  slideH: string;
  gap: string;
  pad?: string;
  snapAlign?: "center" | "start";
  snapType?: "mandatory" | "proximity" | "none";
  startIndex?: number;
  autoplay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, lastX: 0, lastT: 0, v: 0 });
  const didDrag = useRef(false);
  const oneCopy = useRef(0);
  const raf = useRef(0);
  const momentum = useRef(0);
  const interacting = useRef(false);
  const autoRaf = useRef(0);
  const autoTime = useRef(0);
  const scrollPos = useRef(0);
  const lastUserScroll = useRef(0);
  const programmatic = useRef(false);

  const n = items.length;
  const looped = Array.from({ length: COPIES }, () => items).flat();

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const measure = () => {
      const a = c.children[0] as HTMLElement | undefined;
      const b = c.children[n] as HTMLElement | undefined;
      if (a && b) oneCopy.current = b.offsetLeft - a.offsetLeft;
    };
    const center = () => {
      const t = c.children[n + Math.min(startIndex, n - 1)] as HTMLElement | undefined;
      if (t) c.scrollLeft = snapAlign === "center" ? t.offsetLeft - (c.clientWidth - t.clientWidth) / 2 : t.offsetLeft;
    };
    measure();
    center();

    const wrap = () => {
      const oc = oneCopy.current;
      if (!oc) return;
      const x = c.scrollLeft;
      if (x < oc * 0.5) {
        programmatic.current = true;
        c.scrollLeft = x + oc;
        scrollPos.current += oc;
        if (drag.current.active) drag.current.startScroll += oc;
      } else if (x > oc * 1.5) {
        programmatic.current = true;
        c.scrollLeft = x - oc;
        scrollPos.current -= oc;
        if (drag.current.active) drag.current.startScroll -= oc;
      }
    };
    const onScroll = () => {
      if (programmatic.current) programmatic.current = false;
      else lastUserScroll.current = performance.now();
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        wrap();
      });
    };
    const onResize = () => {
      measure();
      center();
    };

    c.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    let io: IntersectionObserver | undefined;
    if (autoplay) {
      autoTime.current = 0;
      const loop = (t: number) => {
        const settled = !interacting.current && t - lastUserScroll.current > SCROLL_SETTLE_MS;
        if (settled) {
          if (ref.current) {
            if (autoTime.current > 0) {
              const dt = Math.min(t - autoTime.current, 50);
              scrollPos.current += autoplay * Math.sqrt(dt / 1000);
              programmatic.current = true;
              ref.current.scrollLeft = Math.round(scrollPos.current);
            } else {
              scrollPos.current = ref.current.scrollLeft;
            }
          }
          autoTime.current = t;
        } else {
          autoTime.current = 0;
        }
        autoRaf.current = requestAnimationFrame(loop);
      };
      let running = false;
      io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          autoTime.current = 0;
          autoRaf.current = requestAnimationFrame(loop);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(autoRaf.current);
        }
      });
      io.observe(c);
    }

    return () => {
      c.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      io?.disconnect();
      if (raf.current) cancelAnimationFrame(raf.current);
      if (momentum.current) cancelAnimationFrame(momentum.current);
      if (autoRaf.current) cancelAnimationFrame(autoRaf.current);
    };
  }, [n, startIndex, snapAlign, autoplay]);

  const stopMomentum = () => {
    if (momentum.current) cancelAnimationFrame(momentum.current);
    momentum.current = 0;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    interacting.current = true;
    didDrag.current = false;
    if (e.pointerType !== "mouse") return;
    const c = ref.current;
    if (!c) return;
    stopMomentum();
    drag.current = { active: true, startX: e.clientX, startScroll: c.scrollLeft, lastX: e.clientX, lastT: performance.now(), v: 0 };
    c.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = ref.current;
    if (!c || !drag.current.active) return;
    if (Math.abs(e.clientX - drag.current.startX) > CLICK_DRAG_THRESHOLD) didDrag.current = true;
    const now = performance.now();
    const dt = Math.max(1, now - drag.current.lastT);
    drag.current.v = (e.clientX - drag.current.lastX) / dt;
    drag.current.lastX = e.clientX;
    drag.current.lastT = now;
    c.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  };
  /** Suppresses the click that would otherwise fire on whatever slide ends up under
   *  the cursor after a mouse-drag scroll — without this, dragging past a linked
   *  slide would spuriously "click" it and open its link. */
  const onSlideClick = (e: React.MouseEvent) => {
    if (didDrag.current) {
      e.preventDefault();
      didDrag.current = false;
    }
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    interacting.current = false;
    const c = ref.current;
    if (!c || !drag.current.active) return;
    drag.current.active = false;
    c.releasePointerCapture?.(e.pointerId);
    let v = drag.current.v;
    if (Math.abs(v) < 0.05) return;
    const friction = 0.5;
    const tick = () => {
      v *= friction;
      if (Math.abs(v) < 0.02) {
        momentum.current = 0;
        return;
      }
      c.scrollLeft -= v * 16;
      momentum.current = requestAnimationFrame(tick);
    };
    momentum.current = requestAnimationFrame(tick);
  };

  const alignClass = snapAlign === "center" ? "snap-center" : "snap-start";

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="flex cursor-grab select-none overflow-x-auto active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ gap, paddingInline: pad, scrollBehavior: "auto", overscrollBehaviorX: "contain", scrollSnapType: snapType === "none" ? "none" : `x ${snapType}` }}
    >
      {looped.map((p, i) => (
        <div key={i} className={`relative shrink-0 overflow-hidden ${snapType === "none" ? "" : alignClass}`} style={{ width: slideW, height: slideH }}>
          <Image
            src={p.src}
            alt={p.alt}
            fill
            sizes="40vw"
            draggable={false}
            className="pointer-events-none object-cover"
            loading={i === n + Math.min(startIndex, n - 1) ? "eager" : "lazy"}
          />
          {p.link && (
            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onSlideClick}
              className="absolute inset-0 z-10"
              style={{ pointerEvents: "auto" }}
              aria-label={p.alt}
            />
          )}
        </div>
      ))}
    </div>
  );
}
