import { describe, expect, it } from "vitest";
import { LIMITS } from "@/lib/config";
import { emptyProgress, markWordsPlayed, mergeProgress, parseProgress, recordGame, recordSpeed, type GameRecord } from "@/lib/progress";
import {
  allPlayedWordIds,
  checkAnswer,
  DEFAULT_SCOPE,
  fitGrid,
  normalizeAnswer,
  parseScope,
  PEXESO_MIN_WORDS,
  recentWordIds,
  requeue,
  reviewHref,
  stripDiacritics,
  WORD_ID,
  wordsPerMinute,
} from "@/lib/review";

let n = 0;
function game(over: Partial<GameRecord> = {}): GameRecord {
  n++;
  return {
    id: `r${n}`,
    deckId: "colors",
    lang: "en",
    grid: "4x3",
    pairs: 6,
    moves: 10,
    timeMs: 20_000,
    timed: true,
    stars: 3,
    score: 500,
    at: Date.UTC(2026, 9, 1) + n * 1000,
    ...over,
  };
}

describe("recentWordIds", () => {
  it("collects words from the newest games, without duplicates", () => {
    const history = [
      game({ words: ["colors.red", "colors.blue"] }),
      game({ words: ["colors.blue", "animals.dog"] }),
      game({ words: ["food.bread"] }),
    ];
    expect(recentWordIds(history, 2)).toEqual({ ids: ["colors.red", "colors.blue", "animals.dog"], games: 2 });
    expect(recentWordIds(history, 1).ids).toEqual(["colors.red", "colors.blue"]);
  });

  it("skips older games saved without words", () => {
    const history = [game(), game({ words: ["colors.red"] }), game()];
    expect(recentWordIds(history, 5)).toEqual({ ids: ["colors.red"], games: 1 });
  });
});

describe("word lists in history", () => {
  it("are kept only on the most recent games", () => {
    let p = emptyProgress();
    for (let i = 0; i < LIMITS.reviewGames + 3; i++) p = recordGame(p, game({ words: [`colors.w${i}`] })).progress;
    expect(p.history.filter((r) => r.words).length).toBe(LIMITS.reviewGames);
    expect(p.history[0].words).toEqual([`colors.w${LIMITS.reviewGames + 2}`]);
    expect(p.history.at(-1)?.words).toBeUndefined();
  });

  it("survive a merge with a copy of the same game that has none", () => {
    const g = game({ words: ["colors.red"] });
    const withWords = recordGame(emptyProgress(), g).progress;
    const without = recordGame(emptyProgress(), { ...g, words: undefined }).progress;
    expect(mergeProgress(withWords, without).history[0].words).toEqual(["colors.red"]);
    expect(mergeProgress(without, withWords).history[0].words).toEqual(["colors.red"]);
  });

  it("are validated when parsing", () => {
    const p = parseProgress({ v: 1, decks: {}, history: [game({ words: ["colors.red", 5, null] as unknown as string[] })] });
    expect(p?.history[0].words).toEqual(["colors.red"]);
    const q = parseProgress({ v: 1, decks: {}, history: [game({ words: "nope" as unknown as string[] })] });
    expect(q?.history[0]).not.toHaveProperty("words");
  });
});

describe("requeue", () => {
  it("moves the current card a few places back", () => {
    expect(requeue(["a", "b", "c", "d", "e", "f"], 3)).toEqual(["b", "c", "d", "a", "e", "f"]);
  });
  it("puts it last when the queue is short", () => {
    expect(requeue(["a", "b"], 4)).toEqual(["b", "a"]);
    expect(requeue(["a"], 4)).toEqual(["a"]);
    expect(requeue([], 4)).toEqual([]);
  });
});

