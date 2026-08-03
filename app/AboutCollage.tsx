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

/**
 * Section 3 (collage) — the "What we're about" extras: a pineapple frame-video
 * (scroll-scrubbed), a strawberries looping video (autoplays on load), the
 * kyoto pour video that hands off to the 3-D KYOTO pouch (see KyotoLiftoff),
 * and the red wave. The gallery + copy now live
 * in DitchTheGlass (the pinned intro), so this canvas only holds the collage
 * media. Width-scaling canvas: `--u = 100cqw / 1440`. Desktop only (md+);
 * mobile uses MobileCollage.
 *
 * NOTE: positions are the original Figma coords shifted up by 900u, since the
 * gallery/copy that used to occupy the top of this canvas now live upstream.
 */
const SHIFT = 900;
// Extra room below the original 3010 Figma height so KyotoLiftoff's spill can
// grow into a full-height mound (per design) before this section ends and
// Pathways begins — matches the WAVE_FLOOR_Y bump in KyotoLiftoff.tsx.
const EXTRA_H = 170;
// Extra room so the spill's lap past the Pathways seam isn't clipped by this
// section's own overflow-hidden before it gets there. Deliberately LESS than
// KyotoLiftoff.tsx's SPILL_OVERLAP (100) — the difference is the real safety
// margin at the seam; matching the two exactly leaves ~0px of tolerance for
// sub-pixel rounding between this canvas's and Pathways' independently
// computed `--u`, which is what exposed a hairline of cream there.
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
        {/* Pineapple — GSAP scroll-scrubbed */}
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

        {/* Strawberries — ambient looping video, autoplays on load (NOT
            scroll-driven, unlike the pineapple) */}
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

        {/* Pouch scene — looping pour video; the pouch lifts off it and tips
            over as you scroll past. Also owns the red wave, which splashes out
            of the spout in sync with the pouch. */}
        <KyotoLiftoff posTop={1878.54 - SHIFT} />
      </div>
    </section>
  );
}
