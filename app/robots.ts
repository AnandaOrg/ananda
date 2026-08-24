import type { MetadataRoute } from "next";
import { SITE_URL } from "./configs";

const isProduction = process.env.VERCEL_ENV === "production";

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/no-entry", "/pinned-demo", "/api/", "/gh-zoom"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
