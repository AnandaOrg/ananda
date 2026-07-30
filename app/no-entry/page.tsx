import Image from "next/image";
import { getTranslations } from "next-intl/server";

/**
 * Landing page for visitors who answered "I'm out" on the age gate. Reuses
 * the gate's visual language — brand-red ground, the torn-paper card
 * (organic-bg-shape.svg) scaled via `--agu = 100cqw / 625` — so the refusal
 * still reads as part of the site. Deliberately a dead end: no link back in.
 */

const gu = (n: number) => `calc(var(--agu) * ${n})`;

export default async function NoEntryPage() {
  const t = await getTranslations("noEntry");
  return (
    <main
      className="flex min-h-svh w-full flex-col items-center justify-center bg-[#eb4638]"
      style={{ gap: "clamp(28px, 5vh, 56px)", padding: "24px 0" }}
    >
      <Image
        src="/ananda-logo.svg"
        alt="ANANDA Cocktails"
        width={114}
        height={92}
        priority
        className="w-[24vw] max-w-[132px]"
        style={{ height: "auto" }}
      />
      <div
        className="relative"
        style={{
          containerType: "inline-size",
          // Same card sizing as the age gate (AgeGate.tsx).
          width: "min(92vw, max(340px, 31.5vw))",
          aspectRatio: "625 / 391",
          ["--agu" as string]: "calc(100cqw / 625)",
          backgroundImage: "url(/organic-bg-shape.svg)",
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
          >
            {t("eyebrow")}
          </p>
          <h1
            className="uppercase"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: gu(44),
              lineHeight: 1.1,
              marginTop: gu(14),
            }}
          >
            {t("title")}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              fontSize: `max(${gu(18)}, 13px)`,
              lineHeight: 1.4,
              marginTop: gu(12),
            }}
          >
            {t("body")}
          </p>
        </div>
      </div>
    </main>
  );
}
