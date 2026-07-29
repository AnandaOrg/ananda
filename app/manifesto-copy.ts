import type { AppLocale } from "@/i18n/config";

/**
 * The ANANDA "dictionary entry" manifesto, per locale. Lives in a plain
 * (non-"use client") module so Server Components can index it by locale —
 * exporting it from RevealStatement.tsx handed RSC importers a client-reference
 * proxy whose properties are undefined on the server.
 *
 * Structured runs keep the phonetic / part-of-speech / usage fragments in the
 * small mono treatment while the definitions run in the display font. Shared
 * by the desktop `Manifesto` section and `mobile/MobileAbout`.
 */

export type Run = { text: string; underline?: boolean };
const R = (text: string, underline = false): Run => ({ text, underline });

export const MANIFESTO: Record<AppLocale, Run[][]> = {
  en: [
    [R("\"ANANDA\" "), R("[ɑː·NAN·də]", true)],
    [R("noun · Sanskrit · origin: everywhere", true)],
    [R("1. THE UNBOUNDED JOY THAT ARRIVES WITHOUT PERMISSION.")],
    [R("2. THE FEELING WHEN THE BASS, THE SUN, THE PEOPLE, AND THE NIGHT ALL DECIDE TO AGREE.")],
    [R("3. WHAT HAPPENS WHEN YOU STOP WAITING FOR THE RIGHT MOMENT AND REALIZE THIS IS IT.")],
    [R("Usage: ", true), R("COMES IN A POUCH. GOES EVERYWHERE YOU DO.")],
  ],
  bg: [
    [R("\"ANANDA\" "), R("[ɑː·NAN·də]", true)],
    [R("съществително · Санскрит · произход: навсякъде", true)],
    [R("1. БЕЗГРАНИЧНАТА РАДОСТ, КОЯТО ПРИСТИГА БЕЗ ПОЗВОЛЕНИЕ.")],
    [R("2. УСЕЩАНЕТО, КОГАТО БАСЪТ, СЛЪНЦЕТО, ХОРАТА И НОЩТА РЕШАТ ДА БЪДАТ В ХАРМОНИЯ.")],
    [R("3. ТОВА, КОЕТО СЕ СЛУЧВА, КОГАТО СПРЕШ ДА ЧАКАШ ПРАВИЛНИЯ МОМЕНТ И РАЗБЕРЕШ, ЧЕ ГО СЪЗДАВАШ ТОЧНО СЕГА.")],
    [R("Употреба: ", true), R("ИДВА В ПАУЧ. ОТИВА НАВСЯКЪДЕ, КЪДЕТО И ТИ.")],
  ],
};
