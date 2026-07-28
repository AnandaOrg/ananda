"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js (see app/sw.js/route.ts) — the 24h static-asset cache.
 * Production only: in dev the worker would fight HMR and serve stale chunks.
 * Registration waits for the window load event so the worker install never
 * competes with the initial page's own network work.
 */
export default function SwRegister() {
  useEffect(() => {
    const register = () => {
      // updateViaCache "none": always check the server for a new worker on
      // navigation, so a deploy is picked up (and old caches dropped) on the
      // user's next visit.
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {
        /* private mode / storage disabled — the site works without the cache */
      });
    };
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}
