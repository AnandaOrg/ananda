import { getLocale, getTranslations } from "next-intl/server";
import RitualCards from "./RitualCards";
import WildCarousel from "./mobile/WildCarousel";
import { CAROUSEL_AUTOPLAY_SPEED } from "./configs";
import { getMediaAssets, getMediaAssetsByCategory, resolveMediaAsset, extraMediaFor } from "@/lib/media/get-media-assets";

const u = (n: number) => `calc(var(--u) * ${n})`;
const RED = "#eb4638";

const WILD = [
  { src: "/s5-wild1.png", w: 525.269, h: 652.058, alt: "Friends enjoying ANANDA outdoors" },
  { src: "/s5-wild2.png", w: 525.269, h: 652.058, alt: "A couple toasting with ANANDA pouches" },
  { src: "/s5-wild3.png", w: 522.503, h: 648.624, alt: "Holding a fan of colourful ANANDA pouches" },
  { src: "/s5-wild4.png", w: 521.32, h: 647.155, alt: "ANANDA on the go" },
  { src: "/s5-wild5.png", w: 582.282, h: 652.058, alt: "Sharing ANANDA cocktails" },
];

export default async function Ritual() {
  const tRitual = await getTranslations("ritual");
  const tWild = await getTranslations("wild");
  const bg = (await getLocale()) === "bg";
  const tags = [tWild.raw("tag1"), tWild.raw("tag2")];

  const mediaAssets = await getMediaAssets();
  const wild = WILD.map((w) => {
    const resolved = resolveMediaAsset(mediaAssets, w.src);
    return { ...w, src: resolved.url, link: resolved.link, active: resolved.active };
  }).filter((w) => w.active);
  const extraWild = extraMediaFor(await getMediaAssetsByCategory(), "social", WILD.map((w) => w.src));
  const allWild = [...wild, ...extraWild];

  return (
    <section className="relative w-full overflow-hidden" style={{ containerType: "inline-size", backgroundColor: "#fff0e5" }}>
      <div
        className="relative mx-auto"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), height: u(2952.688) }}
      >
        <div className="absolute" style={{ left: u(67), top: u(271.98), padding: `${u(10)} ${u(14)}` }}>
          <p
            className="whitespace-nowrap uppercase"
            style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98), color: RED }}
            dangerouslySetInnerHTML={{ __html: tRitual.raw("eyebrow") }}
          />
        </div>

        <p
          className="absolute font-bold uppercase"
          style={{
            left: u(78.23),
            top: u(349.17),
            width: u(886.654),
            fontFamily: "var(--font-display)",
            fontSize: u(180),
            lineHeight: 0.8,
            letterSpacing: u(bg ? -5.4 : -14.4),
            color: RED,
          }}
          dangerouslySetInnerHTML={{ __html: tRitual.raw("title") }}
        />

        <RitualCards />

        <div className="absolute" style={{ left: u(67), top: u(1791.14), padding: `${u(10)} ${u(14)}` }}>
          <p
            className="whitespace-nowrap uppercase"
            style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98), color: RED }}
            dangerouslySetInnerHTML={{ __html: tWild.raw("eyebrow") }}
          />
        </div>

        <div
          className="absolute font-bold uppercase"
          style={{
            left: u(78.23),
            top: u(1868.32),
            width: u(886.654),
            fontFamily: "var(--font-display)",
            fontSize: u(180),
            lineHeight: 0.8,
            letterSpacing: u(bg ? -5.4 : -14.4),
            color: RED,
          }}
        >
          <p className="mb-0 whitespace-nowrap" dangerouslySetInnerHTML={{ __html: tWild.raw("title1") }} />
          <p className="whitespace-nowrap" dangerouslySetInnerHTML={{ __html: tWild.raw("title2") }} />
        </div>

        <div className="absolute flex items-center" style={{ left: u(81), top: u(2167.8), gap: u(14) }}>
          {tags.map((tag, i) => (
            <span
              key={i}
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
              dangerouslySetInnerHTML={{ __html: tag }}
            />
          ))}
        </div>

        <div className="absolute" style={{ left: 0, top: u(2300.63), width: u(1440) }}>
          <WildCarousel
            items={allWild}
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
