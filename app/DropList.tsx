"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { mu, MU_VAR } from "./mobile/scale";

/**
 * Section 6 — "Join the drop list" email capture.
 * Mobile (<768): stacked (Figma 184:3088). Tablet/desktop (768–1440+): two columns,
 * heading left / form right (Figma 100:9), scaled from the 1440 frame via `--ud`.
 */

const ud = (n: number) => `calc(var(--ud) * ${n})`;
const UD_VAR = { ["--ud" as string]: "calc(100cqw / 1440)" } as const;

const FADE = { duration: 0.35, ease: [0.16, 1, 0.3, 1] } as const;
const ENTER = { opacity: 0, scale: 0.96 };
const SHOWN = { opacity: 1, scale: 1 };

type FormScale = {
  /** Design-unit scaler for this breakpoint (mu or ud). */
  s: (n: number) => string;
  height: number;
  fontSize: number;
  padL: number;
  padR: number;
  radius: number;
  btnRight: number;
  btnSize: number;
};

/** Email field that, on submit, swaps to a "Successfully subscribed" confirmation
 *  for 5s (animated), then restores the input. */
function DropForm({ s, height, fontSize, padL, padR, radius, btnRight, btnSize }: FormScale) {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    const id = setTimeout(() => setSubmitted(false), 5000);
    return () => clearTimeout(id);
  }, [submitted]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="relative w-full" style={{ height: s(height) }}>
      <AnimatePresence mode="wait" initial={false}>
        {submitted ? (
          <motion.div
            key="success"
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex items-center justify-center bg-[#fff0e5] text-center font-semibold uppercase text-[#0a142f]"
            style={{ fontFamily: "var(--font-display)", fontSize: s(fontSize), letterSpacing: s(-fontSize * 0.05), borderRadius: s(radius), padding: `0 ${s(padL)}` }}
            initial={ENTER}
            animate={SHOWN}
            exit={ENTER}
            transition={FADE}
          >
            Successfully subscribed
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            className="absolute inset-0 w-full"
            initial={ENTER}
            animate={SHOWN}
            exit={ENTER}
            transition={FADE}
          >
            <input
              type="email"
              required
              placeholder="Your email"
              aria-label="Your email"
              className="absolute inset-0 w-full bg-[#fff0e5] text-[#0a142f] outline-none placeholder:text-[#eb4638]"
              style={{ fontFamily: "var(--font-body)", fontSize: s(fontSize), paddingLeft: s(padL), paddingRight: s(padR), borderRadius: s(radius) }}
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="absolute -translate-y-1/2"
              style={{ right: s(btnRight), top: "50%", width: s(btnSize), height: s(btnSize) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/m-send.svg" alt="" className="size-full" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DropList() {
  return (
    <section className="w-full bg-[#eb4638]" style={{ containerType: "inline-size" }}>
      {/* Mobile */}
      <div className="flex justify-center md:hidden">
        <div className="w-full max-w-[430px]" style={{ containerType: "inline-size" }}>
          <div className="flex flex-col items-start" style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)}`, gap: mu(40) }}>
            <div className="flex flex-col items-start uppercase text-[#fff0e5]" style={{ gap: mu(16) }}>
              <p style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}>[05] Want in?</p>
              <p className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: mu(64), lineHeight: 0.8, letterSpacing: mu(-5.12), width: mu(276.93) }}>
                Join the drop list
              </p>
            </div>
            <div className="flex flex-col items-start" style={{ gap: mu(19.87), width: mu(256.65) }}>
              <p className="font-semibold uppercase text-[#fff0e5]" style={{ fontFamily: "var(--font-display)", fontSize: mu(24), lineHeight: 0.8, letterSpacing: mu(-1.68)}}>
                Get on the list
              </p>
              <DropForm s={mu} height={48.598} fontSize={14} padL={19.57} padR={56} radius={24.299} btnRight={8.1} btnSize={32.399} />
            </div>
          </div>
        </div>
      </div>

      {/* Tablet / desktop */}
      <div className="hidden md:block" style={UD_VAR}>
        <div className="flex w-full items-end justify-between" style={{ padding: `${ud(160)} ${ud(80)}` }}>
          <div className="flex flex-col items-start uppercase text-[#fff0e5]" style={{ gap: ud(48) }}>
            <p style={{ fontFamily: "var(--font-mono-label)", fontSize: ud(14), lineHeight: 0.87, letterSpacing: ud(0.98) }}>[05] Want in?</p>
            <p className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: ud(160), lineHeight: 0.8, letterSpacing: ud(-12.8), width: ud(626.379) }}>
              Join the drop list
            </p>
          </div>
          <div className="flex flex-col items-start justify-center" style={{ gap: ud(38.105), width: ud(492.185), marginBottom: ud(26) }}>
            <p className="font-semibold uppercase text-[#fff0e5]" style={{ fontFamily: "var(--font-display)", fontSize: ud(48), lineHeight: 0.8, letterSpacing: ud(-3.36) }}>
              Get on the list
            </p>
            <DropForm s={ud} height={93.197} fontSize={24} padL={37.54} padR={100} radius={46.599} btnRight={15.53} btnSize={62.132} />
          </div>
        </div>
      </div>
    </section>
  );
}
