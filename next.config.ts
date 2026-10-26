import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Content-Security-Policy, rolled out as Report-Only first: watch the browser console
 *  on the age gate, homepage scroll, flavour modal, newsletter form and backoffice for
 *  violations, then rename the header to `Content-Security-Policy` to enforce it.
 *  `'unsafe-inline'` scripts: next/script inline snippets (gtag init, consent defaults,
 *  scroll restoration) and the JSON-LD block are inline without nonces.
 *
 *  Environment-specific additions keep the report useful: the React/Next dev runtime
 *  needs `'unsafe-eval'`, and preview deployments load the Vercel toolbar from
 *  vercel.live — neither is a production violation, so neither should flood the console. */
const IS_PROD = process.env.NODE_ENV === "production";
const IS_PREVIEW = process.env.VERCEL_ENV === "preview";
const DEV_SCRIPT = IS_PROD ? "" : " 'unsafe-eval'";
const PREVIEW = IS_PREVIEW ? " https://vercel.live" : "";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${DEV_SCRIPT} https://www.googletagmanager.com https://va.vercel-scripts.com${PREVIEW}`,
  `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.public.blob.vercel-storage.com${PREVIEW}`,
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.google-analytics.com https://www.googletagmanager.com",
  "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "worker-src 'self'",
  `frame-src 'self'${PREVIEW}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** HSTS is deliberately left to Vercel (it already sends `max-age=63072000` for the
 *  custom domain). Adding `includeSubDomains` here would pin every subdomain of the
 *  apex to HTTPS in visitors' browsers for two years — only safe once every subdomain
 *  (mail, verification records, anything legacy) is confirmed HTTPS-only. */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy-Report-Only", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
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
