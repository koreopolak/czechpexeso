/**
 * Player progress: per-deck bests, game history and daily challenge results.
 * Pure functions here; persistence lives in lib/progress-store.ts.
 * The same JSON shape is stored in localStorage, exported to files and
 * synced to the `user_progress` table for Premium players.
 */
import { LIMITS } from "@/lib/config";
import type { GridSize, SourceLang } from "@/lib/types";

export type Stars = 0 | 1 | 2 | 3;

export type GameRecord = {
  id: string;
  /** Deck id, or "daily" for the daily challenge. */
  deckId: string;
  lang: SourceLang;
  grid: GridSize;
  pairs: number;
  moves: number;
  timeMs: number;
  /** Was the timer shown? Only timed games count for best times. */
  timed: boolean;
  stars: 1 | 2 | 3;
  score: number;
  /** Epoch milliseconds. */
  at: number;
  /** YYYY-MM-DD for daily challenges. */
  daily?: string;
  /** Words on the board as "deckId.wordId" (Review). Kept on the newest LIMITS.reviewGames games only. */
  words?: string[];
};

export type DeckStats = {
  plays: number;
  bestStars: Stars;
  bestScore: number;
  /** Keyed by grid size. */
  bestMoves: Partial<Record<GridSize, number>>;
  bestTimeMs: Partial<Record<GridSize, number>>;
  totalPairs: number;
  totalMoves: number;
  totalTimeMs: number;
  lastPlayed: number;
  /** Ids of every word ever matched in this deck (drives the deck progress bar). */
  words: string[];
};

export type DailyResult = { moves: number; timeMs: number; stars: 1 | 2 | 3; score: number; at: number };

export type Progress = {
  v: 1;
  decks: Record<string, DeckStats>;
  /** Newest first. */
  history: GameRecord[];
  daily: Record<string, DailyResult>;
  /** Finished games per local day, used for the free daily limit. */
  playsByDay: Record<string, number>;
  updatedAt: number;
};

export function emptyProgress(): Progress {
  return { v: 1, decks: {}, history: [], daily: {}, playsByDay: {}, updatedAt: 0 };
}

export function emptyDeckStats(): DeckStats {
  return { plays: 0, bestStars: 0, bestScore: 0, bestMoves: {}, bestTimeMs: {}, totalPairs: 0, totalMoves: 0, totalTimeMs: 0, lastPlayed: 0, words: [] };
}

