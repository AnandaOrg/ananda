import { getLocale } from "next-intl/server";
import { mu, MU_VAR } from "./scale";
import RevealStatement from "../RevealStatement";
import { getManifestoMobile } from "@/lib/content/get-manifesto";
import { getMediaAssets, resolveMediaAsset } from "@/lib/media/get-media-assets";
import type { AppLocale } from "@/i18n/config";

export default async function MobileAbout() {
  const locale = (await getLocale()) as AppLocale;
  const paras = await getManifestoMobile(locale);
  const mandala = resolveMediaAsset(await getMediaAssets(), "/s5-mandala.svg");

  return (
    <section className="flex w-full justify-center bg-[#fff0e5] md:hidden">
      <div className="w-full" style={{ containerType: "inline-size" }}>
        <div style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)} ${mu(40)}` }}>
          <div className="flex flex-col items-center" style={{ gap: mu(60) }}>
            <RevealStatement
              paras={paras}
              smallFontSize={mu(15.48)}
              paraSpacing={locale === "bg" ? mu(16) : undefined}
              className="font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--terracotta)", letterSpacing: mu(locale === "bg" ? -0.48 : -0.96), fontSize: mu(24), lineHeight: 1.15, alignSelf: "stretch" }}
            />
            {mandala.active && (
              <img src={mandala.url} alt="" style={{ width: mu(140.075), height: mu(146.594) }} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
