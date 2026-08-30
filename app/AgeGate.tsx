"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { useManagedMaskUrl } from "./MediaProvider";

const gu = (n: number) => `calc(var(--agu) * ${n})`;

const AGE_OK_KEY = "ananda:age-ok";

const RESTORE_SCRIPT = `try{sessionStorage.getItem(${JSON.stringify(AGE_OK_KEY)})&&document.documentElement.classList.add("age-ok")}catch(e){}`;

const acceptListeners = new Set<() => void>();
let acceptedInMemory = false;
const subscribeAccepted = (cb: () => void) => {
  acceptListeners.add(cb);
  return () => {
    acceptListeners.delete(cb);
  };
};
const readAccepted = () => {
  if (acceptedInMemory) return true;
  try {
    return sessionStorage.getItem(AGE_OK_KEY) === "1";
  } catch {
    return false;
  }
};
const readAcceptedOnServer = () => false;
const accept = () => {
  acceptedInMemory = true;
  try {
    sessionStorage.setItem(AGE_OK_KEY, "1");
  } catch {
  }
  acceptListeners.forEach((cb) => cb());
};

const RED = "#eb4638";
const CREAM = "#fff0e5";

const BUTTON_BASE: React.CSSProperties = {
  fontFamily: "var(--font-mono-label)",
  fontWeight: 500,
  fontSize: `max(${gu(13)}, 10px)`,
  letterSpacing: "0.08em",
  lineHeight: 1,
  flex: "1 1 0",
  height: `max(${gu(48)}, 38px)`,
  borderRadius: 999,
  border: `1.5px solid ${RED}`,
};

export default function AgeGate() {
  const t = useTranslations("ageGate");
  const bgShapeUrl = useManagedMaskUrl("/organic-bg-shape.svg");
  const router = useRouter();
  const open = !useSyncExternalStore(subscribeAccepted, readAccepted, readAcceptedOnServer);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  const trapTab = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const buttons = dialogRef.current?.querySelectorAll<HTMLElement>("button");
    if (!buttons?.length) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: RESTORE_SCRIPT }} />
      <AnimatePresence>
      {open && (
        <motion.div
          key="age-gate"
          initial={false}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeInOut" } }}
          className="age-gate-root fixed inset-0 z-[60] flex items-center justify-center bg-black/45"
          onKeyDown={trapTab}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="age-gate-title"
            aria-describedby="age-gate-subtitle"
            tabIndex={-1}
            className="relative outline-none"
            style={{
              containerType: "inline-size",
              width: "min(92vw, max(340px, 31.5vw))",
              aspectRatio: "625 / 391",
              ["--agu" as string]: "calc(100cqw / 625)",
              backgroundImage: bgShapeUrl ? `url(${bgShapeUrl})` : "none",
              backgroundSize: "100% 100%",
            }}
          >
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
              style={{ color: RED, paddingLeft: gu(46), paddingRight: gu(46) }}
            >
              <h2
                id="age-gate-title"
                className="uppercase"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: gu(56),
                  lineHeight: 1,
                }}
                dangerouslySetInnerHTML={{ __html: t.raw("title") }}
              />
              <p
                id="age-gate-subtitle"
                className="uppercase"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: gu(40),
                  lineHeight: 1.1,
                  marginTop: gu(2),
                }}
                dangerouslySetInnerHTML={{ __html: t.raw("subtitle") }}
              />
              <div
                className="flex w-full items-center"
                style={{ maxWidth: gu(532), gap: gu(16), marginTop: gu(34) }}
              >
                <button
                  type="button"
                  onClick={() => router.push("/no-entry")}
                  className="cursor-pointer appearance-none uppercase"
                  style={{ ...BUTTON_BASE, color: RED, backgroundColor: "transparent" }}
                  dangerouslySetInnerHTML={{ __html: t.raw("out") }}
                />
                <button
                  type="button"
                  onClick={accept}
                  className="cursor-pointer appearance-none uppercase"
                  style={{ ...BUTTON_BASE, color: CREAM, backgroundColor: RED }}
                  dangerouslySetInnerHTML={{ __html: t.raw("in") }}
                />
              </div>
              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono-label)",
                  fontWeight: 500,
                  fontSize: `max(${gu(12)}, 8.5px)`,
                  letterSpacing: "0.06em",
                  lineHeight: 1.3,
                  marginTop: gu(36),
                }}
                dangerouslySetInnerHTML={{ __html: t.raw("warning") }}
              />
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
