"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Age gate (18+) shown over the hero once per tab session: accepting stores a
 * flag in `sessionStorage`, so refreshes in the same tab skip the gate but a
 * new tab (or a later visit) shows it again. The torn-paper card is
 * `public/organic-bg-shape.svg` (625×391) and every length inside scales off
 * the card width via `--agu = 100cqw / 625`, so one component serves desktop
 * and mobile at identical proportions. The gate is deliberately not
 * dismissable: no Escape, no backdrop click — the only exits are "I'm in"
 * (fade out, unlock scroll) and "I'm out" (navigate to /no-entry). Rendered
 * with `initial={false}` so the server HTML already shows the open gate — no
 * flash of ungated content before hydration. For already-accepted sessions the
 * inverse flash (gate visible until hydration) is prevented by an inline
 * script that tags `<html>` with `.age-ok` during parse; the CSS rule in
 * globals.css hides the gate until React unmounts it.
 */

const gu = (n: number) => `calc(var(--agu) * ${n})`;

/** Per-tab acceptance flag: refresh skips the gate, a new tab shows it again. */
const AGE_OK_KEY = "ananda:age-ok";

/** Runs during HTML parse, before first paint (see the component JSDoc). */
const RESTORE_SCRIPT = `try{sessionStorage.getItem(${JSON.stringify(AGE_OK_KEY)})&&document.documentElement.classList.add("age-ok")}catch(e){}`;

// sessionStorage-backed acceptance store, consumed via useSyncExternalStore:
// the server snapshot is always "not accepted" (the server HTML must show the
// gate), and the client snapshot re-syncs right after hydration — reconciling
// with per-tab storage without a setState-in-effect. The in-memory flag keeps
// "I'm in" working even where storage writes throw (private browsing).
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
    return false; // storage unreadable — keep showing the gate
  }
};
const readAcceptedOnServer = () => false;
const accept = () => {
  acceptedInMemory = true;
  try {
    sessionStorage.setItem(AGE_OK_KEY, "1");
  } catch {
    // Storage unavailable — the gate will just re-appear on refresh.
  }
  acceptListeners.forEach((cb) => cb());
};

const RED = "#eb4638";
const CREAM = "#fff0e5";

/** Shared pill-button geometry; colors differ per variant below. Legibility
 *  floors (max(...)) only kick in once the card scales below ~70% — desktop
 *  stays exactly on the Figma proportions. */
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
  const router = useRouter();
  // Open unless this tab's session already accepted. On a same-tab refresh the
  // gate is server-rendered open (hidden pre-paint by RESTORE_SCRIPT + the
  // `.age-ok` CSS rule) and unmounts here right after hydration.
  const open = !useSyncExternalStore(subscribeAccepted, readAccepted, readAcceptedOnServer);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Body scroll-lock while the gate is up (same pattern as FlavorModal).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Land keyboard/SR users on the dialog so the title is announced and the
  // first Tab reaches "I'm out".
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  // Keep Tab cycling between the two buttons — the page behind is locked.
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
      {/* Executes synchronously while the server HTML streams in — before the
          gate below is painted — so accepted sessions never see it flash. */}
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
              // Figma: 625px card in the 1920 hero frame (~31.5vw). Scales
              // with the viewport like the other desktop sections; floors at
              // 340px and never exceeds 92vw on phones.
              width: "min(92vw, max(340px, 31.5vw))",
              aspectRatio: "625 / 391",
              ["--agu" as string]: "calc(100cqw / 625)",
              backgroundImage: "url(/organic-bg-shape.svg)",
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
              >
                {t("title")}
              </h2>
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
              >
                {t("subtitle")}
              </p>
              <div
                className="flex w-full items-center"
                style={{ maxWidth: gu(532), gap: gu(16), marginTop: gu(34) }}
              >
                <button
                  type="button"
                  onClick={() => router.push("/no-entry")}
                  className="cursor-pointer appearance-none uppercase"
                  style={{ ...BUTTON_BASE, color: RED, backgroundColor: "transparent" }}
                >
                  {t("out")}
                </button>
                <button
                  type="button"
                  onClick={accept}
                  className="cursor-pointer appearance-none uppercase"
                  style={{ ...BUTTON_BASE, color: CREAM, backgroundColor: RED }}
                >
                  {t("in")}
                </button>
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
              >
                {t("warning")}
              </p>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
