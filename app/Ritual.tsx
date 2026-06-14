import Image from "next/image";
import RevealStatement, { STATEMENT_PARAS } from "./RevealStatement";
import WildCarousel from "./mobile/WildCarousel";

/**
 * Section 5 — "The Ritual" / "ANANDA in the Wild" (Figma node 74:8391, a
 * 1440×4024 cream frame). Same width-scaling canvas as the other sections:
 * `--u = 100cqw / 1440`, every length `calc(var(--u) * figma-px)`.
 */

const u = (n: number) => `calc(var(--u) * ${n})`;
const RED = "#eb4638";
const CREAM = "#fff0e5";

type Step = {
  card: string;
  photo: string;
  alt: string;
  step: string;
  title: string;
  body: string;
  faded?: boolean;
  cardBox: { left: number; top: number };
  photoBox: { left: number; top: number };
  label: { left: number; top: number };
  titleBox: { left: number; top: number };
  bodyBox: { left: number; top: number };
};

const STEPS: Step[] = [
  // back → front
  {
    card: "/s5-card2.svg",
    photo: "/s5-step3.png",
    alt: "Sipping an ANANDA pouch on the dancefloor",
    step: "[Step 03]",
    title: "Sip",
    body:
      "Sip it straight from the pouch on the dancefloor, or pour it over crushed ice under the sun. Be entirely right here, right now.",
    faded: true,
    cardBox: { left: 738.19, top: 1778.84 },
    photoBox: { left: 811.15, top: 1922.47 },
    label: { left: 1181.06, top: 1861.34 },
    titleBox: { left: 808.39, top: 1838.69 },
    bodyBox: { left: 892.06, top: 2508.3 },
  },
  {
    card: "/s5-card3.svg",
    photo: "/s5-step2.png",
    alt: "Snapping open the high-flow cap",
    step: "[Step 02]",
    title: "Twist",
    body:
      "Snap open the high-flow cap. Ditch the bottle openers, the sticky counters, and the heavy glass.",
    faded: true,
    cardBox: { left: 500.94, top: 1673.63 },
    photoBox: { left: 573.9, top: 1817.26 },
    label: { left: 943.81, top: 1756.13 },
    titleBox: { left: 571.14, top: 1733.48 },
    bodyBox: { left: 654.81, top: 2403.09 },
  },
  {
    card: "/s5-card2.svg",
    photo: "/s5-step1.png",
    alt: "ANANDA pouches chilling in a cooler of ice",
    step: "[Step 01]",
    title: "Chill",
    body:
      "Submerge the pouch in ice or drop it in the freezer. Let the sub-zero edge lock the real botanical juices and premium spirits into place.",
    cardBox: { left: 271.64, top: 1539.42 },
    photoBox: { left: 344.6, top: 1683.05 },
    label: { left: 714.5, top: 1621.92 },
    titleBox: { left: 341.84, top: 1599.27 },
    bodyBox: { left: 425.51, top: 2274.88 },
  },
];

function StepCard(s: Step) {
  return (
    <div style={{ opacity: s.faded ? 0.2 : 1 }}>
      {/* Card silhouette (rotated 180° as in Figma) */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: u(s.cardBox.left), top: u(s.cardBox.top), width: u(620.422), height: u(863.666) }}
      >
        <div style={{ transform: "rotate(180deg)", width: u(620.422), height: u(863.666) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.card} alt="" className="block size-full" />
        </div>
      </div>

      {/* Photo */}
      <div
        className="absolute overflow-hidden"
        style={{ left: u(s.photoBox.left), top: u(s.photoBox.top), width: u(464.322), height: u(576.4) }}
      >
        <Image src={s.photo} alt={s.alt} fill sizes="40vw" className="object-cover" />
      </div>

      {/* Step label */}
      <div className="absolute" style={{ left: u(s.label.left), top: u(s.label.top), padding: `${u(10)} ${u(14)}` }}>
        <p
          className="whitespace-nowrap uppercase"
          style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98), color: CREAM }}
        >
          {s.step}
        </p>
      </div>

      {/* Title */}
      <p
        className="absolute font-bold uppercase"
        style={{
          left: u(s.titleBox.left),
          top: u(s.titleBox.top),
          width: u(428.674),
          fontFamily: "var(--font-display)",
          fontSize: u(96),
          lineHeight: 0.8,
          letterSpacing: u(-7.68),
          color: CREAM,
        }}
      >
        {s.title}
      </p>

      {/* Body copy */}
      <div className="absolute" style={{ left: u(s.bodyBox.left), top: u(s.bodyBox.top), width: u(401) }}>
        <p
          className="text-right"
          style={{ padding: `${u(10)} ${u(14)}`, fontFamily: "var(--font-body)", fontSize: u(16), lineHeight: 1.6, letterSpacing: u(0.16), color: CREAM }}
        >
          {s.body}
        </p>
      </div>
    </div>
  );
}

