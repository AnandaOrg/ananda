import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { contentEntries, contentValues } from "@/db/schema";
import type { AppLocale } from "@/i18n/config";
import { setDeep } from "./flatten";

/** Assembles the next-intl messages object for a locale from the `content_entries` /
 *  `content_values` tables (everything the backoffice manages except the manifesto,
 *  which has its own rich `Run[][]` shape — see get-manifesto.ts). Falls back to the
 *  static `messages/*.json` baseline if the DB is unreachable or unseeded, so the site
 *  never hard-depends on DB uptime for its copy. */
export async function getMessages(locale: AppLocale): Promise<Record<string, unknown>> {
  try {
    const db = getDb();
    const rows = await db
      .select({ namespace: contentEntries.namespace, key: contentEntries.key, value: contentValues.value })
      .from(contentValues)
      .innerJoin(contentEntries, eq(contentValues.entryId, contentEntries.id))
      .where(and(eq(contentValues.locale, locale), ne(contentEntries.namespace, "manifesto")));

    if (rows.length === 0) throw new Error("content_values is empty — falling back to static messages");

    const messages: Record<string, unknown> = {};
    for (const row of rows) {
      setDeep(messages, `${row.namespace}.${row.key}`, row.value);
    }
    return messages;
  } catch {
    return (await import(`../../messages/${locale}.json`)).default;
  }
}
