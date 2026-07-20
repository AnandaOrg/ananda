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
  /** "Get on the list" heading (swaps to "Amazing!" / "Oops…" with the state). */
  headingSize: number;
  headingLs: number;
  /** Success / error message font size (22 on the 1440 design frame). */
  msgSize: number;
};

type Status = "idle" | "loading" | "success" | "error";

const ERROR_TEXT = "Something went wrong. Please try again.";
const REVERT_MS = 3000; // how long success / error states stay before the input returns

const HEADINGS: Record<Status, string> = {
  idle: "Get on the list",
  loading: "Get on the list",
  success: "Amazing!",
  error: "Oops…",
};

/** Heading + email field. On submit, POSTs to /api/subscribe (MailerLite). Success
 *  swaps the heading to "Amazing!" and the field to a plain confirmation message;
 *  failure swaps the heading to "Oops…" and the field to a warning pill. Either
 *  state holds for 3s, then the heading and empty input return. */
function DropForm({ s, height, fontSize, padL, padR, radius, btnRight, btnSize, headingSize, headingLs, msgSize }: FormScale) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status !== "success" && status !== "error") return;
    const id = setTimeout(() => setStatus("idle"), REVERT_MS);
    return () => clearTimeout(id);
  }, [status]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "loading") return;

    const form = e.currentTarget;
    const email = new FormData(form).get("email");
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      form.reset();
      setStatus("error");
    }
  };

  return (
    <>
      {/* Heading — crossfades between "Get on the list" / "Amazing!" / "Oops…" */}
      <div className="relative w-full" style={{ height: s(headingSize * 0.8) }}>
        <AnimatePresence initial={false}>
          <motion.p
            key={HEADINGS[status]}
            className="absolute left-0 top-0 whitespace-nowrap font-semibold uppercase text-[#fff0e5]"
            style={{ fontFamily: "var(--font-display)", fontSize: s(headingSize), lineHeight: 0.8, letterSpacing: s(headingLs) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
          >
            {HEADINGS[status]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="relative w-full" style={{ height: s(height) }}>
        <AnimatePresence mode="wait" initial={false}>
          {status === "success" ? (
            <motion.div
              key="success"
              role="status"
              aria-live="polite"
              className="absolute inset-0 text-[#fff0e5]"
              style={{ fontFamily: "var(--font-body)", fontSize: s(msgSize), lineHeight: 1.4 }}
              initial={ENTER}
              animate={SHOWN}
              exit={ENTER}
              transition={FADE}
            >
              We&apos;ve received your information and we&apos;ll be in touch shortly.
            </motion.div>
          ) : status === "error" ? (
            <motion.div
              key="error"
              role="alert"
              className="dl-shake absolute inset-x-0 top-0 flex items-center bg-[#fff0e5] text-[#eb4638]"
              style={{ height: s(height), borderRadius: s(radius), padding: `0 ${s(msgSize * 0.9)}`, gap: s(msgSize * 0.55) }}
              initial={ENTER}
              animate={SHOWN}
              exit={ENTER}
              transition={FADE}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/m-warning.svg" alt="" style={{ width: s(msgSize * 1.4), height: s(msgSize * 1.4) }} />
              <p style={{ fontFamily: "var(--font-body)", fontSize: s(msgSize) }}>{ERROR_TEXT}</p>
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
                name="email"
                required
                placeholder="Your email"
                aria-label="Your email"
                className="absolute inset-0 w-full bg-[#fff0e5] text-[#0a142f] outline-none placeholder:text-[#eb4638]"
                style={{ fontFamily: "var(--font-body)", fontSize: s(fontSize), paddingLeft: s(padL), paddingRight: s(padR), borderRadius: s(radius) }}
              />
              <button
                type="submit"
                aria-label="Subscribe"
                disabled={status === "loading"}
                className="absolute -translate-y-1/2 disabled:opacity-50"
                style={{ right: s(btnRight), top: "50%", width: s(btnSize), height: s(btnSize) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/m-send.svg" alt="" className="size-full" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function DropList() {
  return (
    <section className="w-full bg-[#eb4638]" style={{ containerType: "inline-size" }}>
      {/* Mobile */}
      <div className="flex justify-center md:hidden">
        <div className="w-full" style={{ containerType: "inline-size" }}>
          <div className="flex flex-col items-start" style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)} ${mu(4)} ${mu(24)}`, gap: mu(40) }}>
            <div className="flex flex-col items-start uppercase text-[#fff0e5]" style={{ gap: mu(16) }}>
              <p style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}>[05] Want in?</p>
              <p className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: mu(64), lineHeight: 0.8, letterSpacing: mu(-5.12), width: mu(276.93) }}>
                Join the drop list
              </p>
            </div>
            <div className="flex flex-col items-start" style={{ gap: mu(19.87), width: '100%' }}>
              <DropForm s={mu} height={48.598} fontSize={14} padL={19.57} padR={56} radius={24.299} btnRight={8.1} btnSize={32.399} headingSize={24} headingLs={-1.68} msgSize={13} />
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
            <DropForm s={ud} height={93.197} fontSize={24} padL={37.54} padR={100} radius={46.599} btnRight={15.53} btnSize={62.132} headingSize={48} headingLs={-3.36} msgSize={22} />
          </div>
        </div>
      </div>
    </section>
  );
}
