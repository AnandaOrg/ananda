"use client";

import { mu, MU_VAR } from "./mobile/scale";

/**
 * Section 6 — "Join the drop list" email capture.
 * Mobile (<768): stacked (Figma 184:3088). Tablet/desktop (768–1440+): two columns,
 * heading left / form right (Figma 100:9), scaled from the 1440 frame via `--ud`.
 */

const ud = (n: number) => `calc(var(--ud) * ${n})`;
const UD_VAR = { ["--ud" as string]: "calc(100cqw / 1440)" } as const;
const noSubmit = (e: React.FormEvent) => e.preventDefault();

export default function DropList() {
  return (
    <section className="w-full bg-[#eb4638]" style={{ containerType: "inline-size" }}>
      {/* Mobile */}
      <div className="flex justify-center md:hidden">
        <div className="w-full max-w-[430px]" style={{ containerType: "inline-size" }}>
          <div className="flex flex-col items-start" style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)}`, gap: mu(40) }}>
            <div className="flex flex-col items-start uppercase text-[#fff0e5]" style={{ gap: mu(16) }}>
              <p style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}>[05] Want in?</p>
              <p className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: mu(64), lineHeight: 0.8, letterSpacing: mu(-5.12), width: mu(276.93) }}>
                Join the drop list
              </p>
            </div>
            <div className="flex flex-col items-start" style={{ gap: mu(19.87), width: mu(256.65) }}>
              <p className="font-semibold uppercase text-[#fff0e5]" style={{ fontFamily: "var(--font-display)", fontSize: mu(24), lineHeight: 0.8, letterSpacing: mu(-1.68) }}>
                Get on the list
              </p>
              <form className="relative w-full" onSubmit={noSubmit} style={{ height: mu(48.598) }}>
                <input type="email" required placeholder="Your email" aria-label="Your email"
                  className="absolute inset-0 w-full rounded-full bg-[#fff0e5] text-[#0a142f] outline-none placeholder:text-[#0a142f]/55"
                  style={{ fontFamily: "var(--font-body)", fontSize: mu(14), paddingLeft: mu(19.57), paddingRight: mu(56), borderRadius: mu(24.299) }} />
                <button type="submit" aria-label="Subscribe" className="absolute -translate-y-1/2" style={{ right: mu(8.1), top: "50%", width: mu(32.399), height: mu(32.399) }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/m-send.svg" alt="" className="size-full" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Tablet / desktop */}
      <div className="hidden md:block" style={UD_VAR}>
        <div className="flex w-full items-end justify-between" style={{ padding: `${ud(160)} ${ud(80)}` }}>
          <div className="flex flex-col items-start uppercase text-[#fff0e5]" style={{ gap: ud(48) }}>
            <p style={{ fontFamily: "var(--font-mono-label)", fontSize: ud(14), lineHeight: 0.87, letterSpacing: ud(0.98) }}>[05] Want in?</p>
            <p className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: ud(160), lineHeight: 0.8, letterSpacing: ud(-12.8), width: ud(626.379) }}>
              Join the drop list
            </p>
          </div>
          <div className="flex flex-col items-start justify-center" style={{ gap: ud(38.105), width: ud(492.185) }}>
            <p className="font-semibold uppercase text-[#fff0e5]" style={{ fontFamily: "var(--font-display)", fontSize: ud(48), lineHeight: 0.8, letterSpacing: ud(-3.36) }}>
              Get on the list
            </p>
            <form className="relative w-full" onSubmit={noSubmit} style={{ height: ud(93.197) }}>
              <input type="email" required placeholder="Your email" aria-label="Your email"
                className="absolute inset-0 w-full bg-[#fff0e5] text-[#0a142f] outline-none placeholder:text-[#0a142f]/55"
                style={{ fontFamily: "var(--font-body)", fontSize: ud(24), paddingLeft: ud(37.54), paddingRight: ud(100), borderRadius: ud(46.599) }} />
              <button type="submit" aria-label="Subscribe" className="absolute -translate-y-1/2" style={{ right: ud(15.53), top: "50%", width: ud(62.132), height: ud(62.132) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/m-send.svg" alt="" className="size-full" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
