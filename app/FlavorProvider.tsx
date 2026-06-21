"use client";

import { createContext, useCallback, useContext, useState } from "react";
import FlavorModal, { FLAVORS } from "./FlavorModal";

type Origin = { x: number; y: number };
type Ctx = { open: (index: number, e?: React.MouseEvent | Origin) => void };
const FlavorContext = createContext<Ctx>({ open: () => {} });

/** Open a flavour detail overlay by index (0=Santorini … 3=Kyoto). */
export const useFlavor = () => useContext(FlavorContext);

export default function FlavorProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const [origin, setOrigin] = useState<Origin>({ x: 0.5, y: 0.5 });

  const open = useCallback((i: number, e?: React.MouseEvent | Origin) => {
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
    setIndex((i) => (i === null ? i : (i + dir + FLAVORS.length) % FLAVORS.length));
  }, []);
  const onClose = useCallback(() => setIndex(null), []);

  return (
    <FlavorContext.Provider value={{ open }}>
      {children}
      {index !== null && (
        <FlavorModal index={index} origin={origin} onClose={onClose} onNav={onNav} />
      )}
    </FlavorContext.Provider>
  );
}
