import Image from "next/image";
import { mu, MU_VAR, maskStyle } from "./scale";

/** Mobile section 2 — "Ditch the glass" / LIQUID BLISS (Figma 184:1157). */
export default function MobileIntro() {
  return (
    <section className="flex w-full justify-center bg-[#fff0e5] md:hidden">
      <div className="w-full max-w-[430px]" style={{ containerType: "inline-size" }}>
        <div
          className="flex items-center justify-center"
          style={{ ...MU_VAR, padding: `${mu(80)} ${mu(60)}` }}
        >
          <div className="flex flex-col items-center" style={{ gap: mu(24) }}>
            <div style={{ padding: `${mu(6.728)} ${mu(9.419)}` }}>
              <p
                className="whitespace-nowrap uppercase text-[#eb4638]"
                style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}
              >
                [01] Ditch the glass
              </p>
            </div>

            {/* Headline + inline diamond */}
            <div className="relative" style={{ width: mu(276.699) }}>
              <p
                className="font-bold uppercase text-[#eb4638]"
                style={{ fontFamily: "var(--font-display)", fontSize: mu(106), lineHeight: 0.8, letterSpacing: mu(-8.48), whiteSpace: "pre-wrap" }}
              >
                {"LIQUID BLISS.\nMIXED TO        MOVE."}
              </p>
              <div
                className="absolute flex items-center justify-center"
                style={{ left: mu(101.74 - 29.84), top: mu(218.32 - 26.63), width: mu(213.794), height: mu(213.794) }}
              >
                <div style={{ transform: "rotate(45deg)" }}>
                  <div
                    className="relative overflow-hidden"
                    style={{ width: mu(140.805), height: mu(161.545), ...maskStyle("/m-diamond.svg", 154.104, 147.531, 29.843, 26.627) }}
                  >
                    <Image src="/ananda-pour.png" alt="Pouring an ANANDA cocktail" fill sizes="60vw" className="object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
