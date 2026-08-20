import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import type { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollToPlugin);

export interface LockedGalleryStepperOptions {
  trigger: ScrollTrigger;
  boundary: number;
  count: number;
  getIndex: () => number;
  onStep: (index: number) => void;
  lockDuration?: number;
  releaseDuration?: number;
  touchThreshold?: number;
}

export function attachLockedGalleryStepper({
  trigger,
  boundary,
  count,
  getIndex,
  onStep,
  lockDuration = 0,
  releaseDuration = 0,
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

  const tryStep = (dir: 1 | -1) => {
    if (!inStepZone()) return false;
    if (locked) return true;
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
        inZone = true;
        touchY = e.touches[0].clientY;
        e.preventDefault();
      }
      return;
    }
    const dy = touchY - e.touches[0].clientY;
    if (Math.abs(dy) < touchThreshold) { e.preventDefault(); return; }
    if (tryStep(dy > 0 ? 1 : -1)) {
      e.preventDefault();
      touchY = e.touches[0].clientY;
    } else {
      inZone = false;
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
