import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { contentEntries, contentValues } from "@/db/schema";
import { MANIFESTO, MANIFESTO_MOBILE, type Run } from "@/app/manifesto-copy";
import type { AppLocale } from "@/i18n/config";
import { htmlToParas, joinParasForMobile } from "./manifesto-html";

/** `cache()` dedupes this within a single request — Manifesto.tsx (desktop) and
 *  MobileAbout.tsx (mobile) both need it, but it should only hit the DB once. */
const getManifestoHtml = cache(async (locale: AppLocale): Promise<string | null> => {
  try {
    const db = getDb();
    const [row] = await db
      .select({ value: contentValues.value })
      .from(contentValues)
      .innerJoin(contentEntries, eq(contentValues.entryId, contentEntries.id))
      .where(and(eq(contentEntries.namespace, "manifesto"), eq(contentEntries.key, "body"), eq(contentValues.locale, locale)))
      .limit(1);
    return row?.value ?? null;
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
