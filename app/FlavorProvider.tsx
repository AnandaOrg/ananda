"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import FlavorModal, { FLAVORS, MODAL_GLB_SRCS } from "./FlavorModal";
import { preloadGlb } from "./GlbViewer";

type Origin = { x: number; y: number };
type Ctx = { open: (index: number, e?: React.MouseEvent | Origin, onClose?: () => void, onNav?: () => void) => void };
const FlavorContext = createContext<Ctx>({ open: () => {} });

const MODAL_OPENED_KEY = "ananda-flavor-modal-opened";

export function wasFlavorModalOpenAtDeath(): boolean {
  try {
    return sessionStorage.getItem(MODAL_OPENED_KEY) === "1";
  } catch {
    return false;
  }
}

const markFlavorModalOpen = () => {
  try {
    sessionStorage.setItem(MODAL_OPENED_KEY, "1");
  } catch {
  }
};

const clearFlavorModalOpen = () => {
  try {
    sessionStorage.removeItem(MODAL_OPENED_KEY);
  } catch {
  }
};

export const useFlavor = () => useContext(FlavorContext);

export default function FlavorProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const [navDir, setNavDir] = useState(1);
  const [origin, setOrigin] = useState<Origin>({ x: 0.5, y: 0.5 });
  const closeCallbackRef = useRef<(() => void) | null>(null);
  const navCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
      deviceMemory?: number;
    };
    const c = nav.connection;
    if (c?.saveData || (c?.effectiveType && /(^|-)2g$/.test(c.effectiveType))) return;
    if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return;
    const run = () => { preloadGlb(MODAL_GLB_SRCS); };
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(run, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(run, 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    clearFlavorModalOpen();
  }, []);

  const open = useCallback((i: number, e?: React.MouseEvent | Origin, onClose?: () => void, onNav?: () => void) => {
    markFlavorModalOpen();
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
    clearFlavorModalOpen();
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
