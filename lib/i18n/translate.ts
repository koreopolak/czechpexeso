/**
 * Translation function: typed keys, `{var}` interpolation and plural forms via
 * Intl.PluralRules. Imports no message files, so client bundles only get the
 * messages of the current locale (passed down from the server).
 */
import type { UiLocale } from "@/lib/types";
import type { MessageKey, Messages, PluralForms } from "./messages/en";

export type { MessageKey, Messages };

/** Locale tags for number/date formatting. */
export const INTL_LOCALE: Record<UiLocale, string> = { en: "en-GB", uk: "uk-UA", ru: "ru-RU", pl: "pl-PL" };

export type Vars = Record<string, string | number>;
export type TFunction = (key: MessageKey, vars?: Vars) => string;

function interpolate(text: string, vars?: Vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export function createT(locale: UiLocale, messages: Messages): TFunction {
  const rules = new Intl.PluralRules(INTL_LOCALE[locale]);
  return (key, vars) => {
    const value = messages[key] as string | PluralForms | undefined;
    if (value === undefined) return key;
    if (typeof value === "string") return interpolate(value, vars);
    const form = rules.select(Number(vars?.n ?? 0)) as keyof PluralForms;
    return interpolate(value[form] ?? value.other, vars);
  };
}
