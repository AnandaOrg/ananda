"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import FlavorModal, { FLAVORS } from "./FlavorModal";

type Origin = { x: number; y: number };
type Ctx = { open: (index: number, e?: React.MouseEvent | Origin, onClose?: () => void, onNav?: () => void) => void };
const FlavorContext = createContext<Ctx>({ open: () => {} });

/** Open a flavour detail overlay by index (0=Santorini … 3=Kyoto). */
export const useFlavor = () => useContext(FlavorContext);

export default function FlavorProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const [navDir, setNavDir] = useState(1);
  const [origin, setOrigin] = useState<Origin>({ x: 0.5, y: 0.5 });
  const closeCallbackRef = useRef<(() => void) | null>(null);
  const navCallbackRef = useRef<(() => void) | null>(null);

  const open = useCallback((i: number, e?: React.MouseEvent | Origin, onClose?: () => void, onNav?: () => void) => {
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
