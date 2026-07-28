import { mu, MU_VAR } from "./scale";
import RevealStatement, { STATEMENT_FLAT } from "../RevealStatement";

/** Mobile section — "ANANDA is the supreme joy…" statement + mandala (Figma 184:2755). */
export default function MobileAbout() {
  return (
    <section className="flex w-full justify-center bg-[#fff0e5] md:hidden">
      <div className="w-full" style={{ containerType: "inline-size" }}>
        <div style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)} ${mu(40)}` }}>
          {/* gap = 80mu above the mandala; padding-bottom = 40mu below it
              (tightened with MobileRitual's top padding — the mandala →
              "THE RITUAL" seam read as too much empty space). */}
          <div className="flex flex-col items-center" style={{ gap: mu(80) }}>
            <RevealStatement
              paras={STATEMENT_FLAT}
              smallFontSize={mu(15.48)}
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
