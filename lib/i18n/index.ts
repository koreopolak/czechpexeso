/**
 * Interface languages. To add one: create messages/<code>.ts (TypeScript makes
 * sure every key is translated), register it below and add the code to
 * UI_LOCALES in lib/types.ts.
 */
import type { UiLocale } from "@/lib/types";
import { en } from "./messages/en";
import { pl } from "./messages/pl";
import { ru } from "./messages/ru";
import { uk } from "./messages/uk";
import type { Messages } from "./translate";

export { createT, INTL_LOCALE, type MessageKey, type Messages, type TFunction, type Vars } from "./translate";

const ALL: Record<UiLocale, Messages> = { en, uk, ru, pl };

export function getMessages(locale: UiLocale): Messages {
  return ALL[locale] ?? en;
}

/** Picks the best supported locale from an Accept-Language header. */
export function matchLocale(acceptLanguage: string | null | undefined): UiLocale {
  if (!acceptLanguage) return "en";
  const wanted = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of wanted) {
    const base = tag.split("-")[0];
    if (base === "uk" || base === "ru" || base === "pl" || base === "en") return base;
    if (base === "ua") return "uk";
  }
  return "en";
}
