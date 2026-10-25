"use client";

/**
 * Speed typing (Review): a timed round — see the translation, type the Czech
 * word, as many as you can. An exact answer moves on by itself; Enter accepts
 * one that only misses háčky or čárky (it counts, but is listed to look at
 * again); Esc skips. The clock pauses while the tab is hidden, and the best
 * score per round length is kept with the player's progress.
 */
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useI18n, usePrefs } from "@/components/providers";
import { ModeBar, ProgressBar, SessionDone, type ModeProps } from "@/components/review/shared";
import { formatTime } from "@/lib/game/engine";
import { progressStore, useProgress } from "@/lib/progress-store";
import { checkAnswer, CZECH_LETTERS, shuffled, SPEED_DURATIONS, wordsPerMinute, type SpeedDuration } from "@/lib/review";
import { speakCzech, useCzechVoice } from "@/lib/speech";
import { LANG_CODES, LANG_TAGS, type Word } from "@/lib/types";

type Phase = "ready" | "playing" | "done";
type Outcome = { word: Word; kind: "correct" | "accents" | "skipped" };
/** Time used before the last pause, and when the clock last started (null = paused). */
type Clock = { usedMs: number; runningSince: number | null };

/** Wall-clock time for event handlers (kept out of render). */
const clockNow = () => Date.now();

const isLetter = (ch: string) => /\p{L}/u.test(ch);
/** The answer's shape: "_ _ _ _  _ _" (letters hidden, spaces and punctuation kept). */
const pattern = (answer: string) => [...answer].map((ch) => (isLetter(ch) ? "_" : ch === " " ? "  " : ch)).join(" ");

function nextQueue(queue: Word[], pool: Word[]): Word[] {
  const rest = queue.slice(1);
  if (rest.length > 0) return rest;
  // Ran out: deal the words again, without repeating the one just answered.
  const again = shuffled(pool);
  return again.length > 1 && again[0].id === queue[0]?.id ? [...again.slice(1), again[0]] : again;
}

