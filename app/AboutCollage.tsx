import Image, { type StaticImageData } from "next/image";
import redPouch from "../public/c-redpouch.png";
import pineapple from "../public/c-pineapple.png";
import strawberry from "../public/c-strawberry.png";
import topHand from "../public/c-tophand.png";
import AboutCopyBlock from "./AboutCopyBlock";
import PouchScroll from "./PouchScroll";

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

        {/* Blue pouch scene — lower centre */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: u(297.52), top: u(1878.54), width: u(789.24), height: u(905.94) }}
        >
          <div style={{ transform: "rotate(-0.64deg)" }}>
            <div
              className="relative overflow-hidden"
              style={{ width: u(779.28), height: u(897.12) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={redPouch.src}
                alt="Pouring a chilled ANANDA cocktail"
                className="absolute max-w-none object-cover"
                style={{ width: "97.57%", height: "96.85%", left: "2.63%", top: "-3.48%" }}
              />
            </div>
          </div>
        </div>

        {/* Red wave */}
        <div
          className="absolute"
          style={{ left: u(-9.75), top: u(2687.06), width: u(1464.584), height: u(323.123) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/c-wave.svg" alt="" className="block size-full" />
        </div>

        {/* Product pouch — overlaid on the wave */}
        <PouchScroll />

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

        {/* Picnic cooler scene — top left */}
        <Masked
          photo={topHand}
          alt="Friends sharing ANANDA cocktails at a picnic cooler"
          mask="/m-14.svg"
          maskSize={[746.535, 592.314]}
          maskPos={[89.9, 164.033]}
          sizes="75vw"
          box={{ left: -15.612, top: -108.123, width: 1074.037, height: 1232.237 }}
          inner={{ width: 1074.037, height: 1232.237, rotate: 0 }}
        />

        {/* Copy block — top right */}
        <AboutCopyBlock />
      </div>
    </section>
  );
}
