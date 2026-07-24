import Image from "next/image";
import AmbientVideo from "./AmbientVideo";
import AutoplayRescue from "./AutoplayRescue";
import DitchTheGlass from "./DitchTheGlass";
import AboutCollage from "./AboutCollage";
import Pathways from "./Pathways";
import Ritual from "./Ritual";
import DropList from "./DropList";
import Footer from "./Footer";
import MobileIntro from "./mobile/MobileIntro";
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
      {/* iOS: retry blocked autoplays on first touch (Low Power Mode) */}
      <AutoplayRescue />

      {/* Section 1 — splash (shared) */}
      <section className="relative flex h-screen items-center justify-center overflow-hidden">
        {/* Source picked per breakpoint at load: phones get the 720p encode
            (a fraction of the decode cost), md+ keeps the full 1080p file.
            AmbientVideo pauses the loop while the hero is scrolled away. */}
        <AmbientVideo className="absolute inset-0 h-full w-full object-cover">
          <source src="/videos/hero-mobile.mp4" media="(max-width: 767px)" />
          <source src="/videos/hero.mp4" />
        </AmbientVideo>
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
      {/* Mobile sections 2 + 3 — pinned "Liquid Bliss. Mixed to Move." heading →
          diamond grows into the framed gallery → "What we're about" copy. Wrapped
          in a block container: ScrollTrigger's pin misbehaves for a direct flex
          child of <body> (which is `flex flex-col`). */}
      <div className="md:hidden">
        <MobileIntro />
      </div>

      {/* Section 3 (collage) — pineapple + strawberries videos, the kyoto pour →
          3-D pouch liftoff, and the red wave (desktop). */}
      <div className="hidden md:block">
        <AboutCollage />
      </div>
      {/* Mobile twin of AboutCollage's media (pineapple + strawberries); the
          pouch half of AboutCollage lives in MobileKyoto just below. */}
      <MobileCollageMedia />
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