/** YYYY-MM-DD in the given time zone (defaults to the device's zone). */
export function dayKey(date: Date = new Date(), timeZone?: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export type NewBests = { score: boolean; moves: boolean; time: boolean; stars: boolean };

/** Adds a finished game. Returns the new progress and which records were beaten. */
export function recordGame(p: Progress, rec: GameRecord): { progress: Progress; bests: NewBests } {
  const prev = p.decks[rec.deckId] ?? emptyDeckStats();
  const prevMoves = prev.bestMoves[rec.grid];
  const prevTime = prev.bestTimeMs[rec.grid];
  const bests: NewBests = {
    score: prev.plays > 0 && rec.score > prev.bestScore,
    moves: prevMoves !== undefined && rec.moves < prevMoves,
    time: rec.timed && prevTime !== undefined && rec.timeMs < prevTime,
    stars: prev.plays > 0 && rec.stars > prev.bestStars,
  };

  const stats: DeckStats = {
    plays: prev.plays + 1,
    bestStars: Math.max(prev.bestStars, rec.stars) as Stars,
    bestScore: Math.max(prev.bestScore, rec.score),
    bestMoves: { ...prev.bestMoves, [rec.grid]: Math.min(prevMoves ?? Infinity, rec.moves) },
    bestTimeMs: rec.timed ? { ...prev.bestTimeMs, [rec.grid]: Math.min(prevTime ?? Infinity, rec.timeMs) } : prev.bestTimeMs,
    totalPairs: prev.totalPairs + rec.pairs,
    totalMoves: prev.totalMoves + rec.moves,
    totalTimeMs: prev.totalTimeMs + rec.timeMs,
    lastPlayed: rec.at,
    words: prev.words,
  };

  const today = dayKey(new Date(rec.at));
  const daily = { ...p.daily };
  if (rec.daily) {
    // Only the first finish counts: the board is the same all day, so replays would be easy.
    if (!daily[rec.daily]) {
      daily[rec.daily] = { moves: rec.moves, timeMs: rec.timeMs, stars: rec.stars, score: rec.score, at: rec.at };
    }
  }

  return {
    progress: {
      ...p,
      decks: { ...p.decks, [rec.deckId]: stats },
      history: trimHistory([rec, ...p.history]),
      daily,
      // The daily challenge is free: it doesn't use up one of the day's free games.
      playsByDay: rec.daily ? p.playsByDay : pruneDays({ ...p.playsByDay, [today]: (p.playsByDay[today] ?? 0) + 1 }),
      updatedAt: Date.now(),
    },
    bests,
  };
}

/** Remembers that these words were matched. Returns the same object when nothing is new. */
export function markWordsPlayed(p: Progress, deckId: string, wordIds: string[]): Progress {
  const prev = p.decks[deckId] ?? emptyDeckStats();
  const fresh = wordIds.filter((id) => !prev.words.includes(id));
  if (fresh.length === 0) return p;
  return {
    ...p,
    decks: { ...p.decks, [deckId]: { ...prev, words: [...prev.words, ...fresh] } },
    updatedAt: Date.now(),
  };
}

/** How many of a deck's words have been played (ignores words since removed from the deck). */
export function wordsPlayed(p: Progress, deckId: string, deckWordIds?: readonly string[]): number {
  const ids = p.decks[deckId]?.words ?? [];
  return deckWordIds ? ids.filter((id) => deckWordIds.includes(id)).length : ids.length;
}

/** Caps the history (newest first) and drops word lists from games too old to review. */
function trimHistory(history: GameRecord[]): GameRecord[] {
  return history.slice(0, LIMITS.maxHistory).map((r, i) => {
    if (i < LIMITS.reviewGames || !r.words) return r;
    const old = { ...r };
    delete old.words;
    return old;
  });
}

function pruneDays(days: Record<string, number>): Record<string, number> {
  const keys = Object.keys(days).sort().slice(-7);
  return Object.fromEntries(keys.map((k) => [k, days[k]]));
}

export function gamesToday(p: Progress): number {
  return p.playsByDay[dayKey()] ?? 0;
}

/** Consecutive days with a finished daily challenge, ending today or yesterday. */
export function dailyStreak(p: Progress, today: string): number {
  let streak = 0;
  const d = new Date(`${today}T12:00:00Z`);
  if (!p.daily[today]) d.setUTCDate(d.getUTCDate() - 1);
  while (p.daily[d.toISOString().slice(0, 10)]) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}

export type Summary = {
  games: number;
  decksPlayed: number;
  threeStarDecks: number;
  accuracy: number;
  timeMs: number;
  pairs: number;
};

export function summarize(p: Progress, deckIds: string[]): Summary {
  let games = 0, decksPlayed = 0, threeStarDecks = 0, pairs = 0, moves = 0, timeMs = 0;
  for (const [id, s] of Object.entries(p.decks)) {
    games += s.plays;
    pairs += s.totalPairs;
    moves += s.totalMoves;
    timeMs += s.totalTimeMs;
    if (deckIds.includes(id) && s.plays > 0) decksPlayed++;
    if (deckIds.includes(id) && s.bestStars === 3) threeStarDecks++;
  }
  return { games, decksPlayed, threeStarDecks, accuracy: moves ? Math.round((pairs / moves) * 100) : 0, timeMs, pairs };
}

// ---------------------------------------------------------------------------
// Merging (two devices, or local + cloud)
// ---------------------------------------------------------------------------

function statsFromHistory(records: GameRecord[]): DeckStats {
  const s = emptyDeckStats();
  for (const r of records) {
    s.plays++;
    s.totalPairs += r.pairs;
    s.totalMoves += r.moves;
    s.totalTimeMs += r.timeMs;
    s.lastPlayed = Math.max(s.lastPlayed, r.at);
  }
  return s;
}

function mergeDeck(a: DeckStats | undefined, b: DeckStats | undefined, fromHistory: DeckStats): DeckStats {
  const x = a ?? emptyDeckStats();
  const y = b ?? emptyDeckStats();
  // Counters can't simply be added (both sides may contain the same games),
  // so take the most complete source and keep its totals consistent.
  const base = [x, y, fromHistory].reduce((m, s) => (s.plays > m.plays ? s : m));
  const grids = new Set([...Object.keys(x.bestMoves), ...Object.keys(y.bestMoves)]) as Set<GridSize>;
  const timeGrids = new Set([...Object.keys(x.bestTimeMs), ...Object.keys(y.bestTimeMs)]) as Set<GridSize>;
  const minOf = (u?: number, v?: number) => Math.min(u ?? Infinity, v ?? Infinity);
  return {
    plays: base.plays,
    totalPairs: base.totalPairs,
    totalMoves: base.totalMoves,
    totalTimeMs: base.totalTimeMs,
    bestStars: Math.max(x.bestStars, y.bestStars) as Stars,
    bestScore: Math.max(x.bestScore, y.bestScore),
    bestMoves: Object.fromEntries([...grids].map((g) => [g, minOf(x.bestMoves[g], y.bestMoves[g])])),
    bestTimeMs: Object.fromEntries([...timeGrids].map((g) => [g, minOf(x.bestTimeMs[g], y.bestTimeMs[g])])),
    lastPlayed: Math.max(x.lastPlayed, y.lastPlayed),
    words: [...new Set([...x.words, ...y.words])],
  };
}

export function mergeProgress(a: Progress, b: Progress): Progress {
  const byId = new Map<string, GameRecord>();
  for (const r of [...a.history, ...b.history]) {
    // Same game on both sides: don't lose its word list if one copy lacks it.
    const words = r.words ?? byId.get(r.id)?.words;
    byId.set(r.id, words ? { ...r, words } : r);
  }
  const history = trimHistory([...byId.values()].sort((m, n) => n.at - m.at));

  const deckIds = new Set([...Object.keys(a.decks), ...Object.keys(b.decks)]);
  const decks: Record<string, DeckStats> = {};
  for (const id of deckIds) {
    decks[id] = mergeDeck(a.decks[id], b.decks[id], statsFromHistory(history.filter((r) => r.deckId === id)));
  }

  const daily: Record<string, DailyResult> = { ...a.daily };
  for (const [k, v] of Object.entries(b.daily)) {
    if (!daily[k] || v.at < daily[k].at) daily[k] = v; // keep the first finish
  }

  const playsByDay: Record<string, number> = { ...a.playsByDay };
  for (const [k, v] of Object.entries(b.playsByDay)) playsByDay[k] = Math.max(playsByDay[k] ?? 0, v);

  return { v: 1, decks, history, daily, playsByDay: pruneDays(playsByDay), updatedAt: Math.max(a.updatedAt, b.updatedAt) };
}

function normalizeDecks(value: unknown): Record<string, DeckStats> {
  if (!value || typeof value !== "object") return {};
  // Older saves have no word list; fill in defaults so every field exists.
  return Object.fromEntries(
    Object.entries(value as Record<string, Partial<DeckStats>>).map(([id, s]) => [
      id,
      { ...emptyDeckStats(), ...s, words: Array.isArray(s?.words) ? s.words.filter((w) => typeof w === "string") : [] },
    ]),
  );
}

/** Accepts unknown JSON (imports, cloud rows) and returns valid progress or null. */
export function parseProgress(value: unknown): Progress | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<Progress>;
  if (v.v !== 1 || typeof v.decks !== "object" || !Array.isArray(v.history)) return null;
  const history = v.history
    .filter(
      (r): r is GameRecord =>
        !!r && typeof r.id === "string" && typeof r.deckId === "string" && typeof r.moves === "number" && typeof r.at === "number",
    )
    .map((r) => {
      if (r.words === undefined) return r;
      const { words, ...rest } = r;
      // A board has at most 18 pairs; anything else isn't ours.
      return Array.isArray(words) ? { ...rest, words: words.filter((w) => typeof w === "string").slice(0, 36) } : rest;
    });
  return {
    v: 1,
    decks: normalizeDecks(v.decks),
    history: trimHistory(history),
    daily: (v.daily && typeof v.daily === "object" ? v.daily : {}) as Record<string, DailyResult>,
    playsByDay: (v.playsByDay && typeof v.playsByDay === "object" ? v.playsByDay : {}) as Record<string, number>,
    updatedAt: typeof v.updatedAt === "number" ? v.updatedAt : 0,
  };
}
