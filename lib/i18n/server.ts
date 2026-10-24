import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import { parsePrefs, PREFS_COOKIE, type Prefs } from "@/lib/prefs";
import type { SourceLang, UiLocale } from "@/lib/types";
import { createT, getMessages, matchLocale } from "./index";

/**
 * Preferences from the cookie. `prefs` is what the player chose (fields may be
 * unset); `locale` and `sourceLang` are resolved (cookie → Accept-Language → English).
 */
export const getPrefs = cache(async (): Promise<{ prefs: Prefs; locale: UiLocale; sourceLang: SourceLang }> => {
  const jar = await cookies();
  const prefs = parsePrefs(jar.get(PREFS_COOKIE)?.value);
  const locale = prefs.locale ?? matchLocale((await headers()).get("accept-language"));
  return { prefs, locale, sourceLang: prefs.sourceLang ?? locale };
});

export async function getLocale(): Promise<UiLocale> {
  return (await getPrefs()).locale;
}

export async function getT() {
  const locale = await getLocale();
  return { t: createT(locale, getMessages(locale)), locale };
}
