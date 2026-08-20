"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { mu, MU_VAR } from "./mobile/scale";

const ud = (n: number) => `calc(var(--ud) * ${n})`;
const UD_VAR = { ["--ud" as string]: "calc(100cqw / 1440)" } as const;

const FADE = { duration: 0.35, ease: [0.16, 1, 0.3, 1] } as const;
const ENTER = { opacity: 0, scale: 0.96 };
const SHOWN = { opacity: 1, scale: 1 };

type FormScale = {
  s: (n: number) => string;
  height: number;
  fontSize: number;
  padL: number;
  padR: number;
  radius: number;
  btnRight: number;
  btnSize: number;
  headingSize: number;
  headingLs: number;
  msgSize: number;
};

type Status = "idle" | "loading" | "success" | "error";

const REVERT_MS = 3000;

function DropForm({ s, height, fontSize, padL, padR, radius, btnRight, btnSize, headingSize, headingLs, msgSize }: FormScale) {
  const formBg = useLocale() === "bg";
  const t = useTranslations("dropList");
  const [status, setStatus] = useState<Status>("idle");

  const heading =
    status === "success" ? t("headingSuccess") : status === "error" ? t("headingError") : t("headingIdle");

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
      <div className="relative w-full" style={{ height: s(headingSize * 0.8) }}>
        <AnimatePresence initial={false}>
          <motion.p
            key={heading}
            className="absolute left-0 top-0 whitespace-nowrap font-semibold uppercase text-[#fff0e5]"
            style={{ fontFamily: "var(--font-display)", fontSize: s(headingSize), lineHeight: 0.8, letterSpacing: s(formBg ? headingSize * -0.03 : headingLs) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
          >
            {heading}
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
              {t("successMsg")}
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
              <img src="/m-warning.svg" alt="" style={{ width: s(msgSize * 1.4), height: s(msgSize * 1.4) }} />
              <p style={{ fontFamily: "var(--font-body)", fontSize: s(msgSize) }}>{t("errorMsg")}</p>
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
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                className="absolute inset-0 w-full bg-[#fff0e5] text-[#0a142f] outline-none placeholder:text-[#eb4638]"
                style={{ fontFamily: "var(--font-body)", fontSize: s(fontSize), paddingLeft: s(padL), paddingRight: s(padR), borderRadius: s(radius) }}
              />
              <button
                type="submit"
                aria-label={t("submitAria")}
                disabled={status === "loading"}
                className="absolute -translate-y-1/2 disabled:opacity-50"
                style={{ right: s(btnRight), top: "50%", width: s(btnSize), height: s(btnSize) }}
              >
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
  const t = useTranslations("dropList");
  const locale = useLocale();
  const bg = locale === "bg";

  return (
    <section className="w-full bg-[#eb4638]" style={{ containerType: "inline-size" }}>
      <div className="flex justify-center md:hidden">
        <div className="w-full" style={{ containerType: "inline-size" }}>
          <div className="flex flex-col items-start" style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)} ${mu(4)} ${mu(24)}`, gap: mu(40) }}>
            <div className="flex flex-col items-start uppercase text-[#fff0e5]" style={{ gap: mu(16) }}>
              <p style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}>{t("eyebrow")}</p>
              <p className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: bg ? mu(52) : mu(64), lineHeight: 0.8, letterSpacing: bg ? mu(-1.56) : mu(-5.12), width: bg ? mu(342) : mu(276.93) }}>
                {t("title")}
              </p>
            </div>
            <div className="flex flex-col items-start" style={{ gap: mu(19.87), width: '100%' }}>
              <DropForm s={mu} height={48.598} fontSize={14} padL={19.57} padR={56} radius={24.299} btnRight={8.1} btnSize={32.399} headingSize={24} headingLs={-1.68} msgSize={13} />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block" style={UD_VAR}>
        <div className="flex w-full items-end justify-between" style={{ padding: `${ud(160)} ${ud(80)}` }}>
          <div className="flex flex-col items-start uppercase text-[#fff0e5]" style={{ gap: ud(48) }}>
            <p style={{ fontFamily: "var(--font-mono-label)", fontSize: ud(14), lineHeight: 0.87, letterSpacing: ud(0.98) }}>{t("eyebrow")}</p>
            <p className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: bg ? ud(110) : ud(160), lineHeight: 0.8, letterSpacing: bg ? ud(-3.3) : ud(-12.8), width: ud(626.379) }}>
              {t("title")}
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
