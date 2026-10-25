"use client";

/**
 * The playable game: deals a board, handles flips, sounds, pronunciation,
 * the timer, saving results and the end-of-game screens.
 * Rendered only in the browser (see game-loader.tsx) because every board is a
 * random shuffle.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Board } from "@/components/game/board";
import { WinDialog } from "@/components/game/win-dialog";
import { WordList } from "@/components/game/word-list";
import { Icon } from "@/components/icons";
import { Modal } from "@/components/modal";
import { useEntitlement, useI18n, usePrefs } from "@/components/providers";
import { DAILY_GRID, FEATURES, LIMITS } from "@/lib/config";
import {
  buildCards,
  elapsed,
  flip,
  formatTime,
  hideMismatch,
  mulberry32,
  newGame,
  pauseClock,
  pickWords,
  resultOf,
  resumeClock,
  type GameResult,
  type GameState,
} from "@/lib/game/engine";
import { dailyStreak, gamesToday, type NewBests } from "@/lib/progress";
import { progressStore } from "@/lib/progress-store";
import { sfx, type SoundName } from "@/lib/sound";
import { fitGrid } from "@/lib/review";
import { speakCzech, useCzechVoice } from "@/lib/speech";
import { LANG_TAGS, pairsForGrid, type GridSize, type SourceLang, type Word } from "@/lib/types";

export type GameDeck = { id: string; title: Record<SourceLang | "cs", string>; words: Word[] };

type Props = {
  /** "review": a pexeso of Review words (Premium); word ids are "deck.word", like the daily's. */
  mode: "deck" | "daily" | "review";
  deck: GameDeck;
  /** Daily challenge only: date key and seed for a fixed card order. */
  daily?: { date: string; seed: number };
  nextHref?: string;
  /** Where the back arrow and "all decks" lead. */
  backHref?: string;
};

const BOTTOM_BAR = 84;
const MISMATCH_MS = 1100;

