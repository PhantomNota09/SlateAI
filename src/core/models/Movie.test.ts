import { describe, expect, it } from "vitest";
import { matchInfoOf, normalizePool } from "./Movie";

const base = { id: 1, title: "T", overview: "", posterPath: null, backdropPath: null, releaseDate: null, voteAverage: 7, genreIds: [], originalLanguage: "en", runtime: 0 };

describe("normalizePool", () => {
  it("keeps valid match info", () => {
    const [m] = normalizePool([{ ...base, matchPercentage: 54.6, reasons: ["a", "b"] }]);
    expect(m.matchPercentage).toBe(55);
    expect(m.reasons).toEqual(["a", "b"]);
  });
  it("treats missing, null or wrong-typed scoring fields as no match info", () => {
    for (const extra of [{}, { matchPercentage: null }, { matchPercentage: "80", reasons: "nope" }, { matchPercentage: NaN }]) {
      const [m] = normalizePool([{ ...base, ...extra }]);
      expect(m.matchPercentage).toBeNull();
      expect(m.reasons).toEqual([]);
    }
  });
  it("clamps out-of-range scores, drops non-string reasons, and survives a non-array pool", () => {
    const [m] = normalizePool([{ ...base, matchPercentage: 140, reasons: ["ok", 5, null] }]);
    expect(m.matchPercentage).toBe(100);
    expect(m.reasons).toEqual(["ok"]);
    expect(normalizePool(undefined)).toEqual([]);
  });
});

describe("normalizePool onSelectedServices", () => {
  it("keeps the flag only when it is a boolean", () => {
    const pool = normalizePool([{ ...base, id: 1, onSelectedServices: true }, { ...base, id: 2, onSelectedServices: false }, { ...base, id: 3, onSelectedServices: "yes" }, { ...base, id: 4 }]);
    expect(pool.map((m) => m.onSelectedServices)).toEqual([true, false, undefined, undefined]);
    expect("onSelectedServices" in pool[3]).toBe(false);
  });
});

describe("matchInfoOf", () => {
  it("returns null without a score so the card is hidden", () => {
    const [none] = normalizePool([base]);
    expect(matchInfoOf(none)).toBeNull();
    const [some] = normalizePool([{ ...base, matchPercentage: 0, reasons: ["x"] }]);
    expect(matchInfoOf(some)).toEqual({ matchPercentage: 0, reasons: ["x"] }); // 0% is still a score
  });
});
