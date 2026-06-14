import { mu, MU_VAR } from "./scale";
import WildCarousel from "./WildCarousel";

const TAGS = ["100% Pure joy", "Tag @AnandaCocktails to join the collective"];

const WILD = [
  { src: "/s5-wild1.png", w: 405.682, alt: "Friends enjoying ANANDA outdoors" },
  { src: "/s5-wild2.png", w: 405.682, alt: "A couple toasting with ANANDA pouches" },
  { src: "/s5-wild3.png", w: 405.682, alt: "Holding a fan of colourful ANANDA pouches" },
  { src: "/s5-wild4.png", w: 405.35, alt: "ANANDA on the go" },
  { src: "/s5-wild5.png", w: 449.716, alt: "Sharing ANANDA cocktails" },
];

/** Mobile section — "ANANDA in the Wild" + photo strip (Figma 184:3036). */
export default function MobileSocial() {
  return (
    <section className="w-full overflow-hidden bg-[#fff0e5] md:hidden" style={{ containerType: "inline-size" }}>
      <div className="relative" style={{ ...MU_VAR, width: mu(390), height: mu(845) }}>
        {/* Heading + tags */}
        <div className="absolute flex flex-col items-start" style={{ left: mu(24), top: mu(60), width: mu(316), gap: mu(40) }}>
          <div className="flex flex-col items-start uppercase text-[#eb4638]" style={{ gap: mu(16) }}>
            <p className="whitespace-nowrap" style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}>
              [04] Our collective
            </p>
            <div className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: mu(64), lineHeight: 0.8, letterSpacing: mu(-5.12), width: mu(276.93) }}>
              <p className="mb-0">ANANDA IN</p>
              <p>THE WILD</p>
            </div>
          </div>
          <div className="flex flex-col items-start" style={{ gap: mu(14) }}>
            {TAGS.map((t) => (
              <span
                key={t}
                className="whitespace-nowrap"
                style={{
                  border: `${mu(0.75)} solid #eb4638`,
                  borderRadius: mu(2),
                  padding: `${mu(10)} ${mu(14)}`,
                  fontFamily: "var(--font-mono-label)",
                  fontSize: mu(10),
                  lineHeight: 0.87,
                  letterSpacing: mu(0.7),
                  color: "#eb4638",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Photo carousel — centred slide with a sliver of the neighbours peeking,
            free-scrolling, edge-to-edge, flush with the section below. */}
        <div className="absolute left-0" style={{ top: mu(341.5), width: mu(390) }}>
          <WildCarousel items={WILD} slideW={mu(300)} slideH={mu(503.5)} gap="0px" pad="0px" snapType="none" startIndex={1} autoplay={80} />
        </div>
      </div>
    </section>
  );
}
