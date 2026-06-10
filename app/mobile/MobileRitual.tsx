import Image from "next/image";
import { mu, MU_VAR } from "./scale";

/** Mobile section — "The RITUAL" with the single CHILL card (Figma 184:2999). */
export default function MobileRitual() {
  return (
    <section className="flex w-full justify-center bg-[#fff0e5] md:hidden">
      <div className="w-full max-w-[430px]" style={{ containerType: "inline-size" }}>
        <div className="flex flex-col items-start" style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)}`, gap: mu(43.333) }}>
          {/* Heading */}
          <div className="flex flex-col items-start uppercase text-[#eb4638]" style={{ gap: mu(16) }}>
            <p
              className="whitespace-nowrap"
              style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}
            >
              [03] How it works
            </p>
            <p
              className="font-bold"
              style={{ fontFamily: "var(--font-display)", fontSize: mu(64), lineHeight: 0.8, letterSpacing: mu(-5.12), width: mu(276.93) }}
            >
              The Ritual
            </p>
          </div>

          {/* CHILL card */}
          <div className="relative" style={{ width: mu(342.303), height: mu(491.887) }}>
            <div className="absolute inset-0" style={{ transform: "rotate(180deg)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/s5-card2.svg" alt="" className="block size-full" />
            </div>
            <div
              className="absolute flex flex-col items-start"
              style={{ left: mu(38.72), top: mu(37.62), width: mu(260.411), gap: mu(11.22) }}
            >
              <div className="flex w-full items-end justify-between uppercase text-[#fff0e5]">
                <p className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: mu(39.949), lineHeight: 0.8, letterSpacing: mu(-3.196) }}>
                  Chill
                </p>
                <p className="whitespace-nowrap" style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12.484), lineHeight: 0.87, letterSpacing: mu(0.8739) }}>
                  [Step 01]
                </p>
              </div>
              <div className="relative overflow-hidden" style={{ width: mu(260), height: mu(322.759) }}>
                <Image src="/s5-step1.png" alt="ANANDA pouches chilling in a cooler of ice" fill sizes="60vw" className="object-cover" />
              </div>
              <p
                style={{ fontFamily: "var(--font-body)", fontSize: mu(12), lineHeight: 1.6, letterSpacing: mu(0.12), color: "#fff0e5", width: mu(215.05) }}
              >
                Submerge the pouch in ice or drop it in the freezer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