function dealRound(deck: GameDeck, grid: GridSize, daily?: { seed: number }) {
  const rng = daily ? mulberry32(daily.seed) : Math.random;
  const words = daily ? deck.words : pickWords(deck.words, pairsForGrid(grid), rng);
  return { words, game: newGame(buildCards(words, rng)) };
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function GameScreen({ mode, deck, daily, nextHref, backHref = "/play" }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const { prefs, sourceLang: lang, setPrefs } = usePrefs();
  const { premium } = useEntitlement();
  const voice = useCzechVoice();
  // A review board shrinks to fit when there are too few words for the usual size.
  const grid: GridSize = mode === "daily" ? DAILY_GRID : mode === "review" ? (fitGrid(prefs.grid, deck.words.length) ?? "4x3") : prefs.grid;

  const overLimit = useCallback(
    () => mode === "deck" && !premium && LIMITS.freeGamesPerDay > 0 && gamesToday(progressStore.get()) >= LIMITS.freeGamesPerDay,
    [mode, premium],
  );

  const [round, setRound] = useState(() => dealRound(deck, grid, daily));
  const [game, setGame] = useState<GameState>(round.game);
  const gameRef = useRef(game);
  const [now, setNow] = useState(() => Date.now());
  const [announce, setAnnounce] = useState("");
  const [showWords, setShowWords] = useState(false);
  const [limitHit, setLimitHit] = useState(overLimit);
  const [win, setWin] = useState<{ result: GameResult; bests: NewBests } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const timers = useRef<number[]>([]);

  const wordMap = useMemo(() => new Map(round.words.map((w) => [w.id, w])), [round.words]);

  const commit = useCallback((next: GameState) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const play = useCallback((name: SoundName) => prefs.sound && sfx[name](), [prefs.sound]);

  const startRound = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setShowWin(false);
    setWin(null);
    setAnnounce("");
    if (overLimit()) {
      setLimitHit(true);
      return;
    }
    const next = dealRound(deck, grid, daily);
    setRound(next);
    commit(next.game);
  }, [commit, daily, deck, grid, overLimit]);

  const finish = useCallback(
    (state: GameState) => {
      const result = resultOf(state, prefs.timer);
      const bests = progressStore.record({
        id: newId(),
        deckId: mode === "deck" ? deck.id : mode,
        lang,
        grid,
        pairs: result.pairs,
        moves: result.moves,
        timeMs: result.timeMs,
        timed: result.timed,
        stars: result.stars,
        score: result.score,
        at: Date.now(),
        daily: daily?.date,
        // For Review (daily ids are already "deck.word").
        words: round.words.map((w) => (mode === "deck" ? `${deck.id}.${w.id}` : w.id)),
      });
      setWin({ result, bests });
      later(() => setShowWin(true), 700);
    },
    [daily, deck.id, grid, lang, later, mode, prefs.timer, round.words],
  );

  const onFlip = useCallback(
    (index: number) => {
      if (limitHit) return;
      sfx.unlock();
      const { state, event } = flip(gameRef.current, index, Date.now());
      if (!event) return;
      commit(state);

      if (event === "flip") play("flip");
      if (event === "mismatch") {
        play("mismatch");
        setAnnounce(t("game.mismatch"));
        const movesAt = state.moves;
        later(() => {
          if (gameRef.current.moves === movesAt) commit(hideMismatch(gameRef.current));
        }, MISMATCH_MS);
      }
      if (event === "match" || event === "win") {
        const word = wordMap.get(state.lastMatch ?? "");
        play(event === "win" ? "win" : "match");
        if (word) {
          // Count the word as played for its deck (daily and review ids look like "deck.word").
          const [deckId, wordId] = mode === "deck" ? [deck.id, word.id] : word.id.split(".");
          progressStore.markWords(deckId, [wordId]);
          setAnnounce(t("game.matched", { cs: word.cs, tr: word[lang] }));
          if (prefs.speak) later(() => speakCzech(word.cs, prefs.speechRate), event === "win" ? 450 : 120);
        }
        if (event === "win") finish(state);
      }
    },
    [commit, deck.id, finish, lang, later, limitHit, mode, play, prefs.speak, prefs.speechRate, t, wordMap],
  );

  // Ticking clock (display only — the engine keeps exact time).
  useEffect(() => {
    if (game.status !== "playing" || !prefs.timer) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [game.status, prefs.timer]);

  // Pause the clock while the tab is in the background.
  useEffect(() => {
    const onVisibility = () => {
      const at = Date.now();
      commit(document.hidden ? pauseClock(gameRef.current, at) : resumeClock(gameRef.current, at));
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [commit]);

  const pairs = game.cards.length / 2;
  const last = game.lastMatch ? wordMap.get(game.lastMatch) : undefined;
  const timeMs = game.status === "playing" ? Math.max(0, elapsed(game, Math.max(now, game.runningSince ?? 0))) : game.elapsedMs;
  const title = mode === "daily" ? t("daily.title") : mode === "review" ? t("review.pexeso") : deck.title[lang];
  const streak = mode === "daily" && daily ? dailyStreak(progressStore.get(), daily.date) : 0;

  return (
    <div className="container-page flex flex-col pb-2 pt-3 sm:pt-4">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <Link href={backHref} className="btn btn-ghost btn-icon -ml-2" aria-label={t("game.decks")} title={t("game.decks")}>
          <Icon name="arrow-left" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold leading-tight sm:text-xl">
            <span lang="cs">{deck.title.cs}</span>
            {deck.title.cs !== title && <span className="font-normal text-muted"> · {title}</span>}
          </h1>
        </div>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowWords(true)} aria-label={t("game.words")} title={t("game.words")}>
          <Icon name="list" />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => setPrefs({ sound: !prefs.sound })}
          aria-pressed={prefs.sound}
          aria-label={prefs.sound ? t("game.soundOn") : t("game.soundOff")}
          title={prefs.sound ? t("game.soundOn") : t("game.soundOff")}
        >
          <Icon name={prefs.sound ? "speaker" : "mute"} />
        </button>
        <button type="button" className="btn btn-outline btn-sm hidden sm:inline-flex" onClick={startRound}>
          <Icon name="restart" size={16} />
          {t("game.newGame")}
        </button>
        <button type="button" className="btn btn-ghost btn-icon sm:hidden" onClick={startRound} aria-label={t("game.newGame")}>
          <Icon name="restart" />
        </button>
      </div>

      {/* Stats */}
      <dl className="mb-3 mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm sm:mb-4">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-muted">{t("game.moves")}</dt>
          <dd className="font-semibold tabular-nums">{game.moves}</dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-muted">{t("game.pairs")}</dt>
          <dd className="font-semibold tabular-nums">
            {game.found.length}/{pairs}
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-muted">{t("game.time")}</dt>
          <dd className="font-semibold tabular-nums">{prefs.timer ? formatTime(timeMs) : t("game.relaxed")}</dd>
        </div>
        {game.streak >= 2 && <span className="chip chip-solid">{t("game.streak", { n: game.streak })}</span>}
      </dl>

      <Board
        cards={game.cards}
        count={game.cards.length}
        words={wordMap}
        lang={lang}
        open={game.open}
        found={game.found}
        lastMatch={game.lastMatch}
        mismatch={game.open.length === 2}
        reserve={BOTTOM_BAR}
        onFlip={onFlip}
      />

      {/* Last match: the learning moment */}
      <div className="mt-3 flex min-h-14 items-center justify-center" aria-live="polite">
        {last ? (
          <div key={last.id} className="rise flex items-center gap-3 rounded-full border border-line py-1.5 pl-5 pr-1.5">
            <span className="text-base font-semibold sm:text-lg" lang="cs">
              {last.cs}
            </span>
            <span className="text-muted">—</span>
            <span className="text-base sm:text-lg" lang={LANG_TAGS[lang]}>
              {last[lang]}
            </span>
            {voice.status === "ready" ? (
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => speakCzech(last.cs, prefs.speechRate)}
                aria-label={`${t("common.listen")}: ${last.cs}`}
              >
                <Icon name="speaker" size={18} />
              </button>
            ) : (
              <span className="w-3" />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">{t("game.hint")}</p>
        )}
        <span className="sr-only">{announce}</span>
      </div>

      <Modal open={showWords} onClose={() => setShowWords(false)} title={t("game.words")} wide>
        <h2 className="pr-10 text-xl font-semibold">{t("game.words")}</h2>
        <p className="mt-1 text-sm text-muted">{title}</p>
        <div className="mt-4">
          <WordList words={round.words} lang={lang} />
        </div>
      </Modal>

      <WinDialog
        open={showWin}
        result={win?.result ?? null}
        bests={win?.bests ?? null}
        words={round.words}
        lang={lang}
        onPlayAgain={startRound}
        onClose={() => setShowWin(false)}
        nextHref={nextHref}
        backHref={backHref}
        extra={
          mode === "daily" && streak > 0 ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold">
              <Icon name="flame" size={18} /> {t("daily.streak")}: {t("common.days", { n: streak })}
            </p>
          ) : null
        }
      />

      <Modal open={limitHit} onClose={() => router.push("/play")} title={t("game.limitTitle")}>
        <div className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface">
            <Icon name="clock" size={26} />
          </div>
          <h2 className="mt-4 text-2xl font-semibold">{t("game.limitTitle")}</h2>
          <p className="mt-2 text-muted">
            {t(FEATURES.premiumForSale ? "game.limitText" : "game.limitTextFree", { n: LIMITS.freeGamesPerDay })}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            {FEATURES.premiumForSale && (
              <Link href="/pricing" className="btn">
                {t("game.limitCta")}
              </Link>
            )}
            <Link href="/daily" className={FEATURES.premiumForSale ? "btn btn-outline" : "btn"}>
              <Icon name="calendar" size={16} /> {t("game.limitDaily")}
            </Link>
            <Link href="/play" className="btn btn-ghost">
              {t("game.limitBack")}
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
