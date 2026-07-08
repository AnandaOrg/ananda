import { mu, MU_VAR } from "./mobile/scale";

/**
 * Section 7 — Footer.
 * Mobile (<768): stacked & centred (Figma 184:3129). Tablet/desktop (768–1440+):
 * logo / copyright / socials in a row (Figma 184:339), scaled from the 1440 frame.
 */

const ud = (n: number) => `calc(var(--ud) * ${n})`;
const UD_VAR = { ["--ud" as string]: "calc(100cqw / 1440)" } as const;
const getCurrentYear = () => new Date().getFullYear();

function Socials({ scale }: { scale: (n: number) => string }) {
  return (
    <div className="flex items-center" style={{ gap: scale(14) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/m-linkedin.svg" alt="LinkedIn" style={{ width: scale(39), height: scale(39) }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/m-facebook.svg" alt="Facebook" style={{ width: scale(39), height: scale(39) }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/m-instagram.svg" alt="X" style={{ width: scale(39), height: scale(39) }} />
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-[#eb4638]" style={{ containerType: "inline-size" }}>
      {/* Mobile */}
      <div className="flex justify-center md:hidden">
        <div className="w-full" style={{ containerType: "inline-size" }}>
          <div className="flex flex-col" style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)}`, gap: mu(40) }}>
            <div className="h-px w-full bg-[#fff0e5]" />
            <div className="flex flex-col items-center" style={{ gap: mu(32) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ananda-logo.svg" alt="ANANDA Cocktails" style={{ width: mu(152.482), height: "auto" }} />
              <Socials scale={mu} />
              <p className="text-center text-[#fff0e5]" style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: mu(14), lineHeight: mu(18), width: mu(280) }}>
                © {getCurrentYear()} Ananda Cocktails. All Rights Reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tablet / desktop */}
      <div className="hidden md:block" style={UD_VAR}>
        <div className="flex flex-col" style={{ padding: ud(80), gap: ud(40) }}>
          <div className="h-px w-full bg-[#fff0e5]" />
          <div className="flex w-full items-end justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ananda-logo.svg" alt="ANANDA Cocktails" style={{ width: ud(152.482), height: "auto" }} />
            <p className="text-center text-[#fff0e5]" style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: ud(14), lineHeight: ud(14), width: ud(280) }}>
              © {getCurrentYear()} Ananda Cocktails. All Rights Reserved.
            </p>
            <Socials scale={ud} />
          </div>
        </div>
      </div>
    </footer>
  );
}
