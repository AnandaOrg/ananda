import Image, { type StaticImageData } from "next/image";
import picnic from "../public/c-picnic.png";
import bluePouch from "../public/c-bluepouch.png";
import pineapple from "../public/c-pineapple.png";
import strawberry from "../public/c-strawberry.png";
import topHand from "../public/c-tophand.png";

/**
 * Section 3 — "What we're about" collage (Figma node 71:7812, a 1440×3000 frame).
 *
 * The whole frame is rebuilt at its native pixel coordinates and scaled to the
 * viewport width via a single design unit `--u = 100cqw / 1440`. Every length is
 * expressed as `calc(var(--u) * <figma-px>)`, so the collage keeps its exact
 * proportions at any width. Rotations and percentage-based crops are unitless and
 * carry over as-is. Torn-paper edges are reproduced with the original SVG alpha
 * masks via `mask-image` + `mask-size`/`mask-position`.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;

function maskStyle(src: string, [mw, mh]: [number, number], [mx, my]: [number, number]) {
  const image = `url(${src})`;
  const size = `${u(mw)} ${u(mh)}`;
  const position = `${u(mx)} ${u(my)}`;
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: size,
    WebkitMaskSize: size,
    maskPosition: position,
    WebkitMaskPosition: position,
  } as const;
}

type MaskedProps = {
  photo: StaticImageData;
  alt: string;
  mask: string;
  maskSize: [number, number];
  maskPos: [number, number];
  sizes: string;
  /** Outer placement box (figma px). */
  box: { left: number; top: number; width: number; height: number };
  /** Inner rotated layer (figma px). When omitted, the box itself is masked. */
  inner?: { width: number; height: number; rotate: number };
};

/** A torn-edge masked photo, optionally rotated about its own centre. */
function Masked({ photo, alt, mask, maskSize, maskPos, sizes, box, inner }: MaskedProps) {
  const place = {
    left: u(box.left),
    top: u(box.top),
    width: u(box.width),
    height: u(box.height),
  };

  const photoEl = (
    <Image src={photo} alt={alt} fill sizes={sizes} className="object-cover" />
  );

  if (!inner) {
    return (
      <div
        className="absolute overflow-hidden"
        style={{ ...place, ...maskStyle(mask, maskSize, maskPos) }}
      >
        {photoEl}
      </div>
    );
  }

  return (
    <div className="absolute flex items-center justify-center" style={place}>
      <div style={{ transform: `rotate(${inner.rotate}deg)` }}>
        <div
          className="relative overflow-hidden"
          style={{
            width: u(inner.width),
            height: u(inner.height),
            ...maskStyle(mask, maskSize, maskPos),
          }}
        >
          {photoEl}
        </div>
      </div>
    </div>
  );
}

export default function AboutCollage() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#fff0e5] text-[#eb4638]"
      style={{ containerType: "inline-size" }}
    >
      <div
        className="relative mx-auto"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), height: u(3000) }}
      >
        {/* Pineapple slices — right, mid */}
        <Masked
          photo={pineapple}
          alt="Pineapple slices against a blue sky"
          mask="/m-pineapple.svg"
          maskSize={[379.875, 759.75]}
          maskPos={[5.779, 14.263]}
          sizes="40vw"
          box={{ left: 930.8, top: 1008.67, width: 396.208, height: 792.416 }}
        />

        {/* Picnic — top left */}
        <Masked
          photo={picnic}
          alt="Friends sharing ANANDA cocktails on the grass"
          mask="/m-diamond.svg"
          maskSize={[814.926, 829.07]}
          maskPos={[89.9, 164.033]}
          sizes="75vw"
          box={{ left: -15.612, top: -108.123, width: 1074.037, height: 1232.237 }}
        />

        {/* Blue pouch scene — lower left/centre */}
        <Masked
          photo={bluePouch}
          alt="Pouring a chilled ANANDA cocktail"
          mask="/m-strawb.svg"
          maskSize={[729.146, 735.028]}
          maskPos={[20.492, 36.923]}
          sizes="55vw"
          box={{ left: 98.02, top: 1824.54, width: 745.788, height: 853.023 }}
          inner={{ width: 736.348, height: 844.808, rotate: -0.64 }}
        />

        {/* Red wave */}
        <div
          className="absolute"
          style={{ left: u(-9.75), top: u(2687.06), width: u(1464.584), height: u(323.123) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/c-wave.svg" alt="" className="block size-full" />
        </div>

        {/* Product pouch — overlaid on the wave */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          style={{
            left: `calc(50% - ${u(190.37)})`,
            top: `calc(50% + ${u(1013.66)})`,
            width: u(390.15),
            height: u(477.453),
          }}
        >
          <div style={{ transform: "rotate(158.5deg)" }}>
            <div
              className="relative overflow-hidden"
              style={{
                width: u(257.084),
                height: u(411.893),
                boxShadow: `${u(11)} ${u(8)} ${u(28.7)} 0 rgba(0,0,0,0.25)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/c-pouch.png"
                alt="ANANDA cocktail pouch"
                className="absolute max-w-none"
                style={{ width: "177.86%", height: "111.18%", left: "-40.81%", top: "-7.3%" }}
              />
            </div>
          </div>
        </div>

        {/* Strawberries with pouch — left, mid */}
        <Masked
          photo={strawberry}
          alt="An ANANDA pouch nestled in fresh strawberries"
          mask="/m-14.svg"
          maskSize={[746.535, 592.314]}
          maskPos={[0.979, 5.315]}
          sizes="55vw"
          box={{ left: -21.5, top: 1072.53, width: 750.69, height: 604.722 }}
          inner={{ width: 604.722, height: 750.69, rotate: -90 }}
        />

        {/* Hand & lemon — top, over picnic */}
        <Masked
          photo={topHand}
          alt="A hand squeezing fresh citrus"
          mask="/m-diamond.svg"
          maskSize={[827.912, 836.01]}
          maskPos={[27.303, 41.315]}
          sizes="60vw"
          box={{ left: 110.73, top: 8.63, width: 852.622, height: 970.753 }}
          inner={{ width: 825.912, height: 947.565, rotate: -1.64 }}
        />

        {/* Copy block — top right */}
        <div
          className="absolute flex flex-col"
          style={{ left: u(965), top: u(92.16), width: u(401) }}
        >
          <div style={{ padding: `${u(10)} ${u(14)}` }}>
            <p
              className="whitespace-nowrap uppercase"
              style={{
                fontFamily: "var(--font-mono-label)",
                fontSize: u(10),
                lineHeight: 0.87,
                letterSpacing: u(0.7),
              }}
            >
              What we’re about
            </p>
          </div>
          <div style={{ padding: `${u(10)} ${u(14)}` }}>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: u(16),
                lineHeight: 1.6,
                letterSpacing: u(0.16),
              }}
            >
              <p className="mb-0">
                Premium, bar-strength cocktails mixed for the makers, the movers, and the
                midnight sun.
              </p>
              <p>
                No glass, no pretense. Just pure, uninhibited joy - ready whenever and
                wherever you are.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
