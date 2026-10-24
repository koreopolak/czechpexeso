import { describe, expect, it } from "vitest";
import { DECKS } from "@/data/decks";
import {
  buildCards,
  elapsed,
  flip,
  hideMismatch,
  mulberry32,
  newGame,
  pauseClock,
  resultOf,
  resumeClock,
  shuffle,
  starLimits,
  starsFor,
} from "@/lib/game/engine";
import { fitBoard } from "@/lib/game/layout";
import { matchLocale } from "@/lib/i18n";
import { pairsForGrid, type Word } from "@/lib/types";

const words: Word[] = DECKS[0].words.slice(0, 4);

/** Index of the other card of the pair at `i`. */
function partner(cards: ReturnType<typeof buildCards>, i: number) {
  return cards.findIndex((c, j) => j !== i && c.pairId === cards[i].pairId);
}

describe("deal", () => {
  it("makes two cards per word, one of each side", () => {
    const cards = buildCards(words, mulberry32(1));
    expect(cards).toHaveLength(8);
    for (const w of words) {
      const pair = cards.filter((c) => c.pairId === w.id);
      expect(pair.map((c) => c.side).sort()).toEqual(["cs", "src"]);
    }
  });

  it("is deterministic with a seed (daily challenge)", () => {
    expect(buildCards(words, mulberry32(42))).toEqual(buildCards(words, mulberry32(42)));
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(7))).toEqual(shuffle([1, 2, 3, 4, 5], mulberry32(7)));
  });
});

describe("flip", () => {
  it("matches a pair and wins when all are found", () => {
    let s = newGame(buildCards(words.slice(0, 1), mulberry32(3)));
    let r = flip(s, 0, 1000);
    expect(r.event).toBe("flip");
    expect(r.state.status).toBe("playing");
    r = flip(r.state, 1, 5000);
    expect(r.event).toBe("win");
    s = r.state;
    expect(s.status).toBe("won");
    expect(s.moves).toBe(1);
    expect(s.elapsedMs).toBe(4000);
  });

  it("counts a mismatch and hides it", () => {
    const cards = buildCards(words, mulberry32(5));
    const a = 0;
    const b = cards.findIndex((c) => c.pairId !== cards[a].pairId);
    let r = flip(newGame(cards), a, 0);
    r = flip(r.state, b, 10);
    expect(r.event).toBe("mismatch");
    expect(r.state.open).toEqual([a, b]);
    expect(r.state.mismatches).toBe(1);
    expect(hideMismatch(r.state).open).toEqual([]);
  });

  it("a third flip hides a shown mismatch immediately", () => {
    const cards = buildCards(words, mulberry32(9));
    const a = 0;
    const b = cards.findIndex((c) => c.pairId !== cards[a].pairId);
    const c = cards.findIndex((x, i) => i !== a && i !== b);
    let r = flip(newGame(cards), a, 0);
    r = flip(r.state, b, 0);
    r = flip(r.state, c, 0);
    expect(r.event).toBe("flip");
    expect(r.state.open).toEqual([c]);
  });

  it("ignores found cards and the same card twice", () => {
    const cards = buildCards(words, mulberry32(11));
    let r = flip(newGame(cards), 0, 0);
    expect(flip(r.state, 0, 0).event).toBeNull();
    r = flip(r.state, partner(cards, 0), 0);
    expect(r.event).toBe("match");
    expect(flip(r.state, 0, 0).event).toBeNull();
  });

  it("gives streak bonuses and reports a result", () => {
    const cards = buildCards(words, mulberry32(13));
    let s = newGame(cards);
    const done = new Set<number>();
    for (let i = 0; i < cards.length; i++) {
      if (done.has(i)) continue;
      const j = partner(cards, i);
      s = flip(s, i, 0).state;
      s = flip(s, j, 0).state;
      done.add(i).add(j);
    }
    expect(s.status).toBe("won");
    expect(s.bestStreak).toBe(4);
    expect(s.points).toBe(100 + 150 + 200 + 250);
    const res = resultOf(s, false);
    expect(res.stars).toBe(3);
    expect(res.accuracy).toBe(100);
  });
});

describe("clock", () => {
  it("pauses and resumes", () => {
    let s = flip(newGame(buildCards(words, mulberry32(1))), 0, 0).state;
    s = pauseClock(s, 1000);
    expect(elapsed(s, 50_000)).toBe(1000);
    s = resumeClock(s, 60_000);
    expect(elapsed(s, 61_000)).toBe(2000);
  });
});

describe("scoring", () => {
  it("awards stars by finish time, per board size", () => {
    // 4×4 (8 pairs): 3 stars up to 45 s, 2 stars up to 80 s.
    expect(starsFor(45_000, 8)).toBe(3);
    expect(starsFor(45_001, 8)).toBe(2);
    expect(starsFor(80_000, 8)).toBe(2);
    expect(starsFor(80_001, 8)).toBe(1);
    // Bigger boards get more time.
    expect(starsFor(100_000, 18)).toBe(3);
    expect(starsFor(100_000, 6)).toBe(1);
  });

  it("has increasing limits for bigger boards", () => {
    const sizes = [6, 8, 12, 18].map((p) => starLimits(p));
    for (let i = 1; i < sizes.length; i++) expect(sizes[i][0]).toBeGreaterThan(sizes[i - 1][0]);
    sizes.forEach(([three, two]) => expect(two).toBeGreaterThan(three));
  });
});

describe("layout", () => {
  it("fits every grid size on a phone and a desktop", () => {
    for (const g of ["4x3", "4x4", "6x4", "6x6"] as const) {
      const n = pairsForGrid(g) * 2;
      for (const [w, h] of [
        [343, 600],
        [1200, 700],
      ]) {
        const l = fitBoard(n, w, h);
        expect(l.cols * l.rows).toBe(n);
        expect(l.cols * l.cardW + (l.cols - 1) * l.gap).toBeLessThanOrEqual(w);
      }
    }
  });

  it("uses more columns on wide screens", () => {
    expect(fitBoard(24, 1200, 600).cols).toBeGreaterThan(fitBoard(24, 343, 640).cols);
  });
});

describe("i18n", () => {
  it("picks the interface language from Accept-Language", () => {
    expect(matchLocale("uk-UA,uk;q=0.9,en;q=0.8")).toBe("uk");
    expect(matchLocale("pl")).toBe("pl");
    expect(matchLocale("cs-CZ,cs;q=0.9,ru;q=0.5")).toBe("ru");
    expect(matchLocale("de-DE")).toBe("en");
    expect(matchLocale(null)).toBe("en");
  });
});
