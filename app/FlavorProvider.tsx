"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import FlavorModal, { FLAVORS, MODAL_GLB_SRCS } from "./FlavorModal";
import { preloadGlb } from "./GlbViewer";

type Origin = { x: number; y: number };
type Ctx = { open: (index: number, e?: React.MouseEvent | Origin, onClose?: () => void, onNav?: () => void) => void };
const FlavorContext = createContext<Ctx>({ open: () => {} });

// "Has a flavour modal been opened this tab session?" — persisted so the
// Pathways Kyoto auto-open stays once per visit even across reloads. iOS Safari
// auto-reloads the page after a WebKit memory kill and restores scroll right
// back onto the Kyoto band; the twins' in-memory one-shot refs reset on that
// reload, so the auto-open would re-fire straight into the same kill — after
// the second one Safari dead-ends the tab with "A problem repeatedly occurred".
// sessionStorage is per-tab and survives those reloads. try/catch: storage
// access can throw (private mode / storage disabled).
const MODAL_OPENED_KEY = "ananda-flavor-modal-opened";

/** True once any flavour modal has been opened in this tab session (survives
 *  reloads — see MODAL_OPENED_KEY). The Pathways Kyoto auto-open gates on it. */
export function wasFlavorModalOpened(): boolean {
  try {
    return sessionStorage.getItem(MODAL_OPENED_KEY) === "1";
  } catch {
    return false;
  }
}

const markFlavorModalOpened = () => {
  try {
    sessionStorage.setItem(MODAL_OPENED_KEY, "1");
  } catch {
    /* best-effort */
  }
};

/** Open a flavour detail overlay by index (0=Santorini … 3=Kyoto). */
export const useFlavor = () => useContext(FlavorContext);

export default function FlavorProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const [navDir, setNavDir] = useState(1);
  const [origin, setOrigin] = useState<Origin>({ x: 0.5, y: 0.5 });
  const closeCallbackRef = useRef<(() => void) | null>(null);
  const navCallbackRef = useRef<(() => void) | null>(null);

  // Warm the (multi-MB) flavour GLB models while the page is idle, so the modal
  // shows its 3-D pouch without the download wait. The user scrolls through
  // several sections before reaching the flavours, giving this time to finish.
  // Skipped on metered / very slow connections so we don't hammer their data.
  useEffect(() => {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
      deviceMemory?: number;
    };
    const c = nav.connection;
    if (c?.saveData || (c?.effectiveType && /(^|-)2g$/.test(c.effectiveType))) return;
    // Don't warm all four ~30MB models on phones / low-RAM devices: THREE.Cache
    // never frees these ArrayBuffers, and holding ~110MB resident is what tips
    // iOS Safari over its per-tab memory ceiling. On mobile the modal streams its
    // active model on open instead (GlbViewer's active-first useSelect path).
    const isSmall = window.matchMedia("(max-width: 767px)").matches;
    if (isSmall || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4)) return;
    const run = () => { preloadGlb(MODAL_GLB_SRCS); };
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(run, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(run, 1500);
    return () => clearTimeout(t);
  }, []);

  const open = useCallback((i: number, e?: React.MouseEvent | Origin, onClose?: () => void, onNav?: () => void) => {
    markFlavorModalOpened();
    closeCallbackRef.current = onClose ?? null;
    navCallbackRef.current = onNav ?? null;
    if (e) {
      if ("clientX" in e) {
        setOrigin({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
      } else {
        setOrigin(e);
      }
    }
    setIndex(i);
  }, []);

  const onNav = useCallback((dir: number) => {
    navCallbackRef.current?.();
    setNavDir(dir < 0 ? -1 : 1);
    setIndex((i) => (i === null ? i : (i + dir + FLAVORS.length) % FLAVORS.length));
  }, []);
  const onClose = useCallback(() => {
    closeCallbackRef.current?.();
    closeCallbackRef.current = null;
    setIndex(null);
  }, []);

  return (
    <FlavorContext.Provider value={{ open }}>
      {children}
      {index !== null && (
        <FlavorModal index={index} navDir={navDir} origin={origin} onClose={onClose} onNav={onNav} />
      )}
    </FlavorContext.Provider>
  );
}