describe("typing answers", () => {
  it("ignores case, punctuation and spacing", () => {
    expect(normalizeAnswer("  Dobrý   DEN! ")).toBe("dobrý den");
    expect(checkAnswer("sice ale", { cs: "sice..., ale" })).toBe("correct");
    expect(checkAnswer("Česko", { cs: "Česko" })).toBe("correct");
  });

  it("tells missing accents apart from wrong words", () => {
    expect(stripDiacritics("řeka žluťoučký")).toBe("reka zlutoucky");
    expect(checkAnswer("reka", { cs: "řeka" })).toBe("accents");
    expect(checkAnswer("rěka", { cs: "řeka" })).toBe("accents");
    expect(checkAnswer("ruka", { cs: "řeka" })).toBe("wrong");
    expect(checkAnswer("   ", { cs: "řeka" })).toBe("wrong");
  });

  it("accepts decomposed input (combining háček)", () => {
    expect(checkAnswer("řeka", { cs: "řeka" })).toBe("correct");
  });
});

describe("ids and links", () => {
  it("accepts only deck.word ids", () => {
    expect(WORD_ID.test("verbs-everyday.go-out")).toBe(true);
    expect(WORD_ID.test("colors")).toBe(false);
    expect(WORD_ID.test("colors.red.x")).toBe(false);
    expect(WORD_ID.test("../etc.passwd")).toBe(false);
  });
  it("builds review links", () => {
    expect(reviewHref(1)).toBe("/review?games=1");
    expect(reviewHref(5, "typing")).toBe("/review?games=5&mode=typing");
  });
});

describe("review scope: every word ever played", () => {
  it("parses ?games=", () => {
    expect(parseScope("all")).toBe("all");
    expect(parseScope("10")).toBe(10);
    expect(parseScope("7")).toBe(DEFAULT_SCOPE);
    expect(parseScope(undefined)).toBe(DEFAULT_SCOPE);
    expect(reviewHref("all", "speed")).toBe("/review?games=all&mode=speed");
  });

  it("collects every matched word from the deck word lists, qualified and without duplicates", () => {
    let p = emptyProgress();
    p = markWordsPlayed(p, "colors", ["red", "blue"]);
    p = markWordsPlayed(p, "animals", ["dog"]);
    p = markWordsPlayed(p, "colors", ["red"]);
    expect(allPlayedWordIds(p.decks).sort()).toEqual(["animals.dog", "colors.blue", "colors.red"]);
    expect(allPlayedWordIds({})).toEqual([]);
  });
});

describe("fitGrid", () => {
  it("keeps the preferred board when there are enough words, otherwise shrinks", () => {
    expect(fitGrid("6x6", 40)).toBe("6x6");
    expect(fitGrid("6x6", 12)).toBe("6x4");
    expect(fitGrid("6x6", 9)).toBe("4x4");
    expect(fitGrid("4x4", 100)).toBe("4x4");
    expect(fitGrid("6x6", PEXESO_MIN_WORDS)).toBe("4x3");
    expect(fitGrid("6x6", PEXESO_MIN_WORDS - 1)).toBeNull();
  });
});

describe("speed typing", () => {
  it("reports words per minute", () => {
    expect(wordsPerMinute(15, 30)).toBe(30);
    expect(wordsPerMinute(7, 60)).toBe(7);
    expect(wordsPerMinute(5, 120)).toBe(2.5);
    expect(wordsPerMinute(3, 0)).toBe(0);
  });

  it("keeps the best score per round length", () => {
    let r = recordSpeed(emptyProgress(), 60, 12);
    expect(r.best).toBe(true);
    r = recordSpeed(r.progress, 60, 9);
    expect(r.best).toBe(false);
    expect(r.progress.speedBest["60"]).toBe(12);
    r = recordSpeed(r.progress, 30, 5);
    expect(r.progress.speedBest).toEqual({ "60": 12, "30": 5 });
    expect(recordSpeed(emptyProgress(), 60, 0).best).toBe(false);
  });

  it("merges bests across devices and accepts saves without them", () => {
    const a = recordSpeed(emptyProgress(), 60, 12).progress;
    const b = recordSpeed(recordSpeed(emptyProgress(), 60, 15).progress, 120, 20).progress;
    expect(mergeProgress(a, b).speedBest).toEqual({ "60": 15, "120": 20 });

    const old = JSON.parse(JSON.stringify(emptyProgress()));
    delete old.speedBest;
    expect(parseProgress(old)?.speedBest).toEqual({});
    expect(parseProgress({ ...old, speedBest: { "60": 9, bad: 3, "30": "x" } })?.speedBest).toEqual({ "60": 9 });
  });
});
