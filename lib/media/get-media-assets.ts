import { cache } from "react";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";

export type MediaAsset = { url: string; active: boolean; link: string | null; kind: "image" | "mask" | "video" };

/** All managed images, keyed by their stable `public/` path (e.g. "/fl-lemon.png").
 *  A path missing from the result (DB unreachable, unseeded, or genuinely not yet
 *  managed) is treated by the caller as active with the literal path as its URL —
 *  the original public/ file is left in place as a resilience fallback.
 *
 *  `cache()`-wrapped: layout.tsx (for MediaProvider) and every server component that
 *  also resolves an asset directly (Footer, no-entry, Manifesto, ...) share one query
 *  per request instead of one each. */
export const getMediaAssets = cache(async (): Promise<Record<string, MediaAsset>> => {
  try {
    const db = getDb();
    const rows = await db.select().from(mediaAssets);
    const map: Record<string, MediaAsset> = {};
    for (const row of rows) {
      map[row.path] = { url: row.blobUrl, active: row.active, link: row.link, kind: row.kind as "image" | "mask" | "video" };
    }
    return map;
  } catch {
    return {};
  }
});

export type ResolvedAsset = { url: string; active: boolean; link: string | null };

/** Shared resolution logic — a path with no row falls back to active=true, using the
 *  literal path as the URL. Used directly by server components (given the map from
 *  `getMediaAssets`) and by the client `useMediaAsset` hook (given the context value). */
export function resolveMediaAsset(assets: Record<string, MediaAsset>, path: string): ResolvedAsset {
  const asset = assets[path];
  return { url: asset?.url ?? path, active: asset?.active ?? true, link: asset?.link ?? null };
}

export type MediaRow = { path: string; category: string; blobUrl: string; active: boolean; link: string | null; alt: string };

/** All managed images grouped by category — the source for "extra" backoffice-added
 *  images in the addable categories (see lib/media/addable.ts). A separate query from
 *  `getMediaAssets` (small, cheap table; not worth sharing a cache entry for). */
export const getMediaAssetsByCategory = cache(async (): Promise<Record<string, MediaRow[]>> => {
  try {
    const db = getDb();
    const rows = await db.select().from(mediaAssets).orderBy(mediaAssets.id);
    const grouped: Record<string, MediaRow[]> = {};
    for (const row of rows) {
      (grouped[row.category] ??= []).push({
        path: row.path,
        category: row.category,
        blobUrl: row.blobUrl,
        active: row.active,
        link: row.link,
        alt: row.alt,
      });
    }
    return grouped;
  } catch {
    return {};
  }
});

export type ExtraMediaItem = { src: string; alt: string; link: string | null };

/** The images in `category` that AREN'T one of the component's own hardcoded/known
 *  paths — i.e. images added via the backoffice, in creation order. Used by
 *  Ritual/MobileSocial (server) directly, and by the client `useExtraMedia` hook. */
export function extraMediaFor(byCategory: Record<string, MediaRow[]>, category: string, knownPaths: readonly string[]): ExtraMediaItem[] {
  const known = new Set(knownPaths);
  return (byCategory[category] ?? [])
    .filter((row) => row.active && !known.has(row.path))
    .map((row) => ({ src: row.blobUrl, alt: row.alt, link: row.link }));
}
