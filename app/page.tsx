import Image, { getImageProps } from "next/image";
import AmbientVideo from "./AmbientVideo";
import heroPoster from "@/public/hero-poster.jpg";
import heroPosterMobile from "@/public/hero-poster-mobile.jpg";
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

/** Hero poster = the video's first frame, art-directed per breakpoint through the image
 *  optimizer (responsive srcSet, AVIF/WebP, hashed URLs) — see next/image "Art direction". */
const POSTER = { alt: "", sizes: "100vw", priority: true } as const;
const {
  props: { srcSet: posterMobileSet },
} = getImageProps({ ...POSTER, src: heroPosterMobile });
const {
  props: { srcSet: posterSet, ...posterImg },
} = getImageProps({ ...POSTER, src: heroPoster });

export default async function Home() {
  const mediaAssets = await getMediaAssets();
  const heroVideo = resolveMediaAsset(mediaAssets, "/videos/hero.webm");
  const heroVideoMobile = resolveMediaAsset(mediaAssets, "/videos/hero-mobile.webm");

  return (
    <FlavorProvider>
      <AutoplayRescue />

      <AgeGate />

      <LanguageSwitcher />

      <section className="relative flex h-screen items-center justify-center overflow-hidden bg-black">
        <h1 className="sr-only">ANANDA Cocktails — Premium Canned Cocktails</h1>
        {/* Static poster: paints with the HTML, and the <video> (transparent until it has
            data) simply covers it once playing. */}
        <picture>
          <source media="(max-width: 767px)" srcSet={posterMobileSet} />
          <source srcSet={posterSet} />
          <img {...posterImg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        </picture>
        <AmbientVideo className="absolute inset-0 h-full w-full object-cover">
          {/* Per breakpoint: the managed .webm, then its H.264 copy from public/ — picked by
              browsers without VP9/WebM, or when the .webm fails to load (a <video> falls
              through its sources in order). A phone only reaches the desktop pair when the
              mobile video is deactivated, as before. */}
          {heroVideoMobile.active && <source src={heroVideoMobile.url} type="video/webm" media="(max-width: 767px)" />}
          {heroVideoMobile.active && <source src="/videos/hero-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />}
          {heroVideo.active && <source src={heroVideo.url} type="video/webm" />}
          {heroVideo.active && <source src="/videos/hero.mp4" type="video/mp4" />}
        </AmbientVideo>
        <Image
          src="/ananda-logo.svg"
          alt="ANANDA Cocktails"
          width={283}
          height={228}
          priority
          className="relative z-10 w-[74vw] max-w-[290px] md:w-[clamp(180px,22vw,283px)] md:max-w-none"
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
