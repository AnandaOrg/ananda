import Image from "next/image";
import oceanBackground from "../public/ananda-bg.png";
import pourPhoto from "../public/ananda-pour.png";
import AboutCollage from "./AboutCollage";
import Pathways from "./Pathways";
import Ritual from "./Ritual";
import DropList from "./DropList";
import Footer from "./Footer";
import MobileIntro from "./mobile/MobileIntro";
import MobileCollage from "./mobile/MobileCollage";
import MobilePathways from "./mobile/MobilePathways";
import MobileAbout from "./mobile/MobileAbout";
import MobileRitual from "./mobile/MobileRitual";
import MobileSocial from "./mobile/MobileSocial";
import FlavorProvider from "./FlavorProvider";

export default function Home() {
  return (
    <FlavorProvider>
      {/* Section 1 — splash (shared) */}
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
          className="relative h-auto w-[74vw] max-w-[290px] md:w-[clamp(180px,22vw,283px)] md:max-w-none"
        />
      </section>

      {/* Section 2 — Ditch the glass */}
      <section className="hidden min-h-screen items-center justify-center overflow-hidden bg-[#fff0e5] px-6 py-24 md:flex">
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
      <MobileIntro />

      {/* Section 3 — What we're about */}
      <div className="hidden md:block">
        <AboutCollage />
      </div>
      <MobileCollage />

      {/* Section 4 — The Pathways to Bliss */}
      <div className="hidden md:block">
        <Pathways />
      </div>
      <MobilePathways />

      {/* Section 5 — The Ritual / ANANDA in the Wild (desktop is one section) */}
      <div className="hidden md:block">
        <Ritual />
      </div>
      <MobileAbout />
      <MobileRitual />
      <MobileSocial />

      {/* Section 6 — Join the drop list (shared) */}
      <DropList />

      {/* Section 7 — Footer (shared) */}
      <Footer />
    </FlavorProvider>
  );
}
