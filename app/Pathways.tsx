import Image from "next/image";

/**
 * Section 4 — "The Pathways to Bliss" flavor poster (Figma node 76:9304, a
 * 1440×2000 frame on a red field). Same width-scaling approach as the collage:
 * one design unit `--u = 100cqw / 1440`, every length `calc(var(--u) * figma-px)`,
 * rotations/percentage crops carried over verbatim.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;

type Box = { left: number; top: number; width: number; height: number };
type Center = { x: number; y: number; width: number; height: number };
type Crop = { width: string; height: string; left: string; top: string };

type FloatingProps = {
  src: string;
  alt: string;
  rotate: number;
  inner: { width: number; height: number };
  box?: Box;
  center?: Center;
  crop?: Crop;
  shadow?: boolean;
  sizes?: string;
};

/** A rotated, optionally cropped image placed by box or by centre offset. */
function Floating({ src, alt, rotate, inner, box, center, crop, shadow, sizes }: FloatingProps) {
  const place: React.CSSProperties = center
    ? {
        left: `calc(50% + ${u(center.x)})`,
        top: `calc(50% + ${u(center.y)})`,
        width: u(center.width),
        height: u(center.height),
        transform: "translate(-50%, -50%)",
      }
    : {
        left: u(box!.left),
        top: u(box!.top),
        width: u(box!.width),
        height: u(box!.height),
      };

  return (
    <div className="absolute flex items-center justify-center" style={place}>
      <div style={{ transform: `rotate(${rotate}deg)` }}>
        <div
          className="relative overflow-hidden"
          style={{
            width: u(inner.width),
            height: u(inner.height),
            boxShadow: shadow ? `${u(11)} ${u(8)} ${u(28.7)} 0 rgba(0,0,0,0.25)` : undefined,
          }}
        >
          {crop ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              className="absolute max-w-none"
              style={{ width: crop.width, height: crop.height, left: crop.left, top: crop.top }}
            />
          ) : (
            <Image src={src} alt={alt} fill sizes={sizes ?? "40vw"} className="object-cover" />
          )}
        </div>
      </div>
    </div>
  );
}

const BANDS = [
  { color: "#1f5fcd", top: 706.75 },
  { color: "#f8a20f", top: 1028.46 },
  { color: "#14a06b", top: 1350.17 },
  { color: "#eb4638", top: 1671.89 },
];

const FLAVORS = [
  { label: "Santorini", left: -11.32, top: 762.6, width: 1458.699, color: "#fff0e5" },
  { label: "Aloha", left: -11.32, top: 1084.32, width: 947.533, color: "#eb4638" },
  { label: "Gaia", left: -23.03, top: 1410.63, width: 947.533, color: "#fff0e5" },
  { label: "Kyoto", left: -11.32, top: 1736.95, width: 947.533, color: "#ff95ac" },
];

