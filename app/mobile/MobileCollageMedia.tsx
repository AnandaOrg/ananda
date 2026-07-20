import ScrollVideoCanvas from "../ScrollVideoCanvas";
import { mu, MU_VAR, maskStyle } from "./scale";

/**
 * Mobile twin of the AboutCollage media (desktop): the pineapple and
 * strawberries scroll-scrubbed frame sequences with their organic masks.
 * Layout per the mobile Figma: the pineapple column hugs and bleeds off the
 * right edge; the strawberries photo (rotated −90° like desktop so the KYOTO
 * pouch stands upright) sits lower-left. All lengths are desktop values
 * × 0.404 (pineapple) / × 0.308 (strawberries), in `--mu` units. (md:hidden)
 */

const PINE = { left: 266, top: 40, w: 160, h: 320 }; // bleeds ~36 past the 390 frame
const STRAW = { left: 9, top: 93, w: 231, h: 186 }; // visual (post-rotation) box
const PAD_BOTTOM = 40;
const SECTION_H = PINE.top + PINE.h + PAD_BOTTOM;

export default function MobileCollageMedia() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#fff0e5] md:hidden"
      style={{ containerType: "inline-size" }}
    >
      <div className="relative" style={{ ...MU_VAR, height: mu(SECTION_H) }}>
        {/* Pineapple — GSAP scroll-scrubbed */}
        <ScrollVideoCanvas
          frameBase="/frames/ananas/"
          frameCount={120}
          alt="Pineapple slices against a blue sky"
          style={{
            position: "absolute",
            left: mu(PINE.left),
            top: mu(PINE.top),
            width: mu(PINE.w),
            height: mu(PINE.h),
            ...maskStyle("/m-pineapple.svg", 153.41, 306.81, 2.33, 5.76),
          }}
        />

        {/* Strawberries — scroll-scrubbed video */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: mu(STRAW.left), top: mu(STRAW.top), width: mu(STRAW.w), height: mu(STRAW.h) }}
        >
          <div style={{ transform: "rotate(-90deg)" }}>
            <ScrollVideoCanvas
              frameBase="/frames/kyoto-strawberries/"
              frameCount={120}
              alt="An ANANDA pouch nestled in fresh strawberries"
              autoLoop
              style={{
                width: mu(STRAW.h),
                height: mu(STRAW.w),
                ...maskStyle("/m-14.svg", 229.72, 182.27, 0.3, 1.64),
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
