import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Share image for links to the site: the hero's first frame under a dark wash with
 *  the white logo centred — generated once at build (no request-time data). Also
 *  re-exported as twitter-image.tsx. Satori (the renderer) needs explicit flex
 *  containers and explicit top/left/width/height — no `inset` shorthand. */
export const alt = "ANANDA Cocktails — premium pouch cocktails";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COVER = { position: "absolute" as const, top: 0, left: 0, width: "100%", height: "100%" };

export default async function Image() {
  const [poster, logo] = await Promise.all([
    readFile(join(process.cwd(), "public/hero-poster.jpg")),
    readFile(join(process.cwd(), "public/ananda-logo.svg")),
  ]);
  const posterSrc = `data:image/jpeg;base64,${poster.toString("base64")}`;
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: "#0a0a0a" }}>
        <img src={posterSrc} alt="" width={1200} height={630} style={{ ...COVER, objectFit: "cover" }} />
        <div style={{ ...COVER, display: "flex", background: "rgba(10, 10, 10, 0.45)" }} />
        <div style={{ ...COVER, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={logoSrc} alt="" width={460} height={370} />
        </div>
      </div>
    ),
    size,
  );
}
