/**
 * Review (Premium): pure helpers for going over the words of recent games.
 * The UI lives in components/review/.
 */
import type { DeckStats, GameRecord } from "@/lib/progress";
import { GRID_SIZES, pairsForGrid, type GridSize, type Word } from "@/lib/types";

export const REVIEW_MODES = ["pexeso", "flashcards", "typing", "speed", "radio"] as const;
export type ReviewMode = (typeof REVIEW_MODES)[number];

/**
 * What to review: the words of the last 1, 5, 10 or 30 games, or "all" —
 * every word ever played. The choices offered on the Review page.
 */
export const REVIEW_SCOPES = [1, 5, 10, 30, "all"] as const;
export type ReviewScope = (typeof REVIEW_SCOPES)[number];
export const DEFAULT_SCOPE: ReviewScope = 5;

/** Reads the ?games= parameter: "all" or one of the numbers; anything else → the default. */
export function parseScope(value: unknown): ReviewScope {
  if (value === "all") return "all";
  const n = Number(value);
  return (REVIEW_SCOPES as readonly unknown[]).includes(n) ? (n as ReviewScope) : DEFAULT_SCOPE;
}

export function isReviewMode(v: unknown): v is ReviewMode {
  return typeof v === "string" && (REVIEW_MODES as readonly string[]).includes(v);
}

/** Matches a qualified word id: "deckId.wordId". */
export const WORD_ID = /^[a-z0-9-]+\.[a-z0-9-]+$/;

/**
 * Word ids from the newest `games` games that recorded their words, newest
 * game first, without duplicates. Older saves have no word lists and are skipped.
 */
export function recentWordIds(history: readonly GameRecord[], games: number): { ids: string[]; games: number } {
  const recent = history.filter((r) => r.words && r.words.length > 0).slice(0, games);
  return { ids: [...new Set(recent.flatMap((r) => r.words ?? []))], games: recent.length };
}

/**
 * Every word ever matched, as "deckId.wordId", from the per-deck word lists
 * that drive the deck progress bars (daily and review games file their words
 * under the word's own deck).
 */
export function allPlayedWordIds(decks: Readonly<Record<string, Pick<DeckStats, "words">>>): string[] {
  const ids = Object.entries(decks).flatMap(([deckId, s]) => s.words.map((w) => `${deckId}.${w}`));
  return [...new Set(ids)].filter((id) => WORD_ID.test(id));
}

/** Pexeso needs this many words for its smallest board (4×3). */
export const PEXESO_MIN_WORDS = pairsForGrid(GRID_SIZES[0]);

/**
 * The board for a review pexeso: the player's usual size, or the largest
 * smaller one that `available` words can fill. null when even 4×3 can't.
 */
export function fitGrid(preferred: GridSize, available: number): GridSize | null {
  const upTo = GRID_SIZES.slice(0, GRID_SIZES.indexOf(preferred) + 1);
  return [...upTo].reverse().find((g) => pairsForGrid(g) <= available) ?? null;
}

// ---------------------------------------------------------------------------
// Speed typing
// ---------------------------------------------------------------------------

/** Round lengths in seconds. */
export const SPEED_DURATIONS = [30, 60, 120] as const;
export type SpeedDuration = (typeof SPEED_DURATIONS)[number];

/** Correct words per minute, to one decimal. */
export function wordsPerMinute(correct: number, seconds: number): number {
  return seconds > 0 ? Math.round((correct / seconds) * 600) / 10 : 0;
}

/** Fisher–Yates shuffle (copy). */
export function shuffled<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Puts a missed word back into the queue a few cards later, so it comes up
 * again while still fresh but not immediately. `queue[0]` is the current card.
 */
export function requeue<T>(queue: readonly T[], gap = 4): T[] {
  if (queue.length === 0) return [];
  const [current, ...rest] = queue;
  const at = Math.min(gap, rest.length);
  return [...rest.slice(0, at), current, ...rest.slice(at)];
}

// ---------------------------------------------------------------------------
// Typing answers
// ---------------------------------------------------------------------------

/** Lower case, punctuation and extra spaces removed ("sice..., ale" → "sice ale"). */
export function normalizeAnswer(s: string): string {
  return s
    .normalize("NFC")
    .toLocaleLowerCase("cs")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");
}

/**
 * "correct": exactly right (ignoring case and punctuation).
 * "accents": right letters, but a háček or čárka is missing or wrong.
 */
export type AnswerCheck = "correct" | "accents" | "wrong";

export function checkAnswer(input: string, word: Pick<Word, "cs">): AnswerCheck {
  const given = normalizeAnswer(input);
  const expected = normalizeAnswer(word.cs);
  if (!given) return "wrong";
  if (given === expected) return "correct";
  if (stripDiacritics(given) === stripDiacritics(expected)) return "accents";
  return "wrong";
}

/** Letters with diacritics that a non-Czech keyboard usually lacks. */
export const CZECH_LETTERS = ["á", "č", "ď", "é", "ě", "í", "ň", "ó", "ř", "š", "ť", "ú", "ů", "ý", "ž"] as const;

/** Link to the Review page for a scope (last N games, or "all"), optionally straight into a mode. */
export function reviewHref(games: ReviewScope, mode?: ReviewMode): string {
  return `/review?games=${games}${mode ? `&mode=${mode}` : ""}`;
}
