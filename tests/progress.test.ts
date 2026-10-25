import { describe, expect, it } from "vitest";
import {
  dailyStreak,
  emptyProgress,
  markWordsPlayed,
  mergeProgress,
  parseProgress,
  recordGame,
  summarize,
  wordsPlayed,
  type GameRecord,
} from "@/lib/progress";

let n = 0;
function game(over: Partial<GameRecord> = {}): GameRecord {
  n++;
  return {
    id: `g${n}`,
    deckId: "colors",
    lang: "en",
    grid: "4x4",
    pairs: 8,
    moves: 14,
    timeMs: 40_000,
    timed: true,
    stars: 3,
    score: 900,
    at: Date.UTC(2026, 9, 1) + n * 1000,
    ...over,
  };
}

describe("recordGame", () => {
  it("tracks bests per deck and grid", () => {
    let p = recordGame(emptyProgress(), game({ moves: 16, score: 700, stars: 2 })).progress;
    const r = recordGame(p, game({ moves: 12, score: 950, stars: 3, timeMs: 30_000 }));
    p = r.progress;
    expect(r.bests).toEqual({ score: true, moves: true, time: true, stars: true });
    expect(p.decks.colors.plays).toBe(2);
    expect(p.decks.colors.bestMoves["4x4"]).toBe(12);
    expect(p.decks.colors.bestTimeMs["4x4"]).toBe(30_000);
    expect(p.history[0].moves).toBe(12);
  });

  it("does not record best times for untimed games", () => {
    const p = recordGame(emptyProgress(), game({ timed: false, timeMs: 1000 })).progress;
    expect(p.decks.colors.bestTimeMs["4x4"]).toBeUndefined();
  });

  it("keeps only the first daily result", () => {
    let p = recordGame(emptyProgress(), game({ deckId: "daily", daily: "2026-10-01", score: 500 })).progress;
    p = recordGame(p, game({ deckId: "daily", daily: "2026-10-01", score: 999 })).progress;
    expect(p.daily["2026-10-01"].score).toBe(500);
  });

  it("doesn't count the daily challenge toward the free games of the day", () => {
    let p = recordGame(emptyProgress(), game()).progress;
    p = recordGame(p, game({ deckId: "daily", daily: "2026-10-01" })).progress;
    expect(Object.values(p.playsByDay)).toEqual([1]);
  });
});

describe("dailyStreak", () => {
  it("counts consecutive days ending today or yesterday", () => {
    const p = emptyProgress();
    for (const d of ["2026-10-20", "2026-10-21", "2026-10-22"]) p.daily[d] = { moves: 1, timeMs: 1, stars: 3, score: 1, at: 1 };
    expect(dailyStreak(p, "2026-10-22")).toBe(3);
    expect(dailyStreak(p, "2026-10-23")).toBe(3);
    expect(dailyStreak(p, "2026-10-24")).toBe(0);
  });
});

describe("mergeProgress", () => {
  it("unions history and keeps the best of both devices", () => {
    const shared = game();
    const a = recordGame(recordGame(emptyProgress(), shared).progress, game({ moves: 20, score: 400 })).progress;
    const b = recordGame(recordGame(emptyProgress(), shared).progress, game({ moves: 10, score: 1200, deckId: "numbers" })).progress;
    const m = mergeProgress(a, b);
    expect(m.history).toHaveLength(3);
    expect(m.decks.colors.plays).toBe(2);
    expect(m.decks.numbers.bestScore).toBe(1200);
    expect(summarize(m, ["colors", "numbers"]).decksPlayed).toBe(2);
  });

  it("is idempotent", () => {
    const a = recordGame(emptyProgress(), game()).progress;
    expect(mergeProgress(a, a).decks).toEqual(a.decks);
  });
});

describe("words played", () => {
  it("counts each word once and survives recorded games", () => {
    let p = markWordsPlayed(emptyProgress(), "colors", ["red", "blue"]);
    p = markWordsPlayed(p, "colors", ["red"]);
    expect(wordsPlayed(p, "colors")).toBe(2);
    p = recordGame(p, game()).progress;
    expect(p.decks.colors.words).toEqual(["red", "blue"]);
    expect(wordsPlayed(p, "colors", ["red"])).toBe(1);
  });

  it("returns the same object when nothing is new", () => {
    const p = markWordsPlayed(emptyProgress(), "colors", ["red"]);
    expect(markWordsPlayed(p, "colors", ["red"])).toBe(p);
  });

  it("merges word lists from two devices", () => {
    const a = markWordsPlayed(emptyProgress(), "food", ["bread"]);
    const b = markWordsPlayed(emptyProgress(), "food", ["milk", "bread"]);
    expect(mergeProgress(a, b).decks.food.words.sort()).toEqual(["bread", "milk"]);
  });

  it("upgrades old saves without word lists", () => {
    const old = { v: 1, decks: { colors: { plays: 2, bestStars: 3 } }, history: [], daily: {}, playsByDay: {}, updatedAt: 1 };
    expect(parseProgress(old)?.decks.colors.words).toEqual([]);
  });
});

describe("parseProgress", () => {
  it("rejects junk and accepts exports", () => {
    expect(parseProgress(null)).toBeNull();
    expect(parseProgress({ hello: 1 })).toBeNull();
    const p = recordGame(emptyProgress(), game()).progress;
    expect(parseProgress(JSON.parse(JSON.stringify(p)))?.history).toHaveLength(1);
  });
});
