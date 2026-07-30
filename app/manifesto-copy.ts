import type { AppLocale } from "@/i18n/config";

/**
 * The ANANDA manifesto statement, per locale. Lives in a plain (non-"use
 * client") module so Server Components can index it by locale — exporting it
 * from RevealStatement.tsx handed RSC importers a client-reference proxy whose
 * properties are undefined on the server.
 *
 * EN keeps the original "supreme joy" statement (underlined runs get the small
 * mono treatment). BG uses the dictionary-entry copy from the BG deck. Shared
 * by the desktop `Manifesto` section and `mobile/MobileAbout`.
 */

export type Run = { text: string; underline?: boolean };
const R = (text: string, underline = false): Run => ({ text, underline });

/** EN desktop: three hard-broken lines (the original statement). */
const EN_PARAS: Run[][] = [
  [R("ANANDA IS THE SUPREME JOY OF THE PRESENT "), R("MOMENT.", true)],
  [R("IT’S THE FEELING OF THE BASS HITTING YOUR CHEST,")],
  [
    R("THE SUN WASHING "),
    R("OVER THE", true),
    R(" POOL, AND THE SENSE THAT THERE IS NOWHERE ELSE ON EARTH YOU’D RATHER BE. WE BOTTLED THAT EXACT FEELING. "),
    R("THEN WE", true),
    R(" DITCHED THE BOTTLE. THIS IS HIGH-FIDELITY MIXOLOGY PACKED FOR "),
    R("ABSOLUTE", true),
    R(" FREEDOM."),
  ],
];

const BG_PARAS: Run[][] = [
  [R("\"ANANDA\" "), R("[ɑː·NAN·də]", true)],
  [R("1. БЕЗГРАНИЧНАТА РАДОСТ, КОЯТО ПРИСТИГА БЕЗ ПОЗВОЛЕНИЕ.")],
  [R("2. УСЕЩАНЕТО, КОГАТО БАСЪТ, СЛЪНЦЕТО, ХОРАТА И НОЩТА РЕШАТ ДА БЪДАТ В ХАРМОНИЯ.")],
  [R("3. ТОВА, КОЕТО СЕ СЛУЧВА, КОГАТО СПРЕШ ДА ЧАКАШ ПРАВИЛНИЯ МОМЕНТ И РАЗБЕРЕШ, ЧЕ ГО СЪЗДАВАШ ТОЧНО СЕГА.")],
  [R("Употреба: ", true), R("ИДВА В ПАУЧ. ОТИВА НАВСЯКЪДЕ, КЪДЕТО И ТИ.")],
];

export const MANIFESTO: Record<AppLocale, Run[][]> = {
  en: EN_PARAS,
  bg: BG_PARAS,
};

/**
 * Mobile variant: EN flows as one paragraph (the desktop lines joined with
 * spaces, matching the original mobile layout); BG keeps the dictionary-entry
 * paragraphs on both breakpoints.
 */
export const MANIFESTO_MOBILE: Record<AppLocale, Run[][]> = {
  en: [EN_PARAS.reduce<Run[]>((acc, p, i) => (i === 0 ? [...p] : [...acc, R(" "), ...p]), [])],
  bg: BG_PARAS,
};
