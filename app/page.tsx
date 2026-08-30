import Image from "next/image";
import AmbientVideo from "./AmbientVideo";
import AutoplayRescue from "./AutoplayRescue";
import DitchTheGlass from "./DitchTheGlass";
import AboutCollage from "./AboutCollage";
import LanguageSwitcher from "./LanguageSwitcher";
import Manifesto from "./Manifesto";
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
import AgeGate from "./AgeGate";
import ScrollCue from "./ScrollCue";
import { getMediaAssets, resolveMediaAsset } from "@/lib/media/get-media-assets";

export default async function Home() {
  const mediaAssets = await getMediaAssets();
  const heroVideo = resolveMediaAsset(mediaAssets, "/videos/hero.webm");
  const heroVideoMobile = resolveMediaAsset(mediaAssets, "/videos/hero-mobile.webm");

  return (
    <FlavorProvider>
      <AutoplayRescue />

      <AgeGate />

      <LanguageSwitcher />

      <section className="relative flex h-screen items-center justify-center overflow-hidden">
        <h1 className="sr-only">ANANDA Cocktails — Premium Canned Cocktails</h1>
        <AmbientVideo className="absolute inset-0 h-full w-full object-cover">
          {heroVideoMobile.active && <source src={heroVideoMobile.url} media="(max-width: 767px)" />}
          {heroVideo.active && <source src={heroVideo.url} />}
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
        <ScrollCue />
      </section>

      <div className="hidden md:block">
        <DitchTheGlass />
      </div>
      <div className="md:hidden">
        <MobileIntro />
      </div>

      <div className="hidden md:block">
        <AboutCollage />
      </div>
      <MobileCollageMedia />
      <MobileKyoto />

      <div className="hidden md:block">
        <Pathways />
      </div>
      <MobilePathways />

      <div className="hidden md:block">
        <Manifesto />
      </div>
      <MobileAbout />

      <div className="hidden md:block">
        <Ritual />
      </div>
      <MobileRitual />
      <MobileSocial />

      <DropList />

      <Footer />
    </FlavorProvider>
  );
}
