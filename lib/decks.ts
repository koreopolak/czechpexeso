import "server-only";

/**
 * Server-side access to deck content; listings use the lighter DeckMeta.
 */
import { DECKS } from "@/data/decks";
import { DAILY_PAIRS, DAILY_TIME_ZONE } from "@/lib/config";
import { hashString, mulberry32, shuffle } from "@/lib/game/engine";
import { dayKey } from "@/lib/progress";
import { SOURCE_LANGS, type Deck, type DeckMeta, type Word } from "@/lib/types";

export function listDecks(): DeckMeta[] {
  return DECKS.map(({ words, ...meta }) => ({
    ...meta,
    wordCount: words.length,
    wordIds: words.map((w) => w.id),
    sample: words.slice(0, 3).map((w) => w.cs),
  }));
}

export function getDeck(id: string): Deck | undefined {
  return DECKS.find((d) => d.id === id);
}

export function deckIds(): string[] {
  return DECKS.map((d) => d.id);
}

/** The next deck in order, wrapping around. */
export function nextDeckId(id: string): string | undefined {
  const i = DECKS.findIndex((d) => d.id === id);
  if (DECKS.length < 2) return undefined;
  return DECKS[(i + 1) % DECKS.length].id;
}

export const TOTAL_DECK_COUNT = DECKS.length;

/** Today's date key in the daily challenge time zone. */
export function todayKey(now = new Date()): string {
  return dayKey(now, DAILY_TIME_ZONE);
}

/**
 * Builds the daily challenge: the same words and the same card order for
 * everyone on a given date. Words are drawn from all decks; we skip words whose
 * text collides with one already picked so no two cards look alike.
 */
export function dailyChallenge(date: string): { date: string; seed: number; words: Word[] } {
  const seed = hashString(`czechpexeso:${date}`);
  const rng = mulberry32(seed);
  const all = DECKS.flatMap((d) => d.words.map((w) => ({ ...w, id: `${d.id}.${w.id}` })));
  const used = new Set<string>();
  const words: Word[] = [];
  for (const w of shuffle(all, rng)) {
    const texts = [w.cs, ...SOURCE_LANGS.map((l) => w[l])].map((s) => s.toLocaleLowerCase());
    if (texts.some((t) => used.has(t))) continue;
    texts.forEach((t) => used.add(t));
    words.push(w);
    if (words.length === DAILY_PAIRS) break;
  }
  return { date, seed, words };
}
