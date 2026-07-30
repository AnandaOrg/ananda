import { useLocale } from "next-intl";
import RevealStatement from "./RevealStatement";
import { MANIFESTO } from "./manifesto-copy";
import type { AppLocale } from "@/i18n/config";

/**
 * Manifesto — the ANANDA statement (letter-fill reveal + mandala). Extracted
 * from the top of `Ritual.tsx`; sits AFTER the flavours section
 * (Hero → About → Flavors → Manifesto → Ritual → …). Flow layout rather than
 * a fixed-height canvas so the section height tracks the per-locale copy
 * length. Desktop only — the mobile twin is `mobile/MobileAbout`.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;

export default function Manifesto() {
  const locale = useLocale() as AppLocale;

  return (
    <section className="relative w-full overflow-hidden" style={{ containerType: "inline-size", backgroundColor: "#fff0e5" }}>
      <div
        className="relative mx-auto flex flex-col items-center"
        // No bottom padding: the Ritual canvas below already carries a 272u
        // top offset before its "[03]" eyebrow, and the combined seam read as
        // a dead zone (600px+ on wide screens). The mandala → eyebrow gap is
        // now that 272u alone (≈ 400px at ~2100px-wide viewports).
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), paddingTop: u(220), paddingBottom: 0 }}
      >
        {/* Dictionary-entry statement — letter-fill reveal on scroll */}
        <RevealStatement
          paras={MANIFESTO[locale]}
          smallFontSize={u(27.296)}
          // EN paras are hard-broken lines of one statement (no gap); BG is a
          // dictionary entry whose paragraphs need breathing room.
          paraSpacing={locale === "bg" ? u(28) : undefined}
          className="font-bold"
          style={{
            width: u(1311.92),
            fontFamily: "var(--font-display)",
            fontSize: u(59.247),
            lineHeight: 1.15,
            // BG (Golos) halves the Anek-tuned -0.04em tracking.
            letterSpacing: u(locale === "bg" ? -1.185 : -2.3699),
            // Statement-specific muted terracotta (design), not the brand red.
            color: "var(--terracotta)",
          }}
        />

        {/* Decorative mandala */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/s5-mandala.svg" alt="" style={{ marginTop: u(60), width: u(209.93), height: u(219.7) }} />
      </div>
    </section>
  );
}
