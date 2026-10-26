import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { DB_CACHE_REVALIDATE_SECONDS, MEDIA_CACHE_TAG } from "@/lib/cache-tags";
import { blobProbeUrl, isBlobStoreBlocked } from "./blob-health";
import { UPLOAD_PATH_PREFIX } from "./addable";

export type MediaAsset = { url: string; active: boolean; link: string | null; kind: "image" | "mask" | "video" };

export type MediaRow = { path: string; category: string; kind: MediaAsset["kind"]; blobUrl: string; active: boolean; link: string | null; alt: string };

type Row = MediaRow;

/** The `media_assets` table, cached across requests (Next data cache, tagged so the
 *  backoffice routes can expire it after a write). Only the columns the site reads —
 *  the cache round-trips through JSON, so timestamps would come back as strings. An
 *  empty table throws so nothing is cached and the next request re-reads it: the seed
 *  scripts run outside Next and cannot expire the tag themselves.
 *
 *  `unstable_cache` rather than `"use cache"`: the directive needs `cacheComponents`
 *  in next.config, which changes rendering for the whole app (every request-time read
 *  must sit under a Suspense boundary). The older API still ships in Next 16 and is
 *  the documented path for apps not on Cache Components — swap when the app migrates. */
const readMediaRows = unstable_cache(
  async (): Promise<Row[]> => {
    const db = getDb();
    const rows = await db
      .select({
        path: mediaAssets.path,
        category: mediaAssets.category,
        kind: mediaAssets.kind,
        blobUrl: mediaAssets.blobUrl,
        active: mediaAssets.active,
        link: mediaAssets.link,
        alt: mediaAssets.alt,
      })
      .from(mediaAssets)
      .orderBy(mediaAssets.id);
    if (rows.length === 0) throw new Error("media_assets is empty — not caching");
    return rows;
  },
  ["media-assets"],
  { tags: [MEDIA_CACHE_TAG], revalidate: DB_CACHE_REVALIDATE_SECONDS },
);

/** Seeded rows are keyed by a path that still exists in `public/`; only the
 *  backoffice-added extras (`/media/<category>/<uuid>`) have no local copy. */
const hasLocalCopy = (row: Row) => !row.path.startsWith(UPLOAD_PATH_PREFIX);

/** The rows to hand out this request — the single per-request read, shared by the
 *  layout and every server component (`cache()`). Empty when the DB is unreachable or
 *  unseeded. When the Blob store is blocked (see blob-health.ts) every row keeps its
 *  active/link/alt settings but points at its original in `public/`; the extras with
 *  no local copy drop out. The store probe runs alongside the DB read when the store
 *  is known from the environment, so a cold instance pays for the slower of the two,
 *  not both. */
const loadMediaRows = cache(async (): Promise<Row[]> => {
  const fixedProbe = blobProbeUrl();
  let rows: Row[];
  let blocked: boolean;
  try {
    [rows, blocked] = await Promise.all([readMediaRows(), fixedProbe ? isBlobStoreBlocked(fixedProbe) : false]);
    if (!fixedProbe) {
      const probeUrl = rows.find((row) => row.path.endsWith(".svg"))?.blobUrl ?? rows[0].blobUrl;
      blocked = await isBlobStoreBlocked(probeUrl);
    }
  } catch {
    return [];
  }
  if (!blocked) return rows;
  return rows.filter(hasLocalCopy).map((row) => ({ ...row, blobUrl: row.path }));
});

/** All managed images, keyed by their stable `public/` path (e.g. "/fl-lemon.png").
 *  A path missing from the result (DB unreachable, unseeded, or genuinely not yet
 *  managed) is treated by the caller as active with the literal path as its URL —
 *  the original public/ file is left in place as a resilience fallback. */
export async function getMediaAssets(): Promise<Record<string, MediaAsset>> {
  const map: Record<string, MediaAsset> = {};
  for (const row of await loadMediaRows()) {
    map[row.path] = { url: row.blobUrl, active: row.active, link: row.link, kind: row.kind };
  }
  return map;
}

export type ResolvedAsset = { url: string; active: boolean; link: string | null };

/** Shared resolution logic — a path with no row falls back to active=true, using the
 *  literal path as the URL. Used directly by server components (given the map from
 *  `getMediaAssets`) and by the client `useMediaAsset` hook (given the context value). */
export function resolveMediaAsset(assets: Record<string, MediaAsset>, path: string): ResolvedAsset {
  const asset = assets[path];
  return { url: asset?.url ?? path, active: asset?.active ?? true, link: asset?.link ?? null };
}

/** All managed images grouped by category — the source for "extra" backoffice-added
 *  images in the addable categories (see lib/media/addable.ts) and the footer's social
 *  icons. Same rows as `getMediaAssets`, just shaped differently. */
export async function getMediaAssetsByCategory(): Promise<Record<string, MediaRow[]>> {
  const grouped: Record<string, MediaRow[]> = {};
  for (const row of await loadMediaRows()) {
    (grouped[row.category] ??= []).push(row);
  }
  return grouped;
}

export type ExtraMediaItem = { src: string; alt: string; link: string | null };

/** The *images* in `category` that AREN'T one of the component's own hardcoded/known
 *  paths — i.e. photos added via the backoffice, in creation order. Masks and videos
 *  share a category with photos (the hero .webm rows sit in "hero") but are never
 *  photos, so they are excluded by kind — otherwise they would be rendered through
 *  next/image, which rejects them with HTTP 400. Used by Ritual/MobileSocial (server)
 *  directly, and by the client `useExtraMedia` hook. */
export function extraMediaFor(byCategory: Record<string, MediaRow[]>, category: string, knownPaths: readonly string[]): ExtraMediaItem[] {
  const known = new Set(knownPaths);
  return (byCategory[category] ?? [])
    .filter((row) => row.kind === "image" && row.active && !known.has(row.path))
    .map((row) => ({ src: row.blobUrl, alt: row.alt, link: row.link }));
}
