import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import type { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollToPlugin);

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export interface LockedGalleryStepperOptions {
  /** The already-created scrubbed ScrollTrigger driving this section's pin. */
  trigger: ScrollTrigger;
  /** Fraction of the pin's progress where the gallery-stepping phase begins. */
  boundary: number;
  /** Number of gallery slides stepped through between `boundary` and progress 1. */
  count: number;
  /** Seconds the scroll-position jump between slides takes. */
  jumpDuration?: number;
  /** Seconds input is swallowed after a jump, so each slide is seen before the next can trigger. */
  lockDuration?: number;
  /** Minimum vertical touch drag (px) that counts as one gesture. */
  touchThreshold?: number;
}

/**
 * Caps a scrubbed ScrollTrigger's gallery-stepping tail (progress from
 * `boundary` to 1, evenly split into `count` slides) to one slide per scroll
 * gesture, no matter how hard or fast the user scrolls or flings. Wheel/touch
 * input inside that range is intercepted and converted into a single
 * deliberate jump of the real scroll position, one slide at a time — the
 * caller's existing scrub `onUpdate` keeps deriving the slide index from
 * progress exactly as before, so this only throttles how fast progress is
 * allowed to move through that stretch. At either edge (first/last slide)
 * input passes straight through untouched so the pin still releases
 * naturally into whatever comes before/after it.
 */
export function attachLockedGalleryStepper({
  trigger,
  boundary,
  count,
  jumpDuration = 0.3,
  lockDuration = 0.75,
  touchThreshold = 24,
}: LockedGalleryStepperOptions) {
  const interval = (1 - boundary) / count;
  let locked = false;
  let inZone = false;
  let touchY = 0;
  let activeTween: gsap.core.Tween | null = null;
  let pendingUnlock: gsap.core.Tween | null = null;

  const stepIndex = (prog: number) =>
    clamp(Math.floor(((prog - boundary) / (1 - boundary)) * count), 0, count - 1);

  const jumpTo = (targetProg: number) => {
    const y = trigger.start + clamp(targetProg, 0, 1) * (trigger.end - trigger.start);
    locked = true;
    activeTween?.kill();
    activeTween = gsap.to(window, {
      scrollTo: { y, autoKill: false },
      duration: jumpDuration,
      ease: "power2.inOut",
    });
    pendingUnlock?.kill();
    pendingUnlock = gsap.delayedCall(lockDuration, () => { locked = false; });
  };

  // Returns true when this gesture was consumed (caller should preventDefault it).
  const tryStep = (dir: 1 | -1) => {
    const prog = trigger.progress;
    if (prog < boundary || prog >= 1) return false; // outside the stepping zone
    if (locked) return true; // mid-jump — swallow the extra input
    const next = stepIndex(prog) + dir;
    if (next < 0 || next > count - 1) return false; // at an edge — release
    jumpTo(boundary + next * interval);
    return true;
  };

  const onWheel = (e: WheelEvent) => {
    if (tryStep(e.deltaY > 0 ? 1 : -1)) e.preventDefault();
  };

  const onTouchStart = (e: TouchEvent) => {
    touchY = e.touches[0].clientY;
    inZone = trigger.progress >= boundary && trigger.progress < 1;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!inZone) {
      const prog = trigger.progress;
      if (prog >= boundary && prog < 1) {
        // Crossed into the zone mid-drag — start tracking fresh from here so
        // at most one touchmove tick's worth of native scroll leaks through.
        inZone = true;
        touchY = e.touches[0].clientY;
        e.preventDefault();
      }
      return;
    }
    const dy = touchY - e.touches[0].clientY; // positive: finger moved up (scrolling down)
    if (Math.abs(dy) < touchThreshold) { e.preventDefault(); return; }
    if (tryStep(dy > 0 ? 1 : -1)) {
      e.preventDefault();
      touchY = e.touches[0].clientY;
    } else {
      inZone = false; // at an edge — let the rest of this drag exit natively
    }
  };

  const onTouchEnd = () => { inZone = false; };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    activeTween?.kill();
    pendingUnlock?.kill();
  };
}