const TAGS = ["Tropical", "Rich", "Sun-Drenched"];

const WILD = [
  { src: "/s5-wild1.png", w: 525.269, h: 652.058, alt: "Friends enjoying ANANDA outdoors" },
  { src: "/s5-wild2.png", w: 525.269, h: 652.058, alt: "A couple toasting with ANANDA pouches" },
  { src: "/s5-wild3.png", w: 522.503, h: 648.624, alt: "Holding a fan of colourful ANANDA pouches" },
  { src: "/s5-wild4.png", w: 521.32, h: 647.155, alt: "ANANDA on the go" },
  { src: "/s5-wild5.png", w: 582.282, h: 652.058, alt: "Sharing ANANDA cocktails" },
];

export default function Ritual() {
  return (
    <section className="relative w-full overflow-hidden" style={{ containerType: "inline-size", backgroundColor: CREAM }}>
      <div
        className="relative mx-auto"
        style={{ ["--u" as string]: "calc(100cqw / 1440)", width: u(1440), height: u(4024) }}
      >
        {/* Intro statement — letter-fill reveal on scroll */}
        <RevealStatement
          paras={STATEMENT_PARAS}
          smallFontSize={u(27.296)}
          className="absolute font-bold"
          style={{
            left: u(78.23),
            top: u(271.98),
            width: u(1311.92),
            fontFamily: "var(--font-display)",
            fontSize: u(59.247),
            lineHeight: 1.15,
            letterSpacing: u(-2.3699),
            color: RED,
          }}
        />

        {/* Decorative mandala */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/s5-mandala.svg"
          alt=""
          className="absolute"
          style={{ left: u(615.03), top: u(865.31), width: u(209.93), height: u(219.7) }}
        />

        {/* [03] HOW IT WORKS */}
        <div className="absolute" style={{ left: u(67), top: u(1261.84), padding: `${u(10)} ${u(14)}` }}>
          <p
            className="whitespace-nowrap uppercase"
            style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98), color: RED }}
          >
            [03] How it works
          </p>
        </div>

        {/* THE RITUAL */}
        <p
          className="absolute font-bold uppercase"
          style={{
            left: u(78.23),
            top: u(1339.03),
            width: u(886.654),
            fontFamily: "var(--font-display)",
            fontSize: u(180),
            lineHeight: 0.8,
            letterSpacing: u(-14.4),
            color: RED,
          }}
        >
          The Ritual
        </p>

        {/* Step cards (back → front) */}
        {STEPS.map((s) => (
          <StepCard key={s.title} {...s} />
        ))}

        {/* [04] HOW IT WORKS */}
        <div className="absolute" style={{ left: u(67), top: u(2865.35), padding: `${u(10)} ${u(14)}` }}>
          <p
            className="whitespace-nowrap uppercase"
            style={{ fontFamily: "var(--font-mono-label)", fontSize: u(14), lineHeight: 0.87, letterSpacing: u(0.98), color: RED }}
          >
            [04] How it works
          </p>
        </div>

        {/* ANANDA IN THE WILD */}
        <div
          className="absolute font-bold uppercase"
          style={{
            left: u(78.23),
            top: u(2942.53),
            width: u(886.654),
            fontFamily: "var(--font-display)",
            fontSize: u(180),
            lineHeight: 0.8,
            letterSpacing: u(-14.4),
            color: RED,
          }}
        >
          <p className="mb-0">ANANDA IN</p>
          <p>THE WILD</p>
        </div>

        {/* Flavour tags */}
        <div className="absolute flex items-center" style={{ left: u(81), top: u(3242.01), gap: u(14) }}>
          {TAGS.map((t) => (
            <span
              key={t}
              className="whitespace-nowrap"
              style={{
                border: `${u(0.75)} solid ${RED}`,
                borderRadius: u(2),
                padding: `${u(10)} ${u(14)}`,
                fontFamily: "var(--font-mono-label)",
                fontSize: u(10),
                lineHeight: 0.87,
                letterSpacing: u(0.7),
                color: RED,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* "In the wild" photo carousel — drag / scroll through the gallery */}
        <div className="absolute" style={{ left: 0, top: u(3374.84), width: u(1440) }}>
          <WildCarousel
            items={WILD}
            slideW={u(525.269)}
            slideH={u(652.058)}
            gap="0px"
            snapAlign="start"
            snapType="none"
            startIndex={0}
            autoplay={80}
          />
        </div>
      </div>
    </section>
  );
}
