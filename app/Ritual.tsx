import RevealStatement, { STATEMENT_PARAS } from "./RevealStatement";
import RitualCards from "./RitualCards";
import WildCarousel from "./mobile/WildCarousel";
import { CAROUSEL_AUTOPLAY_SPEED } from "./configs";

/**
 * Section 5 — "The Ritual" / "ANANDA in the Wild" (Figma node 74:8391, a
 * 1440×4024 cream frame). Same width-scaling canvas as the other sections:
 * `--u = 100cqw / 1440`, every length `calc(var(--u) * figma-px)`.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;
const RED = "#eb4638";

const TAGS = ["Tropical", "Rich", "Sun-Drenched"];

const WILD = [
  { src: "/s5-wild1.png", w: 525.269, h: 652.058, alt: "Friends enjoying ANANDA outdoors" },
  { src: "/s5-wild2.png", w: 525.269, h: 652.058, alt: "A couple toasting with ANANDA pouches" },
  { src: "/s5-wild3.png", w: 522.503, h: 648.624, alt: "Holding a fan of colourful ANANDA pouches" },
  { src: "/s5-wild4.png", w: 521.32, h: 647.155, alt: "ANANDA on the go" },
  { src: "/s5-wild5.png", w: 582.282, h: 652.058, alt: "Sharing ANANDA cocktails" },
];

export default function Ritual() {
  return (
    <section className="relative w-full overflow-hidden" style={{ containerType: "inline-size", backgroundColor: "#fff0e5" }}>
      <div
        className="relative mx-auto"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), height: u(4024) }}
      >
        {/* Intro statement — letter-fill reveal on scroll */}
        <RevealStatement
          paras={STATEMENT_PARAS}
          smallFontSize={u(27.296)}
          className="absolute font-bold"
          style={{
            left: u(78.23),
            top: u(271.98),
            width: u(1311.92),
            fontFamily: "var(--font-display)",
            fontSize: u(59.247),
            lineHeight: 1.15,
            letterSpacing: u(-2.3699),
            color: RED,
          }}
        />

        {/* Decorative mandala */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/s5-mandala.svg"
          alt=""
          className="absolute"
          style={{ left: u(615.03), top: u(865.31), width: u(209.93), height: u(219.7) }}
        />

        {/* [03] HOW IT WORKS */}
        <div className="absolute" style={{ left: u(67), top: u(1261.84), padding: `${u(10)} ${u(14)}` }}>
          <p
            className="whitespace-nowrap uppercase"
            style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98), color: RED }}
          >
            [03] How it works
          </p>
        </div>

        {/* THE RITUAL */}
        <p
          className="absolute font-bold uppercase"
          style={{
            left: u(78.23),
            top: u(1339.03),
            width: u(886.654),
            fontFamily: "var(--font-display)",
            fontSize: u(180),
            lineHeight: 0.8,
            letterSpacing: u(-14.4),
            color: RED,
          }}
        >
          The Ritual
        </p>

        {/* Step cards — scroll-triggered rotation entrance */}
        <RitualCards />

        {/* [04] HOW IT WORKS */}
        <div className="absolute" style={{ left: u(67), top: u(2865.35), padding: `${u(10)} ${u(14)}` }}>
          <p
            className="whitespace-nowrap uppercase"
            style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98), color: RED }}
          >
            [04] How it works
          </p>
        </div>

        {/* ANANDA IN THE WILD */}
        <div
          className="absolute font-bold uppercase"
          style={{
            left: u(78.23),
            top: u(2942.53),
            width: u(886.654),
            fontFamily: "var(--font-display)",
            fontSize: u(180),
            lineHeight: 0.8,
            letterSpacing: u(-14.4),
            color: RED,
          }}
        >
          <p className="mb-0">ANANDA IN</p>
          <p>THE WILD</p>
        </div>

        {/* Flavour tags */}
        <div className="absolute flex items-center" style={{ left: u(81), top: u(3242.01), gap: u(14) }}>
          {TAGS.map((t) => (
            <span
              key={t}
              className="whitespace-nowrap"
              style={{
                border: `${u(0.75)} solid ${RED}`,
                borderRadius: u(2),
                padding: `${u(10)} ${u(14)}`,
                fontFamily: "var(--font-mono-label)",
                fontSize: u(10),
                lineHeight: 0.87,
                letterSpacing: u(0.7),
                color: RED,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* "In the wild" photo carousel — drag / scroll through the gallery */}
        <div className="absolute" style={{ left: 0, top: u(3374.84), width: u(1440) }}>
          <WildCarousel
            items={WILD}
            slideW={u(525.269)}
            slideH={u(652.058)}
            gap="0px"
            snapAlign="start"
            snapType="none"
            startIndex={0}
            autoplay={CAROUSEL_AUTOPLAY_SPEED}
          />
        </div>
      </div>
    </section>
  );
}
