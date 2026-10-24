/**
 * Pure game logic for pexeso. No React, no DOM — easy to test (see tests/engine.test.ts).
 *
 * A board is a shuffled list of cards. Every word becomes two cards: the Czech
 * side and the translation side. They share a `pairId`.
 */
import { STAR_SECONDS } from "@/lib/config";
import { GRID_SIZES, pairsForGrid, type Word } from "@/lib/types";

export type CardSide = "cs" | "src";
export type Card = { key: string; pairId: string; side: CardSide };

export type GameStatus = "ready" | "playing" | "won";

export type GameState = {
  cards: Card[];
  /** Indexes of face-up cards that are not matched yet (0, 1 or 2 of them). */
  open: number[];
  /** pairIds already found. */
  found: string[];
  moves: number;
  mismatches: number;
  streak: number;
  bestStreak: number;
  points: number;
  status: GameStatus;
  /** Milliseconds played before the current running stretch (the timer pauses in background tabs). */
  elapsedMs: number;
  /** Timestamp when the clock last started running, or null while paused/stopped. */
  runningSince: number | null;
  lastMatch: string | null;
};

export type FlipEvent = "flip" | "match" | "mismatch" | "win" | null;

// ---------------------------------------------------------------------------
// Randomness (seedable, so the daily challenge is the same board for everyone)
// ---------------------------------------------------------------------------

/** Small, fast seeded PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash for strings (FNV-1a). */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Fisher–Yates shuffle. Returns a new array. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Picks `count` random words (or all of them if the deck is smaller). */
export function pickWords(words: readonly Word[], count: number, rng: () => number = Math.random): Word[] {
  return shuffle(words, rng).slice(0, Math.min(count, words.length));
}

export function buildCards(words: readonly Word[], rng: () => number = Math.random): Card[] {
  const cards: Card[] = words.flatMap((w) => [
    { key: `${w.id}:cs`, pairId: w.id, side: "cs" as const },
    { key: `${w.id}:src`, pairId: w.id, side: "src" as const },
  ]);
  return shuffle(cards, rng);
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

export function newGame(cards: Card[]): GameState {
  return {
    cards,
    open: [],
    found: [],
    moves: 0,
    mismatches: 0,
    streak: 0,
    bestStreak: 0,
    points: 0,
    status: "ready",
    elapsedMs: 0,
    runningSince: null,
    lastMatch: null,
  };
}

export const POINTS = { match: 100, streakBonus: 50, mismatch: 20 } as const;

/**
 * Turns card `index` face up and resolves the move.
 * Flipping a third card while a mismatched pair is still showing hides that
 * pair right away, so fast players never have to wait.
 */
export function flip(state: GameState, index: number, now: number): { state: GameState; event: FlipEvent } {
  const card = state.cards[index];
  if (!card || state.status === "won") return { state, event: null };
  if (state.found.includes(card.pairId)) return { state, event: null };

  const open = state.open.length === 2 ? [] : state.open;
  if (open.includes(index)) return { state, event: null };

  let next: GameState = { ...state, open };
  if (next.status === "ready") next = { ...next, status: "playing", runningSince: now, elapsedMs: 0 };

  if (open.length === 0) {
    return { state: { ...next, open: [index] }, event: "flip" };
  }

  // Second card of a move.
  const first = state.cards[open[0]];
  const moves = next.moves + 1;

  if (first.pairId === card.pairId) {
    const streak = next.streak + 1;
    const found = [...next.found, card.pairId];
    const points = next.points + POINTS.match + POINTS.streakBonus * (streak - 1);
    const won = found.length * 2 === next.cards.length;
    const matched: GameState = {
      ...next,
      open: [],
      found,
      moves,
      streak,
      bestStreak: Math.max(next.bestStreak, streak),
      points,
      lastMatch: card.pairId,
    };
    if (!won) return { state: matched, event: "match" };
    return { state: stopClock({ ...matched, status: "won" }, now), event: "win" };
  }

  return {
    state: {
      ...next,
      open: [open[0], index],
      moves,
      mismatches: next.mismatches + 1,
      streak: 0,
      points: Math.max(0, next.points - POINTS.mismatch),
    },
    event: "mismatch",
  };
}

/** Turns a shown mismatched pair face down again. */
export function hideMismatch(state: GameState): GameState {
  return state.open.length === 2 ? { ...state, open: [] } : state;
}

export function pauseClock(state: GameState, now: number): GameState {
  return stopClock(state, now);
}

export function resumeClock(state: GameState, now: number): GameState {
  if (state.status !== "playing" || state.runningSince !== null) return state;
  return { ...state, runningSince: now };
}

function stopClock(state: GameState, now: number): GameState {
  if (state.runningSince === null) return state;
  return { ...state, elapsedMs: state.elapsedMs + (now - state.runningSince), runningSince: null };
}

export function elapsed(state: GameState, now: number): number {
  return state.elapsedMs + (state.runningSince === null ? 0 : now - state.runningSince);
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

/** [3-star, 2-star] time limits in ms for a board with this many pairs (see STAR_SECONDS). */
export function starLimits(pairs: number): [number, number] {
  const grid = GRID_SIZES.find((g) => pairsForGrid(g) === pairs);
  // Unknown board sizes scale the 4×4 limits by the number of pairs.
  const [three, two] = grid ? STAR_SECONDS[grid] : STAR_SECONDS["4x4"].map((sec) => (sec * pairs) / 8);
  return [three * 1000, two * 1000];
}

/** Stars rate speed: finish under the 3-star limit for 3 stars, under the 2-star limit for 2. */
export function starsFor(timeMs: number, pairs: number): 1 | 2 | 3 {
  const [three, two] = starLimits(pairs);
  if (timeMs <= three) return 3;
  if (timeMs <= two) return 2;
  return 1;
}

/** Bonus for finishing faster than ~6 seconds per pair. Only with the timer on. */
export function timeBonus(pairs: number, ms: number): number {
  const seconds = Math.round(ms / 1000);
  return Math.max(0, pairs * 6 - seconds) * 10;
}

export function accuracy(pairs: number, moves: number): number {
  return moves === 0 ? 0 : Math.round((pairs / moves) * 100);
}

export type GameResult = {
  pairs: number;
  moves: number;
  mismatches: number;
  timeMs: number;
  stars: 1 | 2 | 3;
  score: number;
  accuracy: number;
  bestStreak: number;
  timed: boolean;
};

export function resultOf(state: GameState, timed: boolean): GameResult {
  const pairs = state.cards.length / 2;
  const timeMs = state.elapsedMs;
  return {
    pairs,
    moves: state.moves,
    mismatches: state.mismatches,
    timeMs,
    stars: starsFor(timeMs, pairs),
    score: state.points + (timed ? timeBonus(pairs, timeMs) : 0),
    accuracy: accuracy(pairs, state.moves),
    bestStreak: state.bestStreak,
    timed,
  };
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
