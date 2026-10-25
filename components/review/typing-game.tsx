"use client";

/**
 * Typing game: see the translation, type the Czech word. Case and punctuation
 * don't matter; missing háčky and čárky count as "almost". A wrong answer
 * comes back once, a few words later.
 */
import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useI18n, usePrefs } from "@/components/providers";
import { ModeBar, ProgressBar, SessionDone, type ModeProps } from "@/components/review/shared";
import { checkAnswer, CZECH_LETTERS, requeue, shuffled, type AnswerCheck } from "@/lib/review";
import { speakCzech, useCzechVoice } from "@/lib/speech";
import { LANG_CODES, LANG_TAGS, type Word } from "@/lib/types";

const isLetter = (ch: string) => /\p{L}/u.test(ch);

/** The answer's shape with only the first `shown` letters visible: "p e _ _ _". */
function pattern(answer: string, shown: number) {
  let letters = 0;
  return [...answer].map((ch) => (isLetter(ch) ? (letters++ < shown ? ch : "_") : ch === " " ? "  " : ch)).join(" ");
}

export function TypingGame({ words, lang, backHref }: ModeProps) {
  const { t } = useI18n();
  const { prefs } = usePrefs();
  const voice = useCzechVoice();
  const inputRef = useRef<HTMLInputElement>(null);

  const [pile, setPile] = useState<Word[]>(words);
  const [queue, setQueue] = useState<Word[]>(() => shuffled(words));
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnswerCheck | null>(null);
  const [hints, setHints] = useState(0);
  // Words answered wrong at least once, and words with accent slips.
  const [missed, setMissed] = useState<Set<string>>(() => new Set());
  const [accents, setAccents] = useState<Set<string>>(() => new Set());
  // Words already sent back into the queue (each comes back only once).
  const requeued = useRef(new Set<string>());

  const word = queue[0];
  const canSpeak = voice.status === "ready";
  const done = pile.length - queue.length;

  const focusInput = () => window.requestAnimationFrame(() => inputRef.current?.focus());

  const start = (next: Word[]) => {
    requeued.current.clear();
    setPile(next);
    setQueue(shuffled(next));
    setMissed(new Set());
    setAccents(new Set());
    setInput("");
    setResult(null);
    setHints(0);
    focusInput();
  };

  const check = (giveUp = false) => {
    if (!word) return;
    const r = giveUp ? "wrong" : checkAnswer(input, word);
    setResult(r);
    if (r === "accents") setAccents((s) => new Set(s).add(word.id));
    if (r === "wrong") setMissed((s) => new Set(s).add(word.id));
    if (prefs.speak && canSpeak) speakCzech(word.cs, prefs.speechRate);
  };

  const next = () => {
    // A first miss sends the word back into the queue; after that it moves on.
    const again = result === "wrong" && !requeued.current.has(word.id);
    if (again) requeued.current.add(word.id);
    setQueue(again ? requeue(queue, 3) : queue.slice(1));
    setInput("");
    setResult(null);
    setHints(0);
    focusInput();
  };

  const insert = (ch: string) => {
    const el = inputRef.current;
    const from = el?.selectionStart ?? input.length;
    const to = el?.selectionEnd ?? input.length;
    setInput(input.slice(0, from) + ch + input.slice(to));
    window.requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(from + ch.length, from + ch.length);
    });
  };

  const title = t("review.typing");

  if (!word) {
    const right = pile.filter((w) => !missed.has(w.id)).length;
    // Accent slips count as right, but are worth another look.
    const toPractise = pile.filter((w) => missed.has(w.id) || accents.has(w.id));
    return (
      <div className="container-page pb-16 pt-3 sm:pt-4">
        <ModeBar title={title} backHref={backHref} />
        <SessionDone
          result={t("review.doneTyping", { n: right, total: pile.length })}
          missed={toPractise}
          lang={lang}
          backHref={backHref}
          onRestart={() => start(words)}
          onPractiseMissed={() => start(toPractise)}
        />
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col pb-12 pt-3 sm:pt-4">
      <ModeBar title={title} backHref={backHref}>
        <span className="text-sm tabular-nums text-muted">{t("review.left", { n: queue.length })}</span>
      </ModeBar>

      <div className="mx-auto mt-4 w-full max-w-xl">
        <ProgressBar value={done} total={pile.length} label={t("review.position", { n: done, total: pile.length })} />

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (result) next();
            else if (input.trim()) check();
          }}
        >
          {/* Keyed per word so each prompt animates in; the input below stays mounted to keep the keyboard open. */}
          <div
            key={`${word.id}-${queue.length}`}
            className="panel rise relative flex min-h-48 flex-col items-center justify-center px-6 py-8 text-center"
          >
            <span className="absolute left-5 top-4 text-xs font-bold tracking-[0.08em] text-muted">{LANG_CODES[lang]}</span>
            <p className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl" lang={LANG_TAGS[lang]}>
              {word[lang]}
            </p>
            <p
              className={`mt-3 whitespace-pre-wrap font-mono text-lg text-muted transition-opacity ${result ? "opacity-0" : ""}`}
              aria-hidden={hints === 0 || result !== null}
              lang="cs"
            >
              {pattern(word.cs, hints)}
            </p>
            {canSpeak && (
              <button
                type="button"
                className="btn btn-ghost btn-sm absolute right-3 top-3"
                onClick={() => speakCzech(word.cs, prefs.speechRate)}
                aria-label={`${t("common.listen")} (${t("common.czech")})`}
                title={`${t("common.listen")} (${t("common.czech")})`}
              >
                <Icon name="speaker" size={18} />
              </button>
            )}
          </div>

          <label className="mt-5 block text-sm font-semibold" htmlFor="answer">
            {t("review.typePrompt")}
          </label>
          <input
            ref={inputRef}
            id="answer"
            className={`field mt-2 text-center text-xl font-semibold ${
              result === "correct" ? "border-fg" : result === "wrong" ? "border-danger text-danger line-through" : ""
            }`}
            lang="cs"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            readOnly={result !== null}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint={result ? "next" : "done"}
            autoFocus
          />

          {result === null ? (
            <>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5" role="group" aria-label={t("review.letters")}>
                {CZECH_LETTERS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    className="h-10 min-w-10 rounded-xl border border-line px-2 text-lg font-semibold transition-colors hover:bg-surface active:scale-95"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => insert(ch)}
                    lang="cs"
                  >
                    {ch}
                  </button>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => check(true)}>
                  {t("review.dontKnow")}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setHints((h) => h + 1);
                    focusInput();
                  }}
                  disabled={hints >= [...word.cs].filter(isLetter).length}
                >
                  {t("review.hint")}
                </button>
                <button type="submit" className="btn flex-1" disabled={!input.trim()}>
                  {t("review.check")}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4" role="status">
              <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-lg">
                {result === "correct" ? (
                  <span className="pop-in flex items-center gap-2 font-semibold">
                    <Icon name="check" size={20} strokeWidth={2.2} /> {t("review.correct")}
                  </span>
                ) : (
                  <>
                    <span className="text-muted">{t(result === "accents" ? "review.accents" : "review.answerIs")}</span>
                    <span className="font-bold" lang="cs">
                      {word.cs}
                    </span>
                  </>
                )}
              </p>
              <button type="submit" className="btn mt-5 w-full">
                {t("review.continue")} <Icon name="arrow-right" size={16} />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
