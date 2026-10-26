/** Is the Vercel Blob store blocked right now?
 *
 *  On the Hobby plan, exceeding the included Blob data transfer blocks the whole
 *  store for 30 days — every blob URL then answers `403 "Your store is blocked"`
 *  (even paths that do not exist), and nothing in the DB tells us. `getMediaAssets`
 *  asks here before handing out blob URLs; while the store is down it serves each
 *  asset's original from `public/` (Vercel CDN) instead.
 *
 *  One HEAD request per instance per minute, stale-while-revalidate: once a verdict
 *  exists it is returned immediately and refreshed in the background after the TTL,
 *  so only the first request on a fresh instance waits for the probe (and that probe
 *  runs alongside the DB read, see get-media-assets.ts). Only a 403 is "blocked" — a
 *  404 means that one file is gone. A timeout or network error is inconclusive: it
 *  never stores a verdict, so an old one ages out instead of being renewed. */
const PROBE_TTL_MS = 60_000;
const PROBE_TIMEOUT_MS = 1_500;

let verdict: { blocked: boolean; at: number } | null = null;
let inFlight: Promise<boolean> | null = null;

/** A URL on the project's own store that is safe to HEAD for the probe. The public
 *  host is the store id from the read-write token (`vercel_blob_rw_<id>_…`),
 *  lower-cased — the only place the store's identity is known without a DB row.
 *  `null` outside Vercel (no token), in which case the caller probes a stored URL. */
export function blobProbeUrl(): string | null {
  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([A-Za-z0-9]+)_/)?.[1];
  return storeId ? `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com/ananda-logo.svg` : null;
}

export async function isBlobStoreBlocked(probeUrl: string): Promise<boolean> {
  if (verdict && Date.now() - verdict.at < PROBE_TTL_MS) return verdict.blocked;
  inFlight ??= probe(probeUrl)
    .then((blocked) => {
      if (blocked !== null) verdict = { blocked, at: Date.now() };
      return blocked ?? verdict?.blocked ?? false;
    })
    .finally(() => {
      inFlight = null;
    });
  return verdict ? verdict.blocked : inFlight;
}

/** `true` / `false` on an answer from the store, `null` when there was none. */
async function probe(url: string): Promise<boolean | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store", signal: controller.signal });
    return res.status === 403;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
