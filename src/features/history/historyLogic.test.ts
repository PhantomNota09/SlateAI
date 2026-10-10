import { describe, expect, it } from "vitest";
import type { LetterboxdMovie } from "../../core/models/LetterboxdMovie";
import type { WatchedRecommendation } from "../../core/models/WatchedRecommendation";
import { combineHistory, filterItems, formatStars, historyCounts } from "./historyLogic";

const w = (movieId: number, rating: number, iso: string, title = `S${movieId}`): WatchedRecommendation => ({ movieId, title, posterPath: null, rating, watchedAt: new Date(iso) });
const l = (movieId: number, rating: number | null, watched: string | null, title = `L${movieId}`): LetterboxdMovie => ({
  movieId, title, posterPath: `/l${movieId}.jpg`, letterboxdRating: rating, watchedDate: watched ? new Date(watched) : null, importedAt: new Date("2026-01-01"),
});

describe("combineHistory", () => {
  const items = combineHistory([w(1, 4, "2026-03-01"), w(2, 5, "2026-02-01")], [l(2, 3.5, "2024-05-05"), l(3, 4, "2025-06-06")]);

  it("merges a film in both sources, keeping Slate's title and filling a missing poster", () => {
    const both = items.find((i) => i.movieId === 2)!;
    expect(both).toMatchObject({ title: "S2", source: "both", slateRating: 5, letterboxdRating: 3.5, posterPath: "/l2.jpg" });
  });

  it("labels single-source films and sorts newest first", () => {
    expect(items.map((i) => [i.movieId, i.source])).toEqual([[1, "slate"], [2, "both"], [3, "letterboxd"]]);
  });

  it("uses the import date when a Letterboxd film has no watched date", () => {
    const [item] = combineHistory([], [l(9, 3, null)]);
    expect(item.date.getTime()).toBe(new Date("2026-01-01").getTime());
  });

  it("treats an unrated Slate record as having no rating", () => {
    expect(combineHistory([w(1, 0, "2026-01-01")], [])[0].slateRating).toBeNull();
  });
});

describe("filters and counts", () => {
  const items = combineHistory([w(1, 4, "2026-03-01"), w(2, 5, "2026-02-01")], [l(2, 3.5, "2024-05-05"), l(3, 4, "2025-06-06")]);

  it("Watched includes films also on Letterboxd, and Letterboxd includes films also on Slate", () => {
    expect(filterItems(items, "watched").map((i) => i.movieId)).toEqual([1, 2]);
    expect(filterItems(items, "letterboxd").map((i) => i.movieId)).toEqual([2, 3]);
    expect(filterItems(items, "all")).toHaveLength(3);
  });

  it("counts every tab", () => {
    expect(historyCounts(items, [])).toEqual({ all: 3, watched: 2, letterboxd: 2, dismissed: 0 });
  });
});

describe("formatStars", () => {
  it("renders half stars and nothing for no rating", () => {
    expect(formatStars(4.5)).toBe("★★★★½");
    expect(formatStars(3)).toBe("★★★");
    expect(formatStars(null)).toBe("");
  });
});
