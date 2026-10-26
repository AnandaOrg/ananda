import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Content-Security-Policy, rolled out as Report-Only first: watch the browser console
 *  on the age gate, homepage scroll, flavour modal, newsletter form and backoffice for
 *  violations, then rename the header to `Content-Security-Policy` to enforce it.
 *  `'unsafe-inline'` scripts: next/script inline snippets (gtag init, consent defaults,
 *  scroll restoration) and the JSON-LD block are inline without nonces. */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.public.blob.vercel-storage.com",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.google-analytics.com https://www.googletagmanager.com",
  "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy-Report-Only", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000", "192.168.1.16"],
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
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
