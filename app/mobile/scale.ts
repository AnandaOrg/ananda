
export const mu = (n: number) => `calc(var(--mu) * ${n})`;

export const MU_VAR = { ["--mu" as string]: "calc(100cqw / 390)" } as const;

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