export function SpeedTyping({ words, lang, backHref }: ModeProps) {
  const { t } = useI18n();
  const { prefs } = usePrefs();
  const voice = useCzechVoice();
  const progress = useProgress();
  const inputRef = useRef<HTMLInputElement>(null);
  // Set once a round has been scored, so a late tick can't score it twice.
  const ended = useRef(false);

  const [duration, setDuration] = useState<SpeedDuration>(60);
  const [phase, setPhase] = useState<Phase>("ready");
  const [pool, setPool] = useState<Word[]>(words);
  const [queue, setQueue] = useState<Word[]>([]);
  const [input, setInput] = useState("");
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [shake, setShake] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [clock, setClock] = useState<Clock>({ usedMs: 0, runningSince: null });
  const [now, setNow] = useState(0);

  const word = queue[0];
  const score = outcomes.filter((o) => o.kind !== "skipped").length;
  const totalMs = duration * 1000;
  const usedMs = clock.usedMs + (clock.runningSince !== null ? Math.max(0, now - clock.runningSince) : 0);
  const leftMs = Math.max(0, totalMs - usedMs);
  const canSpeak = voice.status === "ready";
  const best = progress.speedBest[String(duration)] ?? 0;

  const durationLabel = (s: number) => (s < 60 ? t("review.seconds", { n: s }) : t("review.minutes", { n: s / 60 }));
  const focusInput = () => window.requestAnimationFrame(() => inputRef.current?.focus());

  // Tick, and end the round when the time is up.
  useEffect(() => {
    if (phase !== "playing" || clock.runningSince === null) return;
    const since = clock.runningSince;
    const id = window.setInterval(() => {
      const at = Date.now();
      setNow(at);
      if (clock.usedMs + (at - since) >= totalMs && !ended.current) {
        ended.current = true;
        setPhase("done");
        setClock({ usedMs: totalMs, runningSince: null });
        setNewBest(progressStore.recordSpeed(duration, score));
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, clock, totalMs, duration, score]);

  // Pause while the tab is in the background.
  useEffect(() => {
    if (phase !== "playing") return;
    const onVisibility = () => {
      const at = Date.now();
      setNow(at);
      setClock((c) =>
        document.hidden
          ? c.runningSince === null
            ? c
            : { usedMs: c.usedMs + (at - c.runningSince), runningSince: null }
          : c.runningSince === null
            ? { ...c, runningSince: at }
            : c,
      );
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase]);

  const start = (next: Word[]) => {
    const at = clockNow();
    ended.current = false;
    setPool(next);
    setQueue(shuffled(next));
    setOutcomes([]);
    setStreak(0);
    setBestStreak(0);
    setInput("");
    setShake(false);
    setNewBest(false);
    setClock({ usedMs: 0, runningSince: at });
    setNow(at);
    setPhase("playing");
    focusInput();
  };

  const advance = (kind: Outcome["kind"]) => {
    if (!word) return;
    setOutcomes((o) => [...o, { word, kind }]);
    const nextStreak = kind === "skipped" ? 0 : streak + 1;
    setStreak(nextStreak);
    setBestStreak((b) => Math.max(b, nextStreak));
    setQueue((q) => nextQueue(q, pool));
    setInput("");
    if (kind !== "skipped" && prefs.speak && canSpeak) speakCzech(word.cs, prefs.speechRate);
  };

  // An exactly right answer moves on as soon as it's typed.
  const onInput = (value: string) => {
    if (word && checkAnswer(value, word) === "correct") advance("correct");
    else setInput(value);
  };

  const submit = () => {
    if (!word || !input.trim()) return;
    const r = checkAnswer(input, word);
    if (r === "wrong") {
      setStreak(0);
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
      return;
    }
    advance(r);
  };

  const insert = (ch: string) => {
    const el = inputRef.current;
    const from = el?.selectionStart ?? input.length;
    const to = el?.selectionEnd ?? input.length;
    onInput(input.slice(0, from) + ch + input.slice(to));
    window.requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(from + ch.length, from + ch.length);
    });
  };

  const title = t("review.speedTyping");

  if (phase === "done") {
    const slips = [...new Map(outcomes.filter((o) => o.kind !== "correct").map((o) => [o.word.id, o.word])).values()];
    const answered = outcomes.length;
    return (
      <div className="container-page pb-16 pt-3 sm:pt-4">
        <ModeBar title={title} backHref={backHref} />
        <SessionDone
          result={t("review.speedResult", { words: t("common.words", { n: score }), time: durationLabel(duration) })}
          extra={
            <div className="reveal mt-4 flex flex-col items-center gap-3" style={{ "--i": 5 } as React.CSSProperties}>
              {newBest && <span className="pop-in chip chip-solid">{t("game.newBest")}</span>}
              <dl className="grid w-full grid-cols-3 gap-2 text-center">
                {[
                  { label: t("review.pace"), value: String(wordsPerMinute(score, duration)) },
                  { label: t("review.bestStreak"), value: String(bestStreak) },
                  { label: t("game.accuracy"), value: `${answered ? Math.round((score / answered) * 100) : 0}%` },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-surface px-1 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{s.label}</dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums">{s.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-muted">{t("review.best", { n: Math.max(best, score) })}</p>
            </div>
          }
          missed={slips}
          lang={lang}
          backHref={backHref}
          onRestart={() => start(words)}
          onPractiseMissed={() => start(slips)}
        />
      </div>
    );
  }

  if (phase === "ready" || !word) {
    return (
      <div className="container-page pb-16 pt-3 sm:pt-4">
        <ModeBar title={title} backHref={backHref} />
        <div className="panel pop-in mx-auto mt-6 flex max-w-xl flex-col items-center px-6 py-10 text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-invert text-invert-fg">
            <Icon name="bolt" size={30} />
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight">{t("review.ready")}</h2>
          <p className="mt-2 max-w-md text-muted">{t("review.speedRules")}</p>
          <div className="segmented mt-6" role="group" aria-label={t("review.speedDuration")}>
            {SPEED_DURATIONS.map((s) => (
              <button key={s} type="button" aria-pressed={s === duration} onClick={() => setDuration(s)}>
                {durationLabel(s)}
              </button>
            ))}
          </div>
          <p className="mt-3 h-5 text-sm text-muted">{best > 0 ? t("review.best", { n: best }) : ""}</p>
          <button type="button" className="btn btn-lg mt-4 min-w-48" onClick={() => start(pool)} autoFocus>
            {t("review.start")} <Icon name="arrow-right" size={18} />
          </button>
          <p className="mt-4 text-xs text-muted">{t("common.words", { n: pool.length })}</p>
        </div>
      </div>
    );
  }

  const recent = outcomes.slice(-3).reverse();
  const hurry = leftMs <= 10_000;

  return (
    <div className="container-page flex flex-col pb-12 pt-3 sm:pt-4">
      <ModeBar title={title} backHref={backHref}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhase("ready")}>
          {t("review.stop")}
        </button>
      </ModeBar>

      <div className="mx-auto mt-4 w-full max-w-xl">
        {/* Clock, score and streak */}
        <div className="flex items-end justify-between gap-4">
          <p
            className={`text-4xl font-bold tabular-nums tracking-tight transition-colors ${hurry ? "text-danger" : ""}`}
            aria-label={t("review.timeLeft")}
          >
            {formatTime(Math.ceil(leftMs / 1000) * 1000)}
          </p>
          <div className="flex items-center gap-4 text-right">
            <p>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">{t("game.score")}</span>
              <span key={score} className={`block text-2xl font-bold tabular-nums ${score > 0 ? "pop-in" : ""}`}>
                {score}
              </span>
            </p>
            <p>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">{t("daily.streak")}</span>
              <span className="flex items-center justify-end gap-1 text-2xl font-bold tabular-nums">
                {streak >= 3 && <Icon name="flame" size={18} />}
                {streak}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={leftMs} total={totalMs} label={t("review.timeLeft")} />
        </div>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div
            key={`${word.id}-${outcomes.length}`}
            className="panel rise relative flex min-h-40 flex-col items-center justify-center px-6 py-7 text-center"
          >
            <span className="absolute left-5 top-4 text-xs font-bold tracking-[0.08em] text-muted">{LANG_CODES[lang]}</span>
            <p className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl" lang={LANG_TAGS[lang]}>
              {word[lang]}
            </p>
            <p className="mt-3 whitespace-pre-wrap font-mono text-lg text-muted" aria-hidden="true">
              {pattern(word.cs)}
            </p>
          </div>

          <label className="sr-only" htmlFor="speed-answer">
            {t("review.typePrompt")}
          </label>
          <input
            ref={inputRef}
            id="speed-answer"
            className={`field mt-4 text-center text-xl font-semibold ${shake ? "input-shake border-danger" : ""}`}
            lang="cs"
            value={input}
            placeholder={t("review.typePrompt")}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                advance("skipped");
              }
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="done"
            autoFocus
          />

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

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              className="btn btn-outline"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                advance("skipped");
                focusInput();
              }}
            >
              {t("review.skip")}
            </button>
            <button type="submit" className="btn flex-1" disabled={!input.trim()}>
              {t("review.check")}
            </button>
          </div>
        </form>

        {/* The last few answers, newest first */}
        <ul className="mt-6 space-y-1.5" aria-live="polite">
          {recent.map((o, i) => (
            <li
              key={outcomes.length - i}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${i === 0 ? "rise bg-surface" : "opacity-60"}`}
            >
              <Icon name={o.kind === "skipped" ? "close" : "check"} size={16} />
              <span className="font-semibold" lang="cs">
                {o.word.cs}
              </span>
              <span className="min-w-0 flex-1 truncate text-muted" lang={LANG_TAGS[lang]}>
                {o.word[lang]}
              </span>
              {o.kind !== "correct" && (
                <span className="shrink-0 text-xs font-semibold text-muted">
                  {t(o.kind === "accents" ? "review.accentsShort" : "review.skipped")}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
