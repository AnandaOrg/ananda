import Image from "next/image";
import DitchTheGlass from "./DitchTheGlass";
import AboutCollage from "./AboutCollage";
import Pathways from "./Pathways";
import Ritual from "./Ritual";
import DropList from "./DropList";
import Footer from "./Footer";
import MobileIntro from "./mobile/MobileIntro";
import MobileCollage from "./mobile/MobileCollage";
import MobileCollageMedia from "./mobile/MobileCollageMedia";
import MobileKyoto from "./mobile/MobileKyoto";
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
        <video
          src="/videos/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        <Image
          src="/ananda-logo.svg"
          alt="ANANDA Cocktails"
          width={283}
          height={228}
          priority
          className="relative w-[74vw] max-w-[290px] md:w-[clamp(180px,22vw,283px)] md:max-w-none"
          style={{ height: "auto" }}
        />
      </section>

      {/* Sections 2 + 3 — "Ditch the glass" → "What we're about" as ONE pinned
          stage (desktop): the diamond grows/travels, the copy fades in, then the
          gallery steps through its photos. Wrapped in a block container so its
          ScrollTrigger pin sits in normal block flow — pinning misbehaves for a
          direct flex child of <body>. Mobile keeps its own twins. */}
      <div className="hidden md:block">
        <DitchTheGlass />
      </div>
      {/* Same block-container rationale as DitchTheGlass: MobileIntro pins, and
          pinning misbehaves for a direct flex child of <body>. */}
      <div className="md:hidden">
        <MobileIntro />
      </div>

      {/* Section 3 (collage) — pineapple + strawberries videos, the kyoto pour →
          3-D pouch liftoff, and the red wave (desktop). */}
      <div className="hidden md:block">
        <AboutCollage />
      </div>
      <MobileKyoto />

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
