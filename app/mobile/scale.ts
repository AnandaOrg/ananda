/**
 * Mobile scaling helpers. The mobile Figma frame is 390px wide; every length is
 * expressed in a design unit `--mu = 100cqw / 390` so the layout scales with the
 * (container) width. Flow sections cap the container at 430px and centre it;
 * full-bleed sections let it fill the viewport.
 */

/** One mobile design pixel, as a width-relative length. */
export const mu = (n: number) => `calc(var(--mu) * ${n})`;

/** Spread onto the scaling container to define `--mu`. */
export const MU_VAR = { ["--mu" as string]: "calc(100cqw / 390)" } as const;

/** CSS for an alpha `mask-image` (with -webkit- fallback), all lengths scaled. */
export function maskStyle(src: string, mw: number, mh: number, mx: number, my: number) {
  const image = `url(${src})`;
  const size = `${mu(mw)} ${mu(mh)}`;
  const position = `${mu(mx)} ${mu(my)}`;
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
