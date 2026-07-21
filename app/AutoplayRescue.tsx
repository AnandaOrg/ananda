"use client";

import { useEffect } from "react";

/**
 * iOS autoplay resilience. In Low Power Mode (and some data-saver modes) iOS
 * ignores the `autoplay` attribute and rejects play() until a user gesture.
 * This mounts once, renders nothing, and on the first touch/click kicks
 * play() on every autoplay video that has NEVER started (paused with nothing
 * played yet) — a touch handler counts as a user gesture, so the calls are
 * allowed, and scrolling the page always begins with a touch.
 *
 * Videos that have already played and are currently paused are left alone:
 * those pauses are deliberate (the Kyoto scenes freeze/pause their loops via
 * their own scroll + visibility logic).
 */
export default function AutoplayRescue() {
  useEffect(() => {
    const kick = () => {
      const videos = document.querySelectorAll<HTMLVideoElement>("video[autoplay]");
      let pending = 0;
      videos.forEach((v) => {
        if (v.paused && v.played.length === 0) {
          pending += 1;
          v.play().catch(() => {});
        }
      });
      if (pending === 0) detach();
    };
    const detach = () => {
      window.removeEventListener("touchend", kick);
      window.removeEventListener("pointerdown", kick);
    };
    // Try once right away (covers a lost race with the autoplay attribute in
    // normal mode), then on gestures until nothing is left to start.
    kick();
    window.addEventListener("touchend", kick, { passive: true });
    window.addEventListener("pointerdown", kick, { passive: true });
    return detach;
  }, []);

  return null;
}
