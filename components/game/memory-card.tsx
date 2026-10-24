"use client";

import { memo, type CSSProperties, type Ref } from "react";
import type { Card } from "@/lib/game/engine";
import { LANG_CODES, LANG_TAGS, type SourceLang } from "@/lib/types";

type Props = {
  ref?: Ref<HTMLButtonElement>;
  index: number;
  card: Card;
  text: string;
  lang: SourceLang;
  open: boolean;
  found: boolean;
  last: boolean;
  shake: boolean;
  width: number;
  height: number;
  label: string;
  onFlip: (index: number) => void;
  onKeyNav: (index: number, key: string) => void;
};

/** Font sizing hints for the CSS: longest word and number of lines. */
function textMetrics(text: string) {
  const tokens = text.split(/\s+/);
  return { len: Math.max(4, ...tokens.map((t) => t.length)), lines: Math.min(3, tokens.length) };
}

/**
 * One card. The back is a striped "č" card; the Czech face is solid (inverted)
 * and the translation face is outlined, so players can tell the two sides apart.
 */
export const MemoryCard = memo(function MemoryCard({
  ref,
  index,
  card,
  text,
  lang,
  open,
  found,
  last,
  shake,
  width,
  height,
  label,
  onFlip,
  onKeyNav,
}: Props) {
  const m = textMetrics(text);
  const isCzech = card.side === "cs";

  return (
    <button
      ref={ref}
      type="button"
      className="mcard block rounded-[12px]"
      style={{ width, height }}
      data-open={open || found}
      data-found={found}
      data-last={last}
      data-shake={shake}
      aria-label={label}
      aria-disabled={found || undefined}
      onClick={() => onFlip(index)}
      onKeyDown={(e) => {
        if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") {
          e.preventDefault();
          onKeyNav(index, e.key);
        }
      }}
    >
      <span className="mcard-inner block" aria-hidden="true">
        <span className="mcard-face mcard-back">
          <span className="mcard-mark">č</span>
        </span>
        <span className="mcard-face mcard-front" data-side={card.side}>
          <span className="mcard-lang">{isCzech ? "CZ" : LANG_CODES[lang]}</span>
          <span
            className="mcard-word"
            lang={isCzech ? LANG_TAGS.cs : LANG_TAGS[lang]}
            style={{ "--len": m.len, "--lines": m.lines } as CSSProperties}
          >
            {text}
          </span>
        </span>
      </span>
    </button>
  );
});
