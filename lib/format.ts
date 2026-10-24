import { INTL_LOCALE } from "@/lib/i18n/translate";
import type { UiLocale } from "@/lib/types";

export function formatPrice(amountMinor: number, currency: string, locale: UiLocale, { trimZeros = true } = {}) {
  const value = amountMinor / 100;
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: trimZeros && Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function formatDate(iso: string | number | Date, locale: UiLocale) {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

export function formatShortDate(iso: string | number | Date, locale: UiLocale) {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function formatDuration(ms: number) {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
