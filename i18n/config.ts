/** Locales the site ships. The language switcher, request config, and any
 *  per-locale layout overrides all key off this single list. */
export const LOCALES = ["en", "bg"] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

/** Cookie that persists the visitor's choice (read server-side in
 *  `i18n/request.ts`, written client-side by `LanguageSwitcher`). */
export const LOCALE_COOKIE = "locale";
