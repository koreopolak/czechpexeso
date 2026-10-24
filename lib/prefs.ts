/**
 * Player preferences. Stored in a small first-party cookie (not localStorage)
 * so the server can render the right language, theme and board size on the
 * first paint, with no flash of the wrong content.
 */
import { isGridSize, isSourceLang, isUiLocale, type GridSize, type SourceLang, type UiLocale } from "@/lib/types";

export const PREFS_COOKIE = "cp_prefs";

export type Theme = "system" | "light" | "dark";

export type Prefs = {
  /** Interface language. Undefined until chosen; the server falls back to Accept-Language. */
  locale?: UiLocale;
  /** Language on the translation cards. Undefined = same as the interface. */
  sourceLang?: SourceLang;
  grid: GridSize;
  timer: boolean;
  sound: boolean;
  speak: boolean;
  speechRate: number;
  theme: Theme;
};

export const DEFAULT_PREFS: Prefs = {
  grid: "4x4",
  timer: true,
  sound: true,
  speak: true,
  speechRate: 0.9,
  theme: "system",
};

export function parsePrefs(raw: string | undefined | null): Prefs {
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const v = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    return {
      locale: isUiLocale(v.locale) ? v.locale : undefined,
      sourceLang: isSourceLang(v.sourceLang) ? v.sourceLang : undefined,
      grid: isGridSize(v.grid) ? v.grid : DEFAULT_PREFS.grid,
      timer: typeof v.timer === "boolean" ? v.timer : DEFAULT_PREFS.timer,
      sound: typeof v.sound === "boolean" ? v.sound : DEFAULT_PREFS.sound,
      speak: typeof v.speak === "boolean" ? v.speak : DEFAULT_PREFS.speak,
      speechRate:
        typeof v.speechRate === "number" && v.speechRate >= 0.5 && v.speechRate <= 1.5 ? v.speechRate : DEFAULT_PREFS.speechRate,
      theme: v.theme === "light" || v.theme === "dark" || v.theme === "system" ? v.theme : DEFAULT_PREFS.theme,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function serializePrefs(p: Prefs): string {
  return encodeURIComponent(JSON.stringify(p));
}
