import ScrollVideoCanvas from "./ScrollVideoCanvas";
import KyotoLiftoff from "./KyotoLiftoff";

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

/**
 * Section 3 (collage) — the "What we're about" extras: a pineapple frame-video,
 * a strawberries frame-video, the kyoto pour video that hands off to the 3-D
 * KYOTO pouch (see KyotoLiftoff), and the red wave. The gallery + copy now live
 * in DitchTheGlass (the pinned intro), so this canvas only holds the collage
 * media. Width-scaling canvas: `--u = 100cqw / 1440`. Desktop only (md+);
 * mobile uses MobileCollage.
 *
 * NOTE: positions are the original Figma coords shifted up by 900u, since the
 * gallery/copy that used to occupy the top of this canvas now live upstream.
 */
const SHIFT = 900;

export default function AboutCollage() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#fff0e5] text-[#eb4638]"
      style={{ containerType: "inline-size" }}
    >
      <div
        className="relative mx-auto"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), height: u(3010 - SHIFT) }}
      >
        {/* Pineapple — GSAP scroll-scrubbed */}
        <ScrollVideoCanvas
          frameBase="/frames/ananas/"
          frameCount={120}
          alt="Pineapple slices against a blue sky"
          style={{
            position: "absolute",
            left: u(930.8),
            top: u(1008.67 - SHIFT),
            width: u(396.208),
            height: u(792.416),
            ...maskStyle("/m-pineapple.svg", [379.875, 759.75], [5.779, 14.263]),
          }}
        />

        {/* Strawberries — scroll-scrubbed video */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: u(-21.5), top: u(1072.53 - SHIFT), width: u(750.69), height: u(604.722) }}
        >
          <div style={{ transform: "rotate(-90deg)" }}>
            <ScrollVideoCanvas
              frameBase="/frames/kyoto-strawberries/"
              frameCount={120}
              alt="An ANANDA pouch nestled in fresh strawberries"
              style={{
                width: u(604.722),
                height: u(750.69),
                ...maskStyle("/m-14.svg", [746.535, 592.314], [0.979, 5.315]),
              }}
            />
          </div>
        </div>

        {/* Pouch scene — looping pour video; the 3-D pouch lifts off it and
            rotates upright as you scroll past. */}
        <KyotoLiftoff posTop={1878.54 - SHIFT} />

        {/* Red wave */}
        <div
          className="absolute"
          style={{ left: u(-9.75), top: u(2687.06 - SHIFT), width: u(1464.584), height: u(323.123) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/c-wave.svg" alt="" className="block size-full" />
        </div>
      </div>
    </section>
  );
}
