import AboutCopyBlock from "./AboutCopyBlock";
import ScrollVideoCanvas from "./ScrollVideoCanvas";
import CardPeel from "./CardPeel";

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
        {/* Pineapple — GSAP scroll-scrubbed */}
        <ScrollVideoCanvas
          frameBase="/frames/ananas/"
          frameCount={120}
          alt="Pineapple slices against a blue sky"
          style={{
            position: "absolute",
            left: u(930.8),
            top: u(1008.67),
            width: u(396.208),
            height: u(792.416),
            ...maskStyle("/m-pineapple.svg", [379.875, 759.75], [5.779, 14.263]),
          }}
        />

        {/* Pouch scene — scroll-scrubbed video */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: u(297.52), top: u(1878.54), width: u(789.24), height: u(905.94) }}
        >
          <div style={{ transform: "rotate(-0.64deg)" }}>
            <ScrollVideoCanvas
              frameBase="/frames/kyoto/"
              frameCount={78}
              alt="Pouring a chilled ANANDA cocktail"
              style={{ width: u(779.28), height: u(897.12), overflow: "hidden" }}
            />
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

        {/* Strawberries — scroll-scrubbed video */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: u(-21.5), top: u(1072.53), width: u(750.69), height: u(604.722) }}
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

        {/* Card peel collage — top left */}
        <CardPeel
          style={{
            position: "absolute",
            left: u(-15.612),
            top: u(-108.123),
            width: u(1074.037),
            height: u(1232.237),
          }}
        />

        {/* Copy block — top right */}
        <AboutCopyBlock />
      </div>
    </section>
  );
}
