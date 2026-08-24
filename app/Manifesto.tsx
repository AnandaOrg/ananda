import { getLocale } from "next-intl/server";
import RevealStatement from "./RevealStatement";
import { getManifesto } from "@/lib/content/get-manifesto";
import { getMediaAssets, resolveMediaAsset } from "@/lib/media/get-media-assets";
import type { AppLocale } from "@/i18n/config";

const u = (n: number) => `calc(var(--u) * ${n})`;

export default async function Manifesto() {
  const locale = (await getLocale()) as AppLocale;
  const paras = await getManifesto(locale);
  const mandala = resolveMediaAsset(await getMediaAssets(), "/s5-mandala.svg");

  return (
    <section className="relative w-full overflow-hidden" style={{ containerType: "inline-size", backgroundColor: "#fff0e5" }}>
      <div
        className="relative mx-auto flex flex-col items-center"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), paddingTop: u(220), paddingBottom: 0 }}
      >
        <RevealStatement
          paras={paras}
          smallFontSize={u(27.296)}
          paraSpacing={locale === "bg" ? u(28) : undefined}
          className="font-bold"
          style={{
            width: u(1311.92),
            fontFamily: "var(--font-display)",
            fontSize: u(59.247),
            lineHeight: 1.15,
            letterSpacing: u(locale === "bg" ? -1.185 : -2.3699),
            color: "var(--terracotta)",
          }}
        />

        {mandala.active && (
          <img src={mandala.url} alt="" style={{ marginTop: u(60), width: u(209.93), height: u(219.7) }} />
        )}
      </div>
    </section>
  );
}
