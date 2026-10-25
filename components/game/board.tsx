"use client";

import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { MemoryCard } from "@/components/game/memory-card";
import { useT } from "@/components/providers";
import type { Card } from "@/lib/game/engine";
import { fitBoard, type BoardLayout } from "@/lib/game/layout";
import type { SourceLang, Word } from "@/lib/types";

type Props = {
  /** Cards to show; null while the board is being dealt (renders face-down placeholders). */
  cards: Card[] | null;
  count: number;
  words: Map<string, Word>;
  lang: SourceLang;
  open: number[];
  found: string[];
  lastMatch: string | null;
  mismatch: boolean;
  /** Space to keep free below the board (bottom bar), in px. */
  reserve: number;
  onFlip: (index: number) => void;
};

export function Board({ cards, count, words, lang, open, found, lastMatch, mismatch, reserve, onFlip }: Props) {
  const t = useT();
  const boxRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [layout, setLayout] = useState<BoardLayout | null>(null);

  // Fit the board to the space between the header and the bottom bar.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const height = Math.max(260, window.innerHeight - top - reserve);
      setLayout(fitBoard(count, width, height));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [count, reserve]);

  const onKeyNav = useCallback(
    (index: number, key: string) => {
      if (!layout) return;
      const { cols } = layout;
      const next =
        key === "ArrowRight" ? index + 1
        : key === "ArrowLeft" ? index - 1
        : key === "ArrowDown" ? index + cols
        : key === "ArrowUp" ? index - cols
        : key === "Home" ? 0
        : count - 1;
      cardRefs.current[Math.max(0, Math.min(count - 1, next))]?.focus();
    },
    [layout, count],
  );

  return (
    <div ref={boxRef} className="w-full">
      {layout && (
        <div
          role="group"
          aria-label={t("game.hint")}
          className="mx-auto grid justify-center"
          style={{ gridTemplateColumns: `repeat(${layout.cols}, ${layout.cardW}px)`, gap: layout.gap }}
        >
          {Array.from({ length: count }, (_, i) => {
            const card = cards?.[i];
            const word = card ? words.get(card.pairId) : undefined;
            if (!card || !word) {
              // Kept invisible: they only hold the layout until the real cards are dealt in.
              return (
                <div key={i} className="mcard invisible" style={{ width: layout.cardW, height: layout.cardH }}>
                  <span className="mcard-inner">
                    <span className="mcard-face mcard-back">
                      <span className="mcard-mark">č</span>
                    </span>
                  </span>
                </div>
              );
            }
            const isFound = found.includes(card.pairId);
            const isOpen = open.includes(i);
            const text = card.side === "cs" ? word.cs : word[lang];
            const label = isFound
              ? t("game.cardFound", { word: text })
              : isOpen
                ? t(card.side === "cs" ? "game.cardCzech" : "game.cardTranslation", { word: text })
                : t("game.cardHidden", { n: i + 1 });
            return (
              <div key={card.key} className="mcard-deal" style={{ "--i": i } as CSSProperties}>
                <MemoryCard
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  index={i}
                  card={card}
                  text={text}
                  lang={lang}
                  open={isOpen}
                  found={isFound}
                  last={isFound && lastMatch === card.pairId}
                  shake={mismatch && isOpen}
                  width={layout.cardW}
                  height={layout.cardH}
                  label={label}
                  onFlip={onFlip}
                  onKeyNav={onKeyNav}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
