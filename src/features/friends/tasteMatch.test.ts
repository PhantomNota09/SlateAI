import { describe, expect, it } from "vitest";
import type { WatchedRecommendation } from "../../core/models/WatchedRecommendation";
import { calculateTasteMatch } from "./tasteMatch";

const w = (movieId: number, rating: number): WatchedRecommendation => ({ movieId, title: "", posterPath: null, rating, watchedAt: new Date(0) });
const hist = (pairs: [number, number][]) => pairs.map(([id, r]) => w(id, r));
const stats = (topGenres: string[], avgRating: number) => ({ topGenres, avgRating });

describe("calculateTasteMatch", () => {
  it("scores identical taste at 100 as Cinematic Soulmates", () => {
    const h = hist([[1, 4], [2, 5], [3, 3], [4, 4]]);
    const m = calculateTasteMatch(h, h, stats(["Drama", "Crime"], 4), stats(["Drama", "Crime"], 4));
    expect(m.score).toBe(100);
    expect(m.label).toBe("Cinematic Soulmates");
    expect(m.sharedCount).toBe(4);
    expect(m.insights).toContain("You both gravitate toward Crime and Drama");
  });

  it("uses the no-overlap weights when under three films are shared", () => {
    // overlap 1/2 = 0.5, genres 1/1, style 1 → 0.45*0.5 + 0.4*1 + 0.15*1 = 0.775
    const m = calculateTasteMatch(hist([[1, 4], [2, 4]]), hist([[1, 4], [9, 4]]), stats(["Drama"], 4), stats(["Drama"], 4));
    expect(m.score).toBe(78);
    expect(m.label).toBe("Film Twins");
  });

  it("says when you share nothing", () => {
    const m = calculateTasteMatch(hist([[1, 4]]), hist([[2, 4]]), stats([], 3), stats(["Horror"], 3));
    expect(m.sharedCount).toBe(0);
    expect(m.insights).toEqual(["No overlap yet — discover what they've been watching"]);
    expect(m.label).toBe("Uncharted Territory");
  });

  it("notes when the same films get very different ratings", () => {
    const a = hist([[1, 5], [2, 5], [3, 5], [4, 5], [5, 5]]);
    const b = hist([[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]);
    const m = calculateTasteMatch(a, b, stats(["Drama"], 5), stats(["Comedy"], 1));
    expect(m.insights).toContain("You've both seen 5 of the same films");
    expect(m.insights).toContain("You've watched the same films but rarely agree on them");
  });

  it("returns at most three insights", () => {
    const h = hist(Array.from({ length: 12 }, (_, i) => [i + 1, 4.5] as [number, number]));
    const m = calculateTasteMatch(h, h, stats(["Drama", "Crime"], 4.5), stats(["Drama", "Crime"], 4.5));
    expect(m.insights.length).toBeLessThanOrEqual(3);
  });
});
