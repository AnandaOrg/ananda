import type { MetadataRoute } from "next";
import { SITE_URL } from "./configs";

// Only the production deployment should be crawlable — Vercel preview URLs
// would otherwise compete with the real domain as duplicate content.
const isProduction = process.env.VERCEL_ENV === "production";

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /no-entry is a dead-end refusal page (age gate "I'm out"), /pinned-demo
      // is a dev scratch route — neither is real content worth indexing.
      disallow: ["/no-entry", "/pinned-demo", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