export default function Pathways() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#eb4638]"
      style={{ containerType: "inline-size" }}
    >
      <div
        className="relative mx-auto"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), height: u(2000) }}
      >
        {/* Eyebrow label */}
        <div className="absolute" style={{ left: u(81.75), top: u(212.79), padding: `${u(10)} ${u(14)}` }}>
          <p
            className="whitespace-nowrap uppercase text-[#fff0e5]"
            style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98) }}
          >
            [02] Choose your ANANDA
          </p>
        </div>

        {/* Headline */}
        <p
          className="absolute font-bold uppercase text-[#fff0e5]"
          style={{
            left: u(95.75),
            top: u(297.49),
            width: u(1102.287),
            fontFamily: "var(--font-display)",
            fontSize: u(180),
            lineHeight: 0.8,
            letterSpacing: u(-14.4),
          }}
        >
          The Pathways to Bliss
        </p>

        {/* Colour bands */}
        {BANDS.map((b) => (
          <div
            key={b.color + b.top}
            className="absolute"
            style={{ left: u(-1.97), top: u(b.top), width: u(1477), height: u(321.713), backgroundColor: b.color }}
          />
        ))}

        {/* Giant flavour names (over the bands) */}
        {FLAVORS.map((f) => (
          <p
            key={f.label}
            className="absolute whitespace-nowrap font-bold uppercase"
            style={{
              left: u(f.left),
              top: f.top != null ? u(f.top) : undefined,
              width: u(f.width),
              color: f.color,
              fontFamily: "var(--font-display)",
              fontSize: u(350.179),
              lineHeight: 0.8,
              letterSpacing: u(-28.0143),
            }}
          >
            {f.label}
          </p>
        ))}

        {/* Lemon — top right */}
        <Floating
          src="/s4-lemon.png"
          alt="Fresh lemon with leaves"
          rotate={-8.95}
          box={{ left: 1091.12, top: 511.44, width: 383.906, height: 442.232 }}
          inner={{ width: 326.198, height: 396.289 }}
          crop={{ width: "134.65%", height: "166.26%", left: "-22.14%", top: "-38.75%" }}
        />

        {/* Mango — left, over Aloha */}
        <Floating
          src="/s4-mango.png"
          alt="Ripe mango"
          rotate={-7.55}
          box={{ left: 34.77, top: 841.33, width: 336.961, height: 383 }}
          inner={{ width: 293.887, height: 347.418 }}
          crop={{ width: "143.08%", height: "181.55%", left: "-22.78%", top: "-36.97%" }}
        />

        {/* Blue Santorini pouch */}
        <Floating
          src="/s4-pouch-blue.png"
          alt="ANANDA Santorini cocktail pouch"
          rotate={-90}
          center={{ x: -43.07, y: -141.33, width: 665.874, height: 415.607 }}
          inner={{ width: 415.607, height: 665.874 }}
          crop={{ width: "177.86%", height: "111.18%", left: "-40.81%", top: "-7.3%" }}
          shadow
          sizes="50vw"
        />

        {/* Elderflower — right, over Gaia */}
        <Floating
          src="/s4-flowers.png"
          alt="White elderflower blossom"
          rotate={15.25}
          box={{ left: 830.64, top: 1171.01, width: 396.087, height: 426.724 }}
          inner={{ width: 313.253, height: 356.907 }}
        />

        {/* Raspberry — lower left, over Kyoto */}
        <Floating
          src="/s4-raspberry.png"
          alt="Fresh raspberry"
          rotate={46.6}
          box={{ left: 232.63, top: 1751.43, width: 290.952, height: 290.693 }}
          inner={{ width: 202.429, height: 209.017 }}
        />

        {/* Red Kyoto pouch */}
        <Floating
          src="/s4-pouch-red.png"
          alt="ANANDA Kyoto cocktail pouch"
          rotate={-90}
          center={{ x: -46.72, y: 746.38, width: 673.154, height: 297.321 }}
          inner={{ width: 297.321, height: 673.154 }}
          crop={{ width: "263.38%", height: "116.33%", left: "-81.87%", top: "-9.26%" }}
          shadow
          sizes="50vw"
        />

        {/* SEE FLAVORS pill */}
        <div
          className="absolute flex items-center justify-center overflow-hidden bg-[#fff0e5]"
          style={{ left: u(1125), top: u(48.25), padding: `${u(14)} ${u(24)}`, borderRadius: u(50.032) }}
        >
          <div className="flex items-center" style={{ gap: u(15.01) }}>
            <span
              className="font-semibold uppercase text-[#eb4638]"
              style={{ fontFamily: "var(--font-display)", fontSize: u(40), lineHeight: 0.8, letterSpacing: u(-2.8) }}
            >
              see flavors
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/s4-arrow.svg" alt="" style={{ width: u(15.644), height: u(30.807) }} />
          </div>
        </div>
      </div>
    </section>
  );
}
