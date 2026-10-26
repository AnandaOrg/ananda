import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Brand-styled 404 (same palette and type as /no-entry), copy from the `notFound`
 *  messages namespace so it follows the EN/BG switch like every other page. */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-[#eb4638] text-center text-[#fff0e5]" style={{ gap: 20, padding: 24 }}>
      <p className="uppercase" style={{ fontFamily: "var(--font-mono-label)", fontWeight: 500, fontSize: 13, letterSpacing: "0.08em", lineHeight: 1 }}>
        {t("eyebrow")}
      </p>
      <h1 className="uppercase" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(32px, 6vw, 64px)", lineHeight: 1.05 }}>
        {t("title")}
      </h1>
      <Link
        href="/"
        className="uppercase"
        style={{ fontFamily: "var(--font-mono-label)", fontWeight: 500, fontSize: 13, letterSpacing: "0.08em", lineHeight: 1, textDecoration: "underline", textUnderlineOffset: 4 }}
      >
        {t("back")}
      </Link>
    </main>
  );
}
