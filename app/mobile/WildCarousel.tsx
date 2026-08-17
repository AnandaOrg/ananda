"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type Item = { src: string; alt: string };

const COPIES = 3; // render the set 3× and live in the middle copy for an infinite loop

/**
 * Infinite, swipeable / draggable scroll-snapped photo carousel.
 * - Touch (mobile): native horizontal scroll + snap.
 * - Mouse (desktop): click-and-drag to scroll, plus trackpad/wheel.
 *
 * Looping: the slides are rendered three times; we start in the middle copy and
 * silently shift `scrollLeft` by one copy-width whenever the scroll nears an
 * edge. Because the copies are identical the jump is invisible, so it scrolls
 * forever in either direction. Snap is disabled during a mouse drag (mandatory
 * snap otherwise fights every `scrollLeft` update and stutters) and restored on
 * release. `snapAlign="center"` centres the active slide (neighbour peeks);
 * `"start"` is a left-aligned filmstrip. `snapType="proximity"` feels looser.
 *
 * `autoplay` (px/s): when set, the carousel slowly drifts forward; interaction
 * pauses it and releases resume it without a position jump.
 */
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
  autoplay?: number; // pixels per second; omit to disable
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, lastX: 0, lastT: 0, v: 0 });
  const oneCopy = useRef(0);
  const raf = useRef(0);
  const momentum = useRef(0);
  const interacting = useRef(false);
  const autoRaf = useRef(0);
  const autoTime = useRef(0);
  // Full-precision autoplay position — `scrollLeft` only stores whole pixels,
  // so accumulating by reading it back each frame loses the sub-pixel
  // remainder almost every frame (autoplay speeds under ~1px/frame would
  // round away to nothing, which reads as "frozen"). This tracks the real
  // position separately and only ever writes the rounded pixel to the DOM.
  const scrollPos = useRef(0);

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
        c.scrollLeft = x + oc;
        scrollPos.current += oc;
        if (drag.current.active) drag.current.startScroll += oc;
      } else if (x > oc * 1.5) {
        c.scrollLeft = x - oc;
        scrollPos.current -= oc;
        if (drag.current.active) drag.current.startScroll -= oc;
      }
    };
    const onScroll = () => {
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

    // Autoplay: drift forward at `autoplay` px/s; pause while the user interacts
    // and reset the clock so there's no position jump on resume. The rAF loop
    // runs ONLY while the carousel is on screen — a strip near the bottom of
    // the page otherwise scrolls itself (rAF + scrollLeft write + scroll event)
    // every frame for the whole session, stealing main-thread time from the
    // scroll-driven animations the user is actually looking at.
    let io: IntersectionObserver | undefined;
    if (autoplay) {
      autoTime.current = 0;
      const loop = (t: number) => {
        if (!interacting.current) {
          if (ref.current) {
            if (autoTime.current > 0) {
              // cap dt so a backgrounded tab doesn't cause a position lurch on return;
              // sqrt easing makes slow speeds feel glidy rather than mechanical
              const dt = Math.min(t - autoTime.current, 50);
              scrollPos.current += autoplay * Math.sqrt(dt / 1000);
              ref.current.scrollLeft = Math.round(scrollPos.current);
            } else {
              // Fresh baseline (first active frame after mount, an interaction
              // pause, or momentum settling) — resync from the DOM's actual
              // position first so autoplay picks up from there, not wherever
              // it last left off.
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
          autoTime.current = 0; // fresh clock — no position jump on re-entry
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
    if (e.pointerType !== "mouse") return; // touch/pen use native scrolling
    const c = ref.current;
    if (!c) return;
    stopMomentum();
    drag.current = { active: true, startX: e.clientX, startScroll: c.scrollLeft, lastX: e.clientX, lastT: performance.now(), v: 0 };
    c.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = ref.current;
    if (!c || !drag.current.active) return;
    const now = performance.now();
    const dt = Math.max(1, now - drag.current.lastT);
    drag.current.v = (e.clientX - drag.current.lastX) / dt; // cursor px/ms
    drag.current.lastX = e.clientX;
    drag.current.lastT = now;
    c.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    interacting.current = false;
    const c = ref.current;
    if (!c || !drag.current.active) return;
    drag.current.active = false;
    c.releasePointerCapture?.(e.pointerId);
    // Inertia: a flick keeps gliding and decelerates; it stops wherever it lands (no snap).
    let v = drag.current.v;
    if (Math.abs(v) < 0.05) return; // a slow release just stays put
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

  // Drive scroll-snap explicitly: "none" = fully free (no stepping); otherwise snap on the x axis.
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
        </div>
      ))}
    </div>
  );
}
