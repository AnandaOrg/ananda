import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000", '192.168.1.16'],

  async headers() {
    return [
      {
        // /public media (images, video, GLB models). Conservative on purpose:
        // the custom Service Worker (app/sw.js/route.ts) already runtime-caches
        // these for 24h with deploy-based invalidation via BUILD_ID. A long
        // immutable max-age here would be honored by the SW's own fetch()
        // calls too, letting the HTTP cache outlive — and defeat — that 24h
        // invalidation if a file is ever replaced in place at the same path.
        source: "/:path*.:ext(png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|glb|gltf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
export default withNextIntl(nextConfig);
