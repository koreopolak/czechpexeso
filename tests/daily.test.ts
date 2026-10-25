import { describe, expect, it } from "vitest";
import { DAILY_PAIRS } from "@/lib/config";
import { dailyChallenge } from "@/lib/decks";
import { SOURCE_LANGS } from "@/lib/types";

describe("dailyChallenge", () => {
  it("deals a full 6×6 board", () => {
    expect(DAILY_PAIRS).toBe(18);
    expect(dailyChallenge("2026-10-25").words).toHaveLength(18);
  });

  it("is the same for everyone on a date, and changes the next day", () => {
    const a = dailyChallenge("2026-10-25");
    const b = dailyChallenge("2026-10-25");
    expect(b.seed).toBe(a.seed);
    expect(b.words.map((w) => w.id)).toEqual(a.words.map((w) => w.id));
    expect(dailyChallenge("2026-10-26").words.map((w) => w.id)).not.toEqual(a.words.map((w) => w.id));
  });

  it("never shows cards of two different words that look alike", () => {
    for (const date of ["2026-01-01", "2026-06-15", "2026-10-25", "2027-02-28"]) {
      const owner = new Map<string, string>();
      for (const w of dailyChallenge(date).words) {
        for (const text of new Set([w.cs, ...SOURCE_LANGS.map((l) => w[l])].map((s) => s.toLowerCase()))) {
          expect(owner.get(text) ?? w.id, `"${text}" on ${date}`).toBe(w.id);
          owner.set(text, w.id);
        }
      }
    }
  });
});
