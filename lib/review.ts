/**
 * Review (Premium): pure helpers for going over the words of recent games.
 * The UI lives in components/review/.
 */
import type { GameRecord } from "@/lib/progress";
import type { Word } from "@/lib/types";

export const REVIEW_MODES = ["radio", "flashcards", "typing"] as const;
export type ReviewMode = (typeof REVIEW_MODES)[number];

/** How many recent games to review: the choices offered on the Review page. */
export const REVIEW_SCOPES = [1, 5, 10, 30] as const;

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

/** Link to the Review page for the last `games` games, optionally straight into a mode. */
export function reviewHref(games: number, mode?: ReviewMode): string {
  return `/review?games=${games}${mode ? `&mode=${mode}` : ""}`;
}
