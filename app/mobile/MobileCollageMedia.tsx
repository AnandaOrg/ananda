import AmbientVideo from "../AmbientVideo";
import ScrollVideoCanvas from "../ScrollVideoCanvas";
import { mu, MU_VAR, maskStyle } from "./scale";

const PINE = { top: 40, w: 160, h: 320 };
const STRAW = { left: 9, top: 93, w: 231, h: 186 };
const PAD_BOTTOM = 40;
const SECTION_H = PINE.top + PINE.h + PAD_BOTTOM;

export default function MobileCollageMedia() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#fff0e5] md:hidden"
      style={{ containerType: "inline-size" }}
    >
      <div className="relative" style={{ ...MU_VAR, height: mu(SECTION_H) }}>
        <ScrollVideoCanvas
          frameBase="/frames/ananas/"
          frameCount={120}
          alt="Pineapple slices against a blue sky"
          style={{
            position: "absolute",
            right: 0,
            top: mu(PINE.top),
            width: mu(PINE.w),
            height: mu(PINE.h),
            ...maskStyle("/m-pineapple.svg", 153.41, 306.81, 2.33, 5.76),
          }}
        />

        <div
          className="absolute flex items-center justify-center"
          style={{ left: mu(STRAW.left), top: mu(STRAW.top), width: mu(STRAW.w), height: mu(STRAW.h) }}
        >
          <div style={{ transform: "rotate(-90deg)" }}>
            <div
              style={{
                width: mu(STRAW.h),
                height: mu(STRAW.w),
                ...maskStyle("/m-14.svg", 229.72, 182.27, 0.3, 1.64),
              }}
            >
              <AmbientVideo
                src="/videos/kyoto-strawberries-mobile.mp4"
                preload="auto"
                aria-label="An ANANDA pouch nestled in fresh strawberries"
                className="block size-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
