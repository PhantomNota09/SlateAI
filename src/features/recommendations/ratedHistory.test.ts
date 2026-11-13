import { describe, expect, it } from "vitest";
import type { LetterboxdMovie } from "../../core/models/LetterboxdMovie";
import type { WatchedRecommendation } from "../../core/models/WatchedRecommendation";
import { buildRatedHistory, MAX_RATED_HISTORY } from "./ratedHistory";

const w = (movieId: number, rating: number, iso: string, extra: Partial<WatchedRecommendation> = {}): WatchedRecommendation => ({ movieId, title: "", posterPath: null, rating, watchedAt: new Date(iso), ...extra });
const l = (movieId: number, rating: number | null, iso: string | null, extra: Partial<LetterboxdMovie> = {}): LetterboxdMovie => ({
  movieId, title: "", posterPath: null, letterboxdRating: rating, watchedDate: iso ? new Date(iso) : null, importedAt: new Date("2026-01-01"), ...extra,
});

describe("buildRatedHistory", () => {
  it("sends rated films newest first, Slate and Letterboxd together", () => {
    const out = buildRatedHistory([w(1, 4, "2026-03-01"), w(2, 5, "2026-01-01")], [l(3, 3.5, "2026-02-01")]);
    expect(out.map((e) => e.movieId)).toEqual([1, 3, 2]);
  });

  it("leaves out unrated films, and anything outside 0.5–5", () => {
    const out = buildRatedHistory([w(1, 0, "2026-03-01"), w(2, 7, "2026-03-02")], [l(3, null, "2026-02-01"), l(4, 4, "2026-02-02")]);
    expect(out.map((e) => e.movieId)).toEqual([4]);
  });

  it("lets Slate's own rating win when a film is in both", () => {
    const out = buildRatedHistory([w(1, 5, "2026-03-01")], [l(1, 2, "2026-02-01")]);
    expect(out).toEqual([{ movieId: 1, rating: 5, genreIds: [] }]);
  });

  it("carries genres, language and year when known, and an empty genre list when not", () => {
    const out = buildRatedHistory([w(1, 4, "2026-03-01", { genreIds: [18, 53], originalLanguage: "ko", releaseYear: 2019 }), w(2, 4, "2026-02-01")], []);
    expect(out[0]).toEqual({ movieId: 1, rating: 4, genreIds: [18, 53], originalLanguage: "ko", releaseYear: 2019 });
    expect(out[1].genreIds).toEqual([]);
  });

  it("keeps only the newest 300", () => {
    const many = Array.from({ length: 450 }, (_, i) => w(i + 1, 4, new Date(2026, 0, 1, 0, i).toISOString()));
    const out = buildRatedHistory(many, []);
    expect(out).toHaveLength(MAX_RATED_HISTORY);
    expect(out[0].movieId).toBe(450);
  });

  it("uses the import date for a Letterboxd film with no watch date", () => {
    const out = buildRatedHistory([w(1, 4, "2025-01-01")], [l(2, 4, null)]);
    expect(out.map((e) => e.movieId)).toEqual([2, 1]);
  });
});
