import Image from "next/image";
import oceanBackground from "../public/ananda-bg.png";
import pourPhoto from "../public/ananda-pour.png";
import AboutCollage from "./AboutCollage";
import Pathways from "./Pathways";
import Ritual from "./Ritual";

export default function Home() {
  return (
    <>
      {/* Section 1 — splash */}
      <section className="relative flex h-screen items-center justify-center overflow-hidden">
        <Image
          src={oceanBackground}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover"
        />
        <Image
          src="/ananda-logo.svg"
          alt="ANANDA Cocktails"
          width={283}
          height={192}
          priority
          className="relative w-[clamp(180px,22vw,283px)] h-auto"
        />
      </section>

      {/* Section 2 — Ditch the glass */}
      <section className="flex min-h-screen items-center justify-center overflow-hidden bg-[#fff0e5] px-6 py-24">
        <div className="flex flex-col items-center text-center text-[#eb4638]">
          <p
            className="mb-[clamp(1.5rem,4vw,3.5rem)] text-[14px] uppercase leading-[0.87] tracking-[0.98px]"
            style={{ fontFamily: "var(--font-mono-label)" }}
          >
            [01] Ditch the glass
          </p>

          <h2
            className="text-[clamp(2.75rem,12.5vw,180px)] font-bold uppercase leading-[0.8] tracking-[-0.08em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="block">Liquid Bliss.</span>
            <span className="flex items-center justify-center gap-[0.2em]">
              <span>Mixed to</span>
              <span className="relative inline-block size-[1.2em] shrink-0 rotate-45 overflow-hidden">
                <Image
                  src={pourPhoto}
                  alt="Pouring an ANANDA cocktail"
                  fill
                  sizes="(max-width: 768px) 40vw, 320px"
                  className="-rotate-45 scale-150 object-cover"
                />
              </span>
              <span>Move.</span>
            </span>
          </h2>
        </div>
      </section>

      {/* Section 3 — What we're about */}
      <AboutCollage />

      {/* Section 4 — The Pathways to Bliss */}
      <Pathways />

      {/* Section 5 — The Ritual / ANANDA in the Wild */}
      <Ritual />
    </>
  );
}
