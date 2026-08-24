import { getLocale, getTranslations } from "next-intl/server";
import { CAROUSEL_AUTOPLAY_SPEED } from "../configs";
import { mu, MU_VAR } from "./scale";
import WildCarousel from "./WildCarousel";
import { getMediaAssets, getMediaAssetsByCategory, resolveMediaAsset, extraMediaFor } from "@/lib/media/get-media-assets";

const WILD = [
  { src: "/s5-wild1.png", w: 405.682, alt: "Friends enjoying ANANDA outdoors" },
  { src: "/s5-wild2.png", w: 405.682, alt: "A couple toasting with ANANDA pouches" },
  { src: "/s5-wild3.png", w: 405.682, alt: "Holding a fan of colourful ANANDA pouches" },
  { src: "/s5-wild4.png", w: 405.35, alt: "ANANDA on the go" },
  { src: "/s5-wild5.png", w: 449.716, alt: "Sharing ANANDA cocktails" },
];

export default async function MobileSocial() {
  const t = await getTranslations("wild");
  const bg = (await getLocale()) === "bg";
  const tags = [t("tag1"), t("tag2")];

  const mediaAssets = await getMediaAssets();
  const wild = WILD.map((w) => {
    const resolved = resolveMediaAsset(mediaAssets, w.src);
    return { ...w, src: resolved.url, link: resolved.link, active: resolved.active };
  }).filter((w) => w.active);
  const extraWild = extraMediaFor(await getMediaAssetsByCategory(), "social", WILD.map((w) => w.src));
  const allWild = [...wild, ...extraWild];

  return (
    <section className="w-full overflow-hidden bg-[#fff0e5] md:hidden" style={{ containerType: "inline-size" }}>
      <div className="relative flex flex-col items-start" style={{ ...MU_VAR, width: mu(390) }}>
        <div className="flex flex-col items-start" style={{ marginLeft: mu(24), marginTop: mu(60), marginBottom: mu(60), width: mu(316), gap: mu(40) }}>
          <div className="flex flex-col items-start uppercase text-[#eb4638]" style={{ gap: mu(16) }}>
            <p className="whitespace-nowrap" style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}>
              {t("eyebrow")}
            </p>
            <div className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: mu(64), lineHeight: 0.8, letterSpacing: mu(bg ? -1.92 : -5.12), width: mu(276.93) }}>
              <p className="mb-0 whitespace-nowrap">{t("title1")}</p>
              <p className="whitespace-nowrap">{t("title2")}</p>
            </div>
          </div>
          <div className="flex flex-col items-start" style={{ gap: mu(14) }}>
            {tags.map((tag) => (
              <span
                key={tag}
                className={bg ? undefined : "whitespace-nowrap"}
                style={{
                  border: `${mu(0.75)} solid #eb4638`,
                  borderRadius: mu(2),
                  padding: `${mu(10)} ${mu(14)}`,
                  fontFamily: "var(--font-mono-label)",
                  fontSize: mu(11),
                  lineHeight: bg ? 1.4 : 0.87,
                  letterSpacing: mu(0.77),
                  color: "#eb4638",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div style={{ width: mu(390) }}>
          <WildCarousel items={allWild} slideW={mu(300)} slideH={mu(503.5)} gap="0px" pad="0px" snapType="none" startIndex={1} autoplay={CAROUSEL_AUTOPLAY_SPEED} />
        </div>
      </div>
    </section>
  );
}
