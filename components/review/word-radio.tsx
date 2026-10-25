"use client";

/**
 * Word radio: plays the review words on a loop — Czech, translation, Czech
 * again, a pause, next word — like a "learn while you sleep" track. Uses the
 * device's speech voices; without a Czech voice it runs as a silent slideshow.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useI18n, usePrefs } from "@/components/providers";
import { ModeBar, type ModeProps } from "@/components/review/shared";
import { formatTime } from "@/lib/game/engine";
import { shuffled } from "@/lib/review";
import { speakAndWait, stopSpeaking, useCzechVoice } from "@/lib/speech";
import { LANG_CODES, LANG_TAGS, type SourceLang, type Word } from "@/lib/types";

type Phase = "cs" | "tr" | "idle";
const RATES = { slow: 0.7, normal: 0.95 } as const;
const SLEEP_MINUTES = [0, 15, 30, 60] as const;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Speaks, or (no voice for the language) waits about as long as speaking would take. */
async function say(text: string, lang: "cs" | SourceLang, rate: number) {
  if (!(await speakAndWait(text, lang, rate))) await wait((900 + text.length * 70) / rate);
}

export function WordRadio({ words, lang, backHref }: ModeProps) {
  const { t } = useI18n();
  const { prefs } = usePrefs();
  const voice = useCzechVoice();

  const [list, setList] = useState<Word[]>(words);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<keyof typeof RATES>(prefs.speechRate < 0.8 ? "slow" : "normal");
  const [sleepMinutes, setSleepMinutes] = useState<number>(0);
  const [sleepAt, setSleepAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Each play run gets a token; changing it (pause, skip, unmount) ends the old run.
  const run = useRef(0);
  const live = useRef({ list, speed, sleepAt });
  useEffect(() => {
    live.current = { list, speed, sleepAt };
  }, [list, speed, sleepAt]);

  const stop = useCallback(() => {
    run.current++;
    stopSpeaking();
    setPlaying(false);
    setPhase("idle");
  }, []);

  const playFrom = useCallback(
    async (from: number) => {
      const token = ++run.current;
      const stale = () => run.current !== token;
      setPlaying(true);
      for (let i = from; ; i = (i + 1) % live.current.list.length) {
        const { list: words, speed: s, sleepAt: until } = live.current;
        if (until !== null && Date.now() >= until) {
          stop();
          setSleepAt(null);
          setSleepMinutes(0);
          return;
        }
        const w = words[i % words.length];
        const rate = RATES[s];
        setIndex(i % words.length);
        setPhase("cs");
        await say(w.cs, "cs", rate);
        if (stale()) return;
        await wait(700);
        if (stale()) return;
        setPhase("tr");
        await say(w[lang], lang, rate);
        if (stale()) return;
        await wait(700);
        if (stale()) return;
        setPhase("cs");
        await say(w.cs, "cs", rate);
        if (stale()) return;
        setPhase("idle");
        await wait(2200);
        if (stale()) return;
      }
    },
    [lang, stop],
  );

  // Stop talking when leaving the page.
  useEffect(() => () => stop(), [stop]);

  // Sleep timer countdown (display only; the loop checks the deadline between words).
  useEffect(() => {
    if (sleepAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sleepAt]);

  const toggle = useCallback(() => (playing ? stop() : void playFrom(index)), [index, playFrom, playing, stop]);

  const jump = useCallback(
    (to: number) => {
      const next = (to + list.length) % list.length;
      setIndex(next);
      if (playing) void playFrom(next);
      else setPhase("idle");
    },
    [list.length, playFrom, playing],
  );

  // Space plays and pauses, arrows skip.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || el.closest("input, select, textarea")) return;
      if (e.key === " " && !el.closest("button, a")) {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowLeft") jump(index - 1);
      else if (e.key === "ArrowRight") jump(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, jump, toggle]);

  const toggleShuffle = () => {
    const current = list[index];
    const next = shuffleOn ? words : [current, ...shuffled(words.filter((w) => w.id !== current.id))];
    setShuffleOn(!shuffleOn);
    setList(next);
    const at = next.findIndex((w) => w.id === current.id);
    setIndex(at);
    live.current = { ...live.current, list: next };
    if (playing) void playFrom(at);
  };

  const pickSleep = useCallback((minutes: number) => {
    const at = Date.now();
    setSleepMinutes(minutes);
    setSleepAt(minutes ? at + minutes * 60_000 : null);
    setNow(at);
  }, []);

  const word = list[index];
  const left = sleepAt !== null ? Math.max(0, sleepAt - now) : 0;

  return (
    <div className="container-page flex flex-col pb-12 pt-3 sm:pt-4">
      <ModeBar title={t("review.radio")} backHref={backHref}>
        <span className="text-sm tabular-nums text-muted">{t("review.position", { n: index + 1, total: list.length })}</span>
      </ModeBar>

      {(voice.status === "missing" || voice.status === "unsupported") && (
        <p className="mx-auto mt-4 max-w-xl rounded-2xl bg-surface px-4 py-3 text-sm text-muted">
          {voice.status === "missing" ? t("settings.voiceMissing") : t("settings.voiceUnsupported")} {t("review.silent")}
        </p>
      )}

      {/* Now playing */}
      <section
        className="relative mx-auto mt-6 flex w-full max-w-xl flex-col items-center overflow-hidden rounded-3xl bg-invert px-6 pb-8 pt-10 text-center text-invert-fg sm:pt-12"
        aria-live="polite"
      >
        <div className="flex h-5 items-end gap-1" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((b) => (
            <span key={b} className="radio-bar w-1 rounded-full bg-invert-fg" data-on={playing} style={{ "--b": b } as React.CSSProperties} />
          ))}
        </div>
        <p key={`${word.id}-cs`} className="rise mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl" lang={LANG_TAGS.cs}>
          <span className={`transition-opacity duration-300 ${phase === "tr" ? "opacity-45" : ""}`}>{word.cs}</span>
        </p>
        <p
          key={`${word.id}-tr`}
          className="rise mt-3 text-xl sm:text-2xl"
          lang={LANG_TAGS[lang]}
          style={{ animationDelay: "0.08s" }}
        >
          <span className={`transition-opacity duration-300 ${phase === "tr" ? "" : "opacity-60"}`}>{word[lang]}</span>
        </p>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] opacity-55">
          CS · {LANG_CODES[lang]}
        </p>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            className="grid size-12 place-items-center rounded-full transition-colors hover:bg-invert-fg/10"
            onClick={() => jump(index - 1)}
            aria-label={t("review.prev")}
            title={t("review.prev")}
          >
            <Icon name="prev" size={22} />
          </button>
          <button
            type="button"
            className="grid size-18 place-items-center rounded-full bg-invert-fg text-invert transition-transform duration-300 ease-[var(--ease-spring)] hover:scale-105 active:scale-95"
            onClick={toggle}
            aria-label={playing ? t("review.pause") : t("review.play")}
            aria-pressed={playing}
          >
            <Icon name={playing ? "pause" : "play"} size={28} filled={!playing} />
          </button>
          <button
            type="button"
            className="grid size-12 place-items-center rounded-full transition-colors hover:bg-invert-fg/10"
            onClick={() => jump(index + 1)}
            aria-label={t("review.next")}
            title={t("review.next")}
          >
            <Icon name="next" size={22} />
          </button>
        </div>
      </section>

      {/* Options */}
      <div className="mx-auto mt-6 flex w-full max-w-xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="segmented" role="group" aria-label={t("review.speed")}>
            <button type="button" aria-pressed={speed === "slow"} onClick={() => setSpeed("slow")}>
              {t("settings.rateSlow")}
            </button>
            <button type="button" aria-pressed={speed === "normal"} onClick={() => setSpeed("normal")}>
              {t("settings.rateNormal")}
            </button>
          </div>
          <button type="button" className={`btn btn-sm ${shuffleOn ? "" : "btn-outline"}`} aria-pressed={shuffleOn} onClick={toggleShuffle}>
            <Icon name="shuffle" size={16} /> {t("review.shuffle")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Icon name="moon" size={18} /> {t("review.sleep")}
          </span>
          <div className="segmented" role="group" aria-label={t("review.sleep")}>
            {SLEEP_MINUTES.map((m) => (
              <button key={m} type="button" aria-pressed={sleepMinutes === m} onClick={() => pickSleep(m)}>
                {m ? t("review.minutes", { n: m }) : t("review.sleepOff")}
              </button>
            ))}
          </div>
          {sleepAt !== null && (
            <span className="text-sm tabular-nums text-muted">{t("review.sleepLeft", { time: formatTime(left) })}</span>
          )}
        </div>
        <p className="text-sm text-muted">{t("review.radioHint")}</p>
      </div>

      {/* Playlist */}
      <section className="mx-auto mt-8 w-full max-w-xl" aria-labelledby="playlist">
        <h2 id="playlist" className="text-sm font-semibold">
          {t("review.playlist")}
        </h2>
        <ol className="mt-2 divide-y divide-line border-y border-line">
          {list.map((w, i) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => jump(i)}
                aria-current={i === index ? "true" : undefined}
                className={`flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-surface ${i === index ? "" : "text-muted"}`}
              >
                <span className="w-7 shrink-0 text-xs tabular-nums">{i === index && playing ? <Icon name="speaker" size={14} /> : i + 1}</span>
                <span className={`min-w-0 flex-1 truncate ${i === index ? "font-semibold text-fg" : ""}`} lang={LANG_TAGS.cs}>
                  {w.cs}
                </span>
                <span className="min-w-0 truncate text-sm" lang={LANG_TAGS[lang]}>
                  {w[lang]}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
