"use client";

import { useEffect, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LOCALES, LOCALE_COOKIE, type AppLocale } from "@/i18n/config";

gsap.registerPlugin(ScrollTrigger);

/** Persist the locale for a year; read back server-side in i18n/request.ts. */
function setLocaleCookie(next: AppLocale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Fixed EN/BG toggle (top right). Persists the choice in the locale cookie and
 * refreshes the RSC tree so the server re-renders with the new dictionary —
 * no `[locale]` routing, the URL never changes. z-40 keeps it under the
 * flavour modal (z-50).
 */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Copy lengths differ per locale, which moves section heights around —
  // re-measure every pinned/scrubbed timeline once the new text is in.
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
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.2s ease",
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
