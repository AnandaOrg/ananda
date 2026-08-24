import { getTranslations } from "next-intl/server";
import { mu, MU_VAR } from "./mobile/scale";
import { getMediaAssets, getMediaAssetsByCategory, resolveMediaAsset } from "@/lib/media/get-media-assets";
import { LinkWrap } from "./MediaProvider";

const ud = (n: number) => `calc(var(--ud) * ${n})`;
const UD_VAR = { ["--ud" as string]: "calc(100cqw / 1440)" } as const;
const getCurrentYear = () => new Date().getFullYear();

type SocialIcon = { url: string; alt: string; link: string | null };

/** Fully data-driven — the "footer-social" category is a plain list of icons (each
 *  with its own image, alt text, and link), not fixed per-platform JSX, so adding a
 *  new platform or changing where one links is a backoffice edit, not a code change. */
function Socials({ scale, icons }: { scale: (n: number) => string; icons: SocialIcon[] }) {
  return (
    <div className="flex items-center" style={{ gap: scale(14) }}>
      {icons.map((icon) => (
        <LinkWrap key={icon.url} href={icon.link}>
          <img src={icon.url} alt={icon.alt} style={{ width: scale(39), height: scale(39) }} />
        </LinkWrap>
      ))}
    </div>
  );
}

export default async function Footer() {
  const t = await getTranslations("footer");
  const assets = await getMediaAssets();
  const byCategory = await getMediaAssetsByCategory();
  const icons = (byCategory["footer-social"] ?? []).filter((row) => row.active).map((row) => ({ url: row.blobUrl, alt: row.alt, link: row.link }));
  const logo = resolveMediaAsset(assets, "/ananda-logo.svg");

  return (
    <footer className="w-full bg-[#eb4638]" style={{ containerType: "inline-size" }}>
      <div className="flex justify-center md:hidden">
        <div className="w-full" style={{ containerType: "inline-size" }}>
          <div className="flex flex-col" style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)}`, gap: mu(40) }}>
            <div className="h-px w-full bg-[#fff0e5]" />
            <div className="flex flex-col items-center" style={{ gap: mu(32) }}>
              {logo.active && (
                <LinkWrap href={logo.link}>
                  <img src={logo.url} alt="ANANDA Cocktails" style={{ width: mu(152.482), height: "auto" }} />
                </LinkWrap>
              )}
              <Socials scale={mu} icons={icons} />
              <p className="text-center text-[#fff0e5]" style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: mu(14), lineHeight: mu(18), width: mu(280) }}>
                {t("copyright", { year: getCurrentYear() })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block" style={UD_VAR}>
        <div className="flex flex-col" style={{ padding: ud(80), gap: ud(40) }}>
          <div className="h-px w-full bg-[#fff0e5]" />
          <div className="flex w-full items-end justify-between">
            {logo.active && (
              <LinkWrap href={logo.link}>
                <img src={logo.url} alt="ANANDA Cocktails" style={{ width: ud(152.482), height: "auto" }} />
              </LinkWrap>
            )}
            <p className="text-center text-[#fff0e5]" style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: ud(14), lineHeight: ud(14), width: ud(280) }}>
              {t("copyright", { year: getCurrentYear() })}
            </p>
            <Socials scale={ud} icons={icons} />
          </div>
        </div>
      </div>
    </footer>
  );
}
