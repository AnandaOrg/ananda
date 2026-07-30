import { useLocale, useTranslations } from "next-intl";
import RitualCards from "./RitualCards";
import WildCarousel from "./mobile/WildCarousel";
import { CAROUSEL_AUTOPLAY_SPEED } from "./configs";

/**
 * Section 5 — "The Ritual" / "ANANDA in the Wild" (Figma node 74:8391, a
 * 1440-wide cream frame). Same width-scaling canvas as the other sections:
 * `--u = 100cqw / 1440`, every length `calc(var(--u) * figma-px)`.
 * The intro manifesto that used to open this section now lives in its own
 * `Manifesto.tsx` before the flavours; every offset here shifted up by
 * 989.86u and the canvas shrank accordingly.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;
const RED = "#eb4638";

const WILD = [
  { src: "/s5-wild1.png", w: 525.269, h: 652.058, alt: "Friends enjoying ANANDA outdoors" },
  { src: "/s5-wild2.png", w: 525.269, h: 652.058, alt: "A couple toasting with ANANDA pouches" },
  { src: "/s5-wild3.png", w: 522.503, h: 648.624, alt: "Holding a fan of colourful ANANDA pouches" },
  { src: "/s5-wild4.png", w: 521.32, h: 647.155, alt: "ANANDA on the go" },
  { src: "/s5-wild5.png", w: 582.282, h: 652.058, alt: "Sharing ANANDA cocktails" },
];

export default function Ritual() {
  const tRitual = useTranslations("ritual");
  const tWild = useTranslations("wild");
  const bg = useLocale() === "bg";
  const tags = [tWild("tag1"), tWild("tag2")];

  return (
    <section className="relative w-full overflow-hidden" style={{ containerType: "inline-size", backgroundColor: "#fff0e5" }}>
      <div
        className="relative mx-auto"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), height: u(2952.688) }}
      >
        {/* HOW IT WORKS */}
        <div className="absolute" style={{ left: u(67), top: u(271.98), padding: `${u(10)} ${u(14)}` }}>
          <p
            className="whitespace-nowrap uppercase"
            style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98), color: RED }}
          >
            {tRitual("eyebrow")}
          </p>
        </div>

        {/* THE RITUAL */}
        <p
          className="absolute font-bold uppercase"
          style={{
            left: u(78.23),
            top: u(349.17),
            width: u(886.654),
            fontFamily: "var(--font-display)",
            fontSize: u(180),
            lineHeight: 0.8,
            // BG (Golos) relaxes the -0.08em Anek tracking to -0.03em.
            letterSpacing: u(bg ? -5.4 : -14.4),
            color: RED,
          }}
        >
          {tRitual("title")}
        </p>

        {/* Step cards — scroll-triggered rotation entrance */}
        <RitualCards />

        {/* OUR COLLECTIVE — sits 400px below the card block */}
        <div className="absolute" style={{ left: u(67), top: u(1791.14), padding: `${u(10)} ${u(14)}` }}>
          <p
            className="whitespace-nowrap uppercase"
            style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98), color: RED }}
          >
            {tWild("eyebrow")}
          </p>
        </div>

        {/* ANANDA IN THE WILD */}
        <div
          className="absolute font-bold uppercase"
          style={{
            left: u(78.23),
            top: u(1868.32),
            width: u(886.654),
            fontFamily: "var(--font-display)",
            fontSize: u(180),
            lineHeight: 0.8,
            // BG (Golos) relaxes the -0.08em Anek tracking to -0.03em.
            letterSpacing: u(bg ? -5.4 : -14.4),
            color: RED,
          }}
        >
          <p className="mb-0 whitespace-nowrap">{tWild("title1")}</p>
          <p className="whitespace-nowrap">{tWild("title2")}</p>
        </div>

        {/* Flavour tags */}
        <div className="absolute flex items-center" style={{ left: u(81), top: u(2167.8), gap: u(14) }}>
          {tags.map((t) => (
            <span
              key={t}
              className="whitespace-nowrap"
              style={{
                border: `${u(0.75)} solid ${RED}`,
                borderRadius: u(2),
                padding: `${u(10)} ${u(14)}`,
                fontFamily: "var(--font-mono-label)",
                fontWeight: 500,
                fontSize: u(20),
                lineHeight: 0.87,
                letterSpacing: u(1.4),
                color: RED,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* "In the wild" photo carousel — drag / scroll through the gallery */}
        <div className="absolute" style={{ left: 0, top: u(2300.63), width: u(1440) }}>
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
