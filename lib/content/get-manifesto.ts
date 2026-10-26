import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/db/client";
import { contentEntries, contentValues } from "@/db/schema";
import { MANIFESTO, MANIFESTO_MOBILE, type Run } from "@/app/manifesto-copy";
import type { AppLocale } from "@/i18n/config";
import { CONTENT_CACHE_TAG, DB_CACHE_REVALIDATE_SECONDS } from "@/lib/cache-tags";
import { htmlToParas, joinParasForMobile } from "./manifesto-html";

/** The manifesto HTML for one locale, cached across requests (Next data cache; the
 *  backoffice content route revalidates the tag after every save). */
const readManifestoHtml = unstable_cache(
  async (locale: AppLocale): Promise<string> => {
    const db = getDb();
    const [row] = await db
      .select({ value: contentValues.value })
      .from(contentValues)
      .innerJoin(contentEntries, eq(contentValues.entryId, contentEntries.id))
      .where(and(eq(contentEntries.namespace, "manifesto"), eq(contentEntries.key, "body"), eq(contentValues.locale, locale)))
      .limit(1);
    // Not cached when missing: the seed scripts run outside Next and cannot expire the tag.
    if (!row) throw new Error("manifesto body is empty — falling back to the static copy");
    return row.value;
  },
  ["content-manifesto"],
  { tags: [CONTENT_CACHE_TAG], revalidate: DB_CACHE_REVALIDATE_SECONDS },
);

/** `cache()` dedupes this within a single request — Manifesto.tsx (desktop) and
 *  MobileAbout.tsx (mobile) both need it, but it should only read it once. */
const getManifestoHtml = cache(async (locale: AppLocale): Promise<string | null> => {
  try {
    return await readManifestoHtml(locale);
  } catch {
    return null;
  }
});

export async function getManifesto(locale: AppLocale): Promise<Run[][]> {
  const html = await getManifestoHtml(locale);
  const paras = html ? htmlToParas(html) : [];
  return paras.length ? paras : MANIFESTO[locale];
}

/** Mirrors the desktop paragraphs into the mobile shape (English gets joined into one
 *  flowing paragraph — see `joinParasForMobile`; Bulgarian is used as-is). */
export async function getManifestoMobile(locale: AppLocale): Promise<Run[][]> {
  const html = await getManifestoHtml(locale);
  const paras = html ? htmlToParas(html) : [];
  if (!paras.length) return MANIFESTO_MOBILE[locale];
  return locale === "en" ? joinParasForMobile(paras) : paras;
}
