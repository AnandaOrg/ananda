import Image from "next/image";
import { mu, MU_VAR, maskStyle } from "./scale";
import ScrollVideoCanvas from "../ScrollVideoCanvas";

/** Mobile section 3 — "What we're about" collage (Figma 184:1260, 390×1600). */

type MaskedProps = {
  photo: string;
  alt: string;
  mask: string;
  maskSize: [number, number];
  maskPos: [number, number];
  box: { left: number; top: number; width: number; height: number };
  inner?: { width: number; height: number; rotate: number };
};

function Masked({ photo, alt, mask, maskSize, maskPos, box, inner }: MaskedProps) {
  const place = { left: mu(box.left), top: mu(box.top), width: mu(box.width), height: mu(box.height) };
  const img = <Image src={photo} alt={alt} fill sizes="60vw" className="object-cover" />;
  const ms = maskStyle(mask, maskSize[0], maskSize[1], maskPos[0], maskPos[1]);

  if (!inner) {
    return (
      <div className="absolute overflow-hidden" style={{ ...place, ...ms }}>
        {img}
      </div>
    );
  }
  return (
    <div className="absolute flex items-center justify-center" style={place}>
      <div style={{ transform: `rotate(${inner.rotate}deg)` }}>
        <div className="relative overflow-hidden" style={{ width: mu(inner.width), height: mu(inner.height), ...ms }}>
          {img}
        </div>
      </div>
    </div>
  );
}

export default function MobileCollage() {
  return (
    <section className="w-full overflow-hidden bg-[#fff0e5] md:hidden" style={{ containerType: "inline-size" }}>
      <div className="relative" style={{ ...MU_VAR, width: mu(390), height: mu(1600) }}>
        {/* Pineapple — GSAP scroll-scrubbed */}
        <ScrollVideoCanvas
          frameBase="/frames/ananas/"
          frameCount={120}
          alt="Pineapple slices against a blue sky"
          style={{
            position: "absolute",
            left: mu(263.8),
            top: mu(652.78),
            width: mu(166.943),
            height: mu(333.885),
            ...maskStyle("/m-pineapple.svg", 160.061, 320.121, 2.436, 6.01),
          }}
        />

        {/* Picnic */}
        <Masked
          photo="/c-picnic.png"
          alt="Friends sharing ANANDA cocktails on the grass"
          mask="/m-diamond.svg"
          maskSize={[286.092, 299.788]}
          maskPos={[31.332, 59.313]}
          box={{ left: 7.51, top: 33.92, width: 388.367, height: 445.572 }}
        />

        {/* Blue pouch scene */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: mu(53), top: mu(723), width: mu(201), height: mu(730) }}
        >
          <div style={{ transform: "rotate(-0.64deg)" }}>
            <div
              className="relative overflow-hidden"
              style={{ width: mu(196), height: mu(720) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/c-bluepouch.png"
                alt="Pouring a chilled ANANDA cocktail"
                className="absolute max-w-none object-cover"
                style={{ width: "97.57%", height: "96.85%", left: "2.63%", top: "-3.48%" }}
              />
            </div>
          </div>
        </div>

        {/* Hand & lemon (rotated -0.64) */}
        <Masked
          photo="/c-tophand.png"
          alt="A hand squeezing fresh citrus"
          mask="/m-diamond.svg"
          maskSize={[308.291, 310.545]}
          maskPos={[8.693, 15.6]}
          box={{ left: 34.89, top: 1038.2, width: 315.09, height: 360.397 }}
          inner={{ width: 311.102, height: 356.926, rotate: -0.64 }}
        />

        {/* Red wave */}
        <div className="absolute" style={{ left: mu(-28.14), top: mu(1468.86), width: mu(594.406), height: mu(131.141) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/c-wave.svg" alt="" className="block size-full" />
        </div>

        {/* Product pouch overlay */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          style={{ left: `calc(50% - ${mu(8.64)})`, top: `calc(50% + ${mu(585.65)})`, width: mu(181.351), height: mu(221.932) }}
        >
          <div style={{ transform: "rotate(158.5deg)" }}>
            <div className="relative overflow-hidden" style={{ width: mu(119.499), height: mu(191.458), boxShadow: `${mu(5.113)} ${mu(3.719)} ${mu(13.34)} 0 rgba(0,0,0,0.25)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/c-pouch.png" alt="ANANDA cocktail pouch" className="absolute max-w-none" style={{ width: "177.86%", height: "111.18%", left: "-40.81%", top: "-7.3%" }} />
            </div>
          </div>
        </div>

        {/* Copy block */}
        <div className="absolute flex flex-col items-start" style={{ left: mu(35.7), top: mu(469), width: mu(264), gap: mu(16) }}>
          <p className="whitespace-nowrap uppercase text-[#eb4638]" style={{ fontFamily: "var(--font-mono-label)", fontSize: mu(12), lineHeight: 0.87, letterSpacing: mu(0.84) }}>
            What we’re about
          </p>
          <div style={{ fontFamily: "var(--font-body)", fontSize: mu(18), lineHeight: 1.2, letterSpacing: mu(0.18), color: "#eb4638", width: mu(263.732) }}>
            <p className="mb-0">Premium, bar-strength cocktails mixed for the makers, the movers, and the midnight sun.</p>
            <p>No glass, no pretense. Just pure, uninhibited joy - ready whenever and wherever you are.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
