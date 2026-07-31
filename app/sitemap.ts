import type { MetadataRoute } from "next";
import { SITE_URL } from "./configs";

// Single-page site — one entry is the whole sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
