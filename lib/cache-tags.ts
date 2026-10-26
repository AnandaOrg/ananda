/** Data-cache tags for the backoffice-managed tables. Readers (`unstable_cache`
 *  wrappers in lib/media and lib/content) tag their entries with these; the
 *  backoffice mutation routes call `revalidateTag(tag, EXPIRE_NOW)` after a write. */
export const MEDIA_CACHE_TAG = "media";
export const CONTENT_CACHE_TAG = "content";

/** Fallback TTL in seconds for the cached DB reads — the on-demand tags above are
 *  what normally refresh them; this is only a safety net. */
export const DB_CACHE_REVALIDATE_SECONDS = 300;

/** `revalidateTag` profile that expires the tag at once, so the request right after
 *  a backoffice save already reads fresh rows (an admin checks their edit on the next
 *  load; stale-while-revalidate would show them the old value one more time). The
 *  only cost is one DB read on that next request. */
export const EXPIRE_NOW = { expire: 0 } as const;
