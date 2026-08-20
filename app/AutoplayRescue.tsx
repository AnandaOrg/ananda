"use client";

import { useEffect } from "react";

export default function AutoplayRescue() {
  useEffect(() => {
    const kick = () => {
      const videos = document.querySelectorAll<HTMLVideoElement>("video[autoplay]");
      let pending = 0;
      videos.forEach((v) => {
        if (v.paused && v.played.length === 0) {
          v.muted = true;
          v.defaultMuted = true;
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
    kick();
    window.addEventListener("touchend", kick, { passive: true });
    window.addEventListener("pointerdown", kick, { passive: true });
    return detach;
  }, []);

  return null;
}
