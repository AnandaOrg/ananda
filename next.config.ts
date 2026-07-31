import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000", '192.168.1.16'],

  async headers() {
    return [
      {
        // /public media (images, video, GLB models): cached for a year as
        // immutable, matching Lighthouse's "efficient cache lifetimes"
        // expectations and actually helping first-time visitors — the SW
        // (app/sw.js/route.ts) only benefits repeat visits within the same
        // 24h window, since it hasn't installed yet on a page's own first
        // load, which is what Lighthouse (and the visitor) sees first.
        //
        // SAFE ONLY under this rule: never overwrite a /public asset's
        // bytes at its existing filename. Renaming the file (or bumping a
        // `?v=` query on every reference) on any content change is what
        // makes the immutable cache correct instead of a footgun — without
        // it, visitors can serve a stale copy for up to a year.
        source: "/:path*.:ext(png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|glb|gltf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
export default withNextIntl(nextConfig);
