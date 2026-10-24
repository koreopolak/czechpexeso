"use client";

import { Icon } from "@/components/icons";
import { usePrefs, useT } from "@/components/providers";
import { speakCzech, useCzechVoice } from "@/lib/speech";
import { LANG_TAGS, type SourceLang, type Word } from "@/lib/types";

/** Czech — translation list with pronunciation buttons. */
export function WordList({ words, lang, highlight }: { words: Word[]; lang: SourceLang; highlight?: Set<string> }) {
  const t = useT();
  const { prefs } = usePrefs();
  const voice = useCzechVoice();

  return (
    <ul className="divide-y divide-line">
      {words.map((w) => (
        <li key={w.id} className={`flex items-center gap-3 py-2.5 ${highlight && !highlight.has(w.id) ? "opacity-50" : ""}`}>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold" lang={LANG_TAGS.cs}>
              {w.cs}
            </span>
            <span className="block text-sm text-muted" lang={LANG_TAGS[lang]}>
              {w[lang]}
              {w.note ? ` · ${w.note}` : ""}
            </span>
          </span>
          {voice.status === "ready" && (
            <button
              type="button"
              className="btn btn-ghost btn-icon shrink-0"
              aria-label={`${t("common.listen")}: ${w.cs}`}
              onClick={() => speakCzech(w.cs, prefs.speechRate)}
            >
              <Icon name="speaker" size={18} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
