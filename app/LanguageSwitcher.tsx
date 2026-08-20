"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LOCALES, LOCALE_COOKIE, type AppLocale } from "@/i18n/config";

gsap.registerPlugin(ScrollTrigger);

function setLocaleCookie(next: AppLocale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
}

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      setVisible(window.scrollY > window.innerHeight * 0.75);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => window.clearTimeout(id);
  }, [locale]);

  const switchTo = (next: AppLocale) => {
    if (next === locale || isPending) return;
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  };

  return (
    <div
      role="group"
      aria-label="Language"
      className="fixed z-40 flex overflow-hidden"
      style={{
        top: 20,
        right: 20,
        border: "1px solid #eb4638",
        borderRadius: 999,
        backgroundColor: "rgba(255, 240, 229, 0.92)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        opacity: !visible ? 0 : isPending ? 0.6 : 1,
        visibility: visible ? "visible" : "hidden",
        pointerEvents: visible ? "auto" : "none",
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 0.3s ease, transform 0.3s ease, visibility 0.3s",
      }}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-pressed={l === locale}
          className="cursor-pointer appearance-none border-0 uppercase"
          style={{
            fontFamily: "var(--font-mono-label)",
            fontWeight: 500,
            fontSize: 12,
            lineHeight: 1,
            letterSpacing: 0.84,
            padding: "9px 13px",
            color: l === locale ? "#fff0e5" : "#eb4638",
            backgroundColor: l === locale ? "#eb4638" : "transparent",
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
