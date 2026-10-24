"use client";

import { usePrefs, useT } from "@/components/providers";
import { GRID_SIZES, LANG_CODES, LANG_NAMES, SOURCE_LANGS } from "@/lib/types";

/** Quick pickers for card language and board size (also in Settings). */
export function PlayOptions() {
  const t = useT();
  const { prefs, sourceLang, setPrefs } = usePrefs();
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted">{t("decks.translateFrom")}</span>
        <div className="segmented" role="group" aria-label={t("decks.translateFrom")}>
          {SOURCE_LANGS.map((l) => (
            <button key={l} type="button" aria-pressed={l === sourceLang} title={LANG_NAMES[l]} onClick={() => setPrefs({ sourceLang: l })}>
              {LANG_CODES[l]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted">{t("decks.board")}</span>
        <div className="segmented" role="group" aria-label={t("decks.board")}>
          {GRID_SIZES.map((g) => (
            <button key={g} type="button" aria-pressed={g === prefs.grid} title={t(`grid.${g}`)} onClick={() => setPrefs({ grid: g })}>
              {g.replace("x", "×")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
