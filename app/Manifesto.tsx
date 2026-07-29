import { useLocale } from "next-intl";
import RevealStatement from "./RevealStatement";
import { MANIFESTO } from "./manifesto-copy";
import type { AppLocale } from "@/i18n/config";

/**
 * Manifesto — the ANANDA dictionary entry (letter-fill reveal + mandala).
 * Extracted from the top of `Ritual.tsx` so it sits BEFORE the flavours
 * section (Hero → About → Manifesto → Flavors → Ritual → …). Flow layout
 * rather than a fixed-height canvas so the section height tracks the
 * per-locale copy length. Desktop only — the mobile twin is
 * `mobile/MobileAbout`.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;

export default function Manifesto() {
  const locale = useLocale() as AppLocale;

  return (
    <section className="relative w-full overflow-hidden" style={{ containerType: "inline-size", backgroundColor: "#fff0e5" }}>
      <div
        className="relative mx-auto flex flex-col items-center"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), paddingTop: u(220), paddingBottom: u(176) }}
      >
        {/* Dictionary-entry statement — letter-fill reveal on scroll */}
        <RevealStatement
          paras={MANIFESTO[locale]}
          smallFontSize={u(27.296)}
          paraSpacing={u(28)}
          className="font-bold"
          style={{
            width: u(1311.92),
            fontFamily: "var(--font-display)",
            fontSize: u(59.247),
            lineHeight: 1.15,
            letterSpacing: u(-2.3699),
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
