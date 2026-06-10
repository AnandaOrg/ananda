"use client";

import { createContext, useCallback, useContext, useState } from "react";
import FlavorModal, { FLAVORS } from "./FlavorModal";

type Ctx = { open: (index: number) => void };
const FlavorContext = createContext<Ctx>({ open: () => {} });

/** Open a flavour detail overlay by index (0=Santorini … 3=Kyoto). */
export const useFlavor = () => useContext(FlavorContext);

export default function FlavorProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = useCallback((i: number) => setIndex(i), []);
  const onNav = useCallback((dir: number) => {
    setIndex((i) => (i === null ? i : (i + dir + FLAVORS.length) % FLAVORS.length));
  }, []);
  const onClose = useCallback(() => setIndex(null), []);

  return (
    <FlavorContext.Provider value={{ open }}>
      {children}
      <FlavorModal index={index} onClose={onClose} onNav={onNav} />
    </FlavorContext.Provider>
  );
}
