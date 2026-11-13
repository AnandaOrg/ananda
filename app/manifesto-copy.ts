import type { AppLocale } from "@/i18n/config";

export type Run = { text: string; underline?: boolean };
const R = (text: string, underline = false): Run => ({ text, underline });

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
  [R("ANANDA Е ВЪРХОВНАТА РАДОСТ НА НАСТОЯЩИЯ МОМЕНТ. ТОВА Е УСЕЩАНЕТО НА БАСА, УДРЯЩ В ГЪРДИТЕ ТИ, СЛЪНЦЕТО, ОГРЯВАЩО БАСЕЙНА, И ЧУВСТВОТО, ЧЕ НЯМА ДРУГО МЯСТО НА ЗЕМЯТА, КЪДЕТО ПРЕДПОЧИТАШ ДА СИ. ЗАТВОРИХМЕ ТОЧНО ТОВА УСЕЩАНЕ В БУТИЛКА. ПОСЛЕ ИЗХВЪРЛИХМЕ БУТИЛКАТА. ТОВА Е БЕЗКОМПРОМИСНА МИКСОЛОГИЯ, ОПАКОВАНА ЗА АБСОЛЮТНА СВОБОДА.")],
];

export const MANIFESTO: Record<AppLocale, Run[][]> = {
  en: EN_PARAS,
  bg: BG_PARAS,
};

export const MANIFESTO_MOBILE: Record<AppLocale, Run[][]> = {
  en: [EN_PARAS.reduce<Run[]>((acc, p, i) => (i === 0 ? [...p] : [...acc, R(" "), ...p]), [])],
  bg: BG_PARAS,
};
