import { useLocale } from "next-intl";
import { mu, MU_VAR } from "./scale";
import RevealStatement from "../RevealStatement";
import { MANIFESTO } from "../manifesto-copy";
import type { AppLocale } from "@/i18n/config";

/** Mobile section — the ANANDA dictionary-entry manifesto + mandala. Sits
 *  before MobilePathways (Hero → About → Manifesto → Flavors → …), mirroring
 *  the desktop `Manifesto` section. */
export default function MobileAbout() {
  const locale = useLocale() as AppLocale;

  return (
    <section className="flex w-full justify-center bg-[#fff0e5] md:hidden">
      <div className="w-full" style={{ containerType: "inline-size" }}>
        <div style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)} ${mu(40)}` }}>
          <div className="flex flex-col items-center" style={{ gap: mu(60) }}>
            <RevealStatement
              paras={MANIFESTO[locale]}
              smallFontSize={mu(15.48)}
              paraSpacing={mu(16)}
              className="font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--terracotta)", letterSpacing: mu(-0.96), fontSize: mu(24), lineHeight: 1.15 }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/s5-mandala.svg" alt="" style={{ width: mu(140.075), height: mu(146.594) }} />
          </div>
        </div>
      </div>
    </section>
  );
}
