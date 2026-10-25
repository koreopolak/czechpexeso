"use client";

/**
 * Flashcards: see one side, recall the other, flip to check. "Again" puts the
 * card back a few places later, "Got it" takes it out of the pile.
 */
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useI18n, usePrefs } from "@/components/providers";
import { ModeBar, ProgressBar, SessionDone, type ModeProps } from "@/components/review/shared";
import { requeue, shuffled } from "@/lib/review";
import { speakCzech, useCzechVoice } from "@/lib/speech";
import { LANG_CODES, LANG_TAGS, type Word } from "@/lib/types";

type Front = "cs" | "src";

export function Flashcards({ words, lang, backHref }: ModeProps) {
  const { t } = useI18n();
  const { prefs } = usePrefs();
  const voice = useCzechVoice();

  const [pile, setPile] = useState<Word[]>(words);
  const [queue, setQueue] = useState<Word[]>(() => shuffled(words));
  const [flipped, setFlipped] = useState(false);
  const [front, setFront] = useState<Front>("cs");
  const [missed, setMissed] = useState<Set<string>>(() => new Set());
  // Bumped per card so the new card animates in.
  const [dealt, setDealt] = useState(0);

  const card = queue[0];
  const done = pile.length - queue.length;
  const canSpeak = voice.status === "ready";

  /** Shows the next card, reading it out when it lands Czech side up. */
  const deal = useCallback(
    (next: Word[]) => {
      setQueue(next);
      setFlipped(false);
      setDealt((n) => n + 1);
      if (next[0] && front === "cs" && prefs.speak && canSpeak) speakCzech(next[0].cs, prefs.speechRate);
    },
    [canSpeak, front, prefs.speak, prefs.speechRate],
  );

  const start = (next: Word[]) => {
    setPile(next);
    setMissed(new Set());
    deal(shuffled(next));
  };

  const flip = useCallback(() => {
    if (!card) return;
    // Say the Czech word when it comes into view.
    if (prefs.speak && canSpeak && front === (flipped ? "cs" : "src")) speakCzech(card.cs, prefs.speechRate);
    setFlipped((f) => !f);
  }, [canSpeak, card, flipped, front, prefs.speak, prefs.speechRate]);

  const answer = useCallback(
    (knew: boolean) => {
      if (!card || !flipped) return;
      if (!knew) setMissed((m) => new Set(m).add(card.id));
      deal(knew ? queue.slice(1) : requeue(queue));
    },
    [card, deal, flipped, queue],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || el.closest("input, select, textarea")) return;
      if (e.key === " " || e.key === "Enter") {
        // A focused button or link handles these keys itself.
        if (el.closest("button, a")) return;
        e.preventDefault();
        flip();
      } else if (e.key === "ArrowLeft" || e.key === "1") answer(false);
      else if (e.key === "ArrowRight" || e.key === "2") answer(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, flip]);

  const title = t("review.flashcards");

  if (!card) {
    const missedWords = pile.filter((w) => missed.has(w.id));
    return (
      <div className="container-page pb-16 pt-3 sm:pt-4">
        <ModeBar title={title} backHref={backHref} />
        <SessionDone
          result={t("review.doneCards", { words: t("common.words", { n: pile.length }) })}
          missed={missedWords}
          lang={lang}
          backHref={backHref}
          onRestart={() => start(words)}
          onPractiseMissed={() => start(missedWords)}
        />
      </div>
    );
  }

  const side = (which: Front) =>
    which === "cs" ? { label: "CS", text: card.cs, tag: LANG_TAGS.cs } : { label: LANG_CODES[lang], text: card[lang], tag: LANG_TAGS[lang] };
  const a = side(front);
  const b = side(front === "cs" ? "src" : "cs");

  return (
    <div className="container-page flex flex-col pb-12 pt-3 sm:pt-4">
      <ModeBar title={title} backHref={backHref}>
        <span className="text-sm tabular-nums text-muted">{t("review.left", { n: queue.length })}</span>
      </ModeBar>

      <div className="mx-auto mt-4 w-full max-w-xl">
        <ProgressBar value={done} total={pile.length} label={t("review.position", { n: done, total: pile.length })} />

        <div className="mt-4 flex justify-center">
          <div className="segmented" role="group" aria-label={t("review.front")}>
            <button type="button" aria-pressed={front === "cs"} onClick={() => { setFront("cs"); setFlipped(false); }}>
              {t("review.czechFirst")}
            </button>
            <button type="button" aria-pressed={front === "src"} onClick={() => { setFront("src"); setFlipped(false); }}>
              {t("review.translationFirst")}
            </button>
          </div>
        </div>

        <button
          key={dealt}
          type="button"
          className="fcard rise mt-5 block aspect-[4/3] w-full sm:aspect-[3/2]"
          data-flipped={flipped}
          onClick={flip}
          aria-label={flipped ? `${b.text} — ${a.text}` : `${a.text}. ${t("review.tapToFlip")}`}
        >
          <span className="fcard-inner">
            <span className="fcard-face fcard-front">
              <span className="fcard-lang">{a.label}</span>
              <span className="fcard-word" lang={a.tag}>
                {a.text}
              </span>
              <span className="absolute bottom-5 flex items-center gap-1.5 text-xs font-medium opacity-55">
                <Icon name="restart" size={14} /> {t("review.tapToFlip")}
              </span>
            </span>
            <span className="fcard-face fcard-back">
              <span className="fcard-lang">{b.label}</span>
              <span className="fcard-word" lang={b.tag}>
                {b.text}
              </span>
              <span className="mt-2 text-base opacity-60" lang={a.tag}>
                {a.text}
              </span>
            </span>
          </span>
        </button>

        <div className="mt-5 flex items-center gap-2">
          {flipped ? (
            <>
              <button type="button" className="btn btn-outline flex-1" onClick={() => answer(false)}>
                <Icon name="close" size={18} /> {t("review.again")}
              </button>
              {canSpeak && (
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => speakCzech(card.cs, prefs.speechRate)}
                  aria-label={`${t("common.listen")}: ${card.cs}`}
                >
                  <Icon name="speaker" size={18} />
                </button>
              )}
              <button type="button" className="btn flex-1" onClick={() => answer(true)}>
                <Icon name="check" size={18} /> {t("review.gotIt")}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-outline flex-1" onClick={flip}>
              <Icon name="eye" size={18} /> {t("review.show")}
            </button>
          )}
        </div>
        <p className="mt-4 hidden text-center text-xs text-muted sm:block">{t("review.cardKeys")}</p>
      </div>
    </div>
  );
}
