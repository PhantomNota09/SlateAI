import { describe, expect, it } from "vitest";
import { combineHistory, parseFilmDetail, summarize, tasteBreakdown, type FilmDetail, type RatedFilm } from "./insightsLogic";

const film = (id: number, rating: number | null, iso: string): RatedFilm => ({ movieId: id, rating, at: new Date(iso) });

describe("combineHistory", () => {
  it("keeps Slate's version when a film is also imported", () => {
    const merged = combineHistory([film(1, 5, "2026-01-01")], [film(1, 2, "2025-01-01"), film(2, 3, "2025-01-01")]);
    expect(merged.map((f) => [f.movieId, f.rating])).toEqual([[1, 5], [2, 3]]);
  });
});

describe("summarize", () => {
  const now = new Date(2026, 5, 15);
  const films = [film(1, 4, "2026-06-02T12:00:00"), film(2, 4.5, "2026-06-09T12:00:00"), film(3, null, "2026-05-10T12:00:00"), film(4, 2.5, "2026-06-20T12:00:00")];

  it("averages only rated films and buckets them by half star", () => {
    const s = summarize(films, now);
    expect(s.total).toBe(4);
    expect(s.rated).toBe(3);
    expect(s.average).toBeCloseTo((4 + 4.5 + 2.5) / 3);
    expect(s.distribution.find((d) => d.rating === 4.5)?.count).toBe(1);
    expect(s.distribution.find((d) => d.rating === 1)?.count).toBe(0);
  });

  it("finds the busiest month and counts the last twelve months", () => {
    const s = summarize(films, now);
    expect(s.busiestMonth).toBe("June");
    expect(s.monthly).toHaveLength(12);
    expect(s.monthly[11].count).toBe(3); // June 2026
    expect(s.monthly[10].count).toBe(1); // May 2026
  });

  it("never reads a single evening as hundreds of films a week", () => {
    const burst = Array.from({ length: 30 }, (_, i) => film(i, 4, `2026-06-01T${String(i % 24).padStart(2, "0")}:00:00`));
    expect(summarize(burst, now).perWeek).toBeLessThanOrEqual(30);
  });

  it("copes with no films", () => {
    const s = summarize([], now);
    expect(s).toMatchObject({ total: 0, average: 0, perWeek: 0, busiestMonth: null });
  });
});

describe("tasteBreakdown", () => {
  const d = (id: number, names: string[], date: string, lang: string, runtime: number, vote: number): FilmDetail => ({
    id, genres: names.map((name, i) => ({ id: i, name })), releaseDate: date, language: lang, runtime, voteAverage: vote,
  });
  const details = [
    d(1, ["Drama", "Crime"], "1994-05-01", "en", 120, 8.5),
    d(2, ["Drama"], "1999-01-01", "ko", 100, 6.5),
    d(3, ["Comedy"], "2015-01-01", "en", 0, 6.0),
    d(4, ["Drama"], "1997-01-01", "fr", 140, 7.5),
  ];
  const ratings = new Map<number, number | null>([[1, 5], [2, 4.5], [3, 2], [4, 4]]);

  it("ranks genres and finds the favourite decade", () => {
    const t = tasteBreakdown(details, ratings);
    expect(t.topGenres[0]).toEqual({ name: "Drama", count: 3, percent: 75 });
    expect(t.favoriteDecade).toBe("1990s");
  });

  it("computes foreign share, runtime ignoring unknowns, and hidden gems", () => {
    const t = tasteBreakdown(details, ratings);
    expect(t.foreignPercent).toBe(50);
    expect(t.averageRuntime).toBe(120); // (120+100+140)/3
    expect(t.hiddenGems).toBe(1); // film 2: rated 4.5, TMDb 6.5
    expect(t.variety).toBe(Math.round((3 / 19) * 100));
  });

  it("is empty-safe", () => {
    expect(tasteBreakdown([], new Map()).sampled).toBe(0);
  });
});

describe("parseFilmDetail", () => {
  it("trims a TMDb payload and rejects junk", () => {
    expect(parseFilmDetail({ id: 5, genres: [{ id: 18, name: "Drama" }, { id: "x" }], release_date: "2001-02-03", original_language: "en", runtime: 99, vote_average: 7.1 })).toEqual({
      id: 5, genres: [{ id: 18, name: "Drama" }], releaseDate: "2001-02-03", language: "en", runtime: 99, voteAverage: 7.1,
    });
    expect(parseFilmDetail(null)).toBeNull();
    expect(parseFilmDetail({ id: "nope" })).toBeNull();
  });
});
