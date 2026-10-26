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
      // Only the API. Pages that must stay out of search (the age-gate exit page, the
      // backoffice) carry noindex themselves — a Disallow here would hide that tag from
      // crawlers and advertise the paths to anyone reading robots.txt.
      disallow: ["/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
