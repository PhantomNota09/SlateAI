import { describe, expect, it } from "vitest";
import { REFILL_THRESHOLD, mergePool, needsRefill, removeMovie } from "./queueLogic";
import type { Movie } from "../../core/models/Movie";

const m = (id: number): Movie => ({
  id, title: `M${id}`, overview: "", posterPath: null, backdropPath: null,
  releaseDate: null, voteAverage: 7, genreIds: [], originalLanguage: "en", runtime: null, matchPercentage: null, reasons: [],
});

describe("queue rules", () => {
  it("removes a movie by id", () => {
    expect(removeMovie([m(1), m(2), m(3)], 2).map((x) => x.id)).toEqual([1, 3]);
  });

  it("refills only when short, idle, and not exhausted", () => {
    expect(needsRefill(REFILL_THRESHOLD - 1, false, false)).toBe(true);
    expect(needsRefill(REFILL_THRESHOLD, false, false)).toBe(false);
    expect(needsRefill(0, true, false)).toBe(false);
    expect(needsRefill(0, false, true)).toBe(false);
  });
});

describe("mergePool", () => {
  it("adds only new, non-excluded, non-skipped movies", () => {
    const r = mergePool([m(1)], [m(1), m(2), m(3), m(4)], new Set([3]), new Set([4]));
    expect(r.queue.map((x) => x.id)).toEqual([1, 2]);
    expect(r.skippedCleared).toBe(false);
  });

  it("lets skipped movies reappear when nothing else is left", () => {
    const r = mergePool([], [m(4), m(5)], new Set(), new Set([4, 5]));
    expect(r.queue.map((x) => x.id)).toEqual([4, 5]);
    expect(r.skippedCleared).toBe(true);
  });

  it("never re-adds excluded movies, even if that empties the result", () => {
    const r = mergePool([], [m(3)], new Set([3]), new Set([3]));
    expect(r.queue).toEqual([]);
    expect(r.added).toBe(0);
  });
});
