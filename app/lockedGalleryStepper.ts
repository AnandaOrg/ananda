import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import type { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollToPlugin);

export interface LockedGalleryStepperOptions {
  /** The already-created scrubbed ScrollTrigger driving this section's pin. */
  trigger: ScrollTrigger;
  /** Fraction of the pin's progress where the gallery-stepping phase begins. */
  boundary: number;
  /** Number of gallery slides stepped through once in the zone. */
  count: number;
  /** Current slide index — read fresh on every gesture, never cached. */
  getIndex: () => number;
  /** Called with the next index when a gesture advances/retreats a slide. */
  onStep: (index: number) => void;
  /** Seconds input is swallowed after a step, so each slide is seen before the next can trigger. */
  lockDuration?: number;
  /** Seconds the release jump (past the first/last slide) takes. */
  releaseDuration?: number;
  /** Minimum vertical touch drag (px) that counts as one gesture. */
  touchThreshold?: number;
}

/**
 * Caps a scrubbed ScrollTrigger's gallery-stepping tail (progress from
 * `boundary` to 1) to one slide per scroll gesture, no matter how hard or
 * fast the user scrolls or flings. While in that range, wheel/touch input is
 * intercepted and (a) advances/retreats `index` by exactly one via `onStep` —
 * real scroll position is left completely alone, so this never has to
 * compute or land on a precise mid-pin target — or (b), at the first/last
 * slide, releases by jumping scroll straight to the pin's own `start`/`end`
 * (always valid, since those come directly off the trigger) so the pin
 * unpins into whatever comes before/after it.
 */
export function attachLockedGalleryStepper({
  trigger,
  boundary,
  count,
  getIndex,
  onStep,
  lockDuration = 0.6,
  releaseDuration = 0.4,
  touchThreshold = 24,
}: LockedGalleryStepperOptions) {
  let locked = false;
  let inZone = false;
  let touchY = 0;
  let releaseTween: gsap.core.Tween | null = null;
  let pendingUnlock: gsap.core.Tween | null = null;

  const inStepZone = () => trigger.progress >= boundary && trigger.progress < 1;

  const release = (edge: "start" | "end") => {
    locked = true;
    releaseTween?.kill();
    releaseTween = gsap.to(window, {
      scrollTo: { y: edge === "end" ? trigger.end + 2 : Math.max(0, trigger.start - 2), autoKill: false },
      duration: releaseDuration,
      ease: "power2.inOut",
      onComplete() { locked = false; },
    });
  };

  // Returns true when this gesture was consumed (caller should preventDefault it).
  const tryStep = (dir: 1 | -1) => {
    if (!inStepZone()) return false; // outside the stepping zone
    if (locked) return true; // mid-step/release — swallow the extra input
    const cur = getIndex();
    const next = cur + dir;
    if (next < 0 || next > count - 1) {
      release(dir > 0 ? "end" : "start");
      return true;
    }
    locked = true;
    onStep(next);
    pendingUnlock?.kill();
    pendingUnlock = gsap.delayedCall(lockDuration, () => { locked = false; });
    return true;
  };

  const onWheel = (e: WheelEvent) => {
    if (tryStep(e.deltaY > 0 ? 1 : -1)) e.preventDefault();
  };

  const onTouchStart = (e: TouchEvent) => {
    touchY = e.touches[0].clientY;
    inZone = inStepZone();
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!inZone) {
      if (inStepZone()) {
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
      inZone = false; // outside the zone entirely now — let the rest of this drag go
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
    releaseTween?.kill();
    pendingUnlock?.kill();
  };
}
