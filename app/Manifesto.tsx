import { useLocale } from "next-intl";
import RevealStatement from "./RevealStatement";
import { MANIFESTO } from "./manifesto-copy";
import type { AppLocale } from "@/i18n/config";

const u = (n: number) => `calc(var(--u) * ${n})`;

export default function Manifesto() {
  const locale = useLocale() as AppLocale;

  return (
    <section className="relative w-full overflow-hidden" style={{ containerType: "inline-size", backgroundColor: "#fff0e5" }}>
      <div
        className="relative mx-auto flex flex-col items-center"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), paddingTop: u(220), paddingBottom: 0 }}
      >
        <RevealStatement
          paras={MANIFESTO[locale]}
          smallFontSize={u(27.296)}
          paraSpacing={locale === "bg" ? u(28) : undefined}
          className="font-bold"
          style={{
            width: u(1311.92),
            fontFamily: "var(--font-display)",
            fontSize: u(59.247),
            lineHeight: 1.15,
            letterSpacing: u(locale === "bg" ? -1.185 : -2.3699),
            color: "var(--terracotta)",
          }}
        />

        <img src="/s5-mandala.svg" alt="" style={{ marginTop: u(60), width: u(209.93), height: u(219.7) }} />
      </div>
    </section>
  );
}
