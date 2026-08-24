import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { getMessages } from "@/lib/content/get-messages";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, type AppLocale } from "./config";

/** Cookie-based locale (no `[locale]` routing — the site is a single page).
 *  Falls back to English when the cookie is missing or holds junk. Messages come
 *  from the backoffice-managed Postgres content, with the static messages/*.json
 *  as a resilience fallback (see lib/content/get-messages.ts). */
export default getRequestConfig(async () => {
  const store = await cookies();
  const candidate = store.get(LOCALE_COOKIE)?.value;
  const locale: AppLocale = (LOCALES as readonly string[]).includes(candidate ?? "")
    ? (candidate as AppLocale)
    : DEFAULT_LOCALE;

  return {
    locale,
    messages: await getMessages(locale),
  };
});
