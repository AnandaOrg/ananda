import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getMediaAssets, resolveMediaAsset } from "@/lib/media/get-media-assets";
import { LinkWrap } from "../MediaProvider";

const gu = (n: number) => `calc(var(--agu) * ${n})`;

/** The age gate's "I'm out" destination — never worth indexing. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NoEntryPage() {
  const t = await getTranslations("noEntry");
  const assets = await getMediaAssets();
  const logo = resolveMediaAsset(assets, "/ananda-logo.svg");
  const bgShape = resolveMediaAsset(assets, "/organic-bg-shape.svg");

  return (
    <main
      className="flex min-h-svh w-full flex-col items-center justify-center bg-[#eb4638]"
      style={{ gap: "clamp(28px, 5vh, 56px)", padding: "24px 0" }}
    >
      {logo.active && (
        <LinkWrap href={logo.link}>
          <Image
            src={logo.url}
            alt="ANANDA Cocktails"
            width={114}
            height={92}
            priority
            className="w-[24vw] max-w-[132px]"
            style={{ height: "auto" }}
          />
        </LinkWrap>
      )}
      <div
        className="relative"
        style={{
          containerType: "inline-size",
          width: "min(92vw, max(340px, 31.5vw))",
          aspectRatio: "625 / 391",
          ["--agu" as string]: "calc(100cqw / 625)",
          backgroundImage: bgShape.active ? `url(${bgShape.url})` : "none",
          backgroundSize: "100% 100%",
        }}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center text-[#eb4638]"
          style={{ paddingLeft: gu(46), paddingRight: gu(46) }}
        >
          <p
            className="uppercase"
            style={{
              fontFamily: "var(--font-mono-label)",
              fontWeight: 500,
              fontSize: `max(${gu(13)}, 10px)`,
              letterSpacing: "0.08em",
              lineHeight: 1,
            }}
            dangerouslySetInnerHTML={{ __html: t.raw("eyebrow") }}
          />
          <h1
            className="uppercase"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: gu(44),
              lineHeight: 1.1,
              marginTop: gu(14),
            }}
            dangerouslySetInnerHTML={{ __html: t.raw("title") }}
          />
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              fontSize: `max(${gu(18)}, 13px)`,
              lineHeight: 1.4,
              marginTop: gu(12),
            }}
            dangerouslySetInnerHTML={{ __html: t.raw("body") }}
          />
        </div>
      </div>
    </main>
  );
}
