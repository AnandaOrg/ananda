import AmbientVideo from "./AmbientVideo";
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

const SHIFT = 900;
const EXTRA_H = 170;
const SPILL_OVERLAP_H = 80;

export default function AboutCollage() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#fff0e5] text-[#eb4638]"
      style={{ containerType: "inline-size" }}
    >
      <div
        className="relative mx-auto"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), height: u(3010 + EXTRA_H + SPILL_OVERLAP_H - SHIFT) }}
      >
        <ScrollVideoCanvas
          frameBase="/frames/ananas/"
          frameCount={120}
          alt="Pineapple slices against a blue sky"
          style={{
            position: "absolute",
            right: 0,
            top: u(1008.67 - SHIFT),
            width: u(396.208),
            height: u(792.416),
            ...maskStyle("/m-pineapple.svg", [379.875, 759.75], [5.779, 14.263]),
          }}
        />

        <div
          className="absolute flex items-center justify-center"
          style={{ left: u(-21.5), top: u(1072.53 - SHIFT), width: u(750.69), height: u(604.722) }}
        >
          <div style={{ transform: "rotate(-90deg)" }}>
            <div
              style={{
                width: u(604.722),
                height: u(750.69),
                ...maskStyle("/m-14.svg", [746.535, 592.314], [0.979, 5.315]),
              }}
            >
              <AmbientVideo
                src="/videos/kyoto-strawberries.mp4"
                aria-label="An ANANDA pouch nestled in fresh strawberries"
                className="block size-full object-cover"
              />
            </div>
          </div>
        </div>

        <KyotoLiftoff posTop={1878.54 - SHIFT} />
      </div>
    </section>
  );
}
