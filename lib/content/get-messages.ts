import { and, eq, ne } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/db/client";
import { contentEntries, contentValues } from "@/db/schema";
import type { AppLocale } from "@/i18n/config";
import { CONTENT_CACHE_TAG, DB_CACHE_REVALIDATE_SECONDS } from "@/lib/cache-tags";
import { setDeep } from "./flatten";

/** The raw `content_values` rows for one locale, cached across requests (Next data
 *  cache; the backoffice content route revalidates the tag after every save). */
const readContentRows = unstable_cache(
  async (locale: AppLocale) => {
    const db = getDb();
    const rows = await db
      .select({ namespace: contentEntries.namespace, key: contentEntries.key, value: contentValues.value })
      .from(contentValues)
      .innerJoin(contentEntries, eq(contentValues.entryId, contentEntries.id))
      .where(and(eq(contentValues.locale, locale), ne(contentEntries.namespace, "manifesto")));
    // Not cached when empty: the seed scripts run outside Next and cannot expire the tag.
    if (rows.length === 0) throw new Error("content_values is empty — falling back to static messages");
    return rows;
  },
  ["content-messages"],
  { tags: [CONTENT_CACHE_TAG], revalidate: DB_CACHE_REVALIDATE_SECONDS },
);

/** Assembles the next-intl messages object for a locale from the `content_entries` /
 *  `content_values` tables (everything the backoffice manages except the manifesto,
 *  which has its own rich `Run[][]` shape — see get-manifesto.ts). Falls back to the
 *  static `messages/*.json` baseline if the DB is unreachable or unseeded, so the site
 *  never hard-depends on DB uptime for its copy. */
export async function getMessages(locale: AppLocale): Promise<Record<string, unknown>> {
  try {
    const rows = await readContentRows(locale);
    const messages: Record<string, unknown> = {};
    for (const row of rows) {
      setDeep(messages, `${row.namespace}.${row.key}`, row.value);
    }
    return messages;
  } catch {
    return (await import(`../../messages/${locale}.json`)).default;
  }
}
