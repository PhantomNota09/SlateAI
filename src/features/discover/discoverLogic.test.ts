import { describe, expect, it } from "vitest";
import { normalizeTmdbResults, type Movie } from "../../core/models/Movie";
import { buildRows, freshFromPage, ROW_SIZE, type Lists } from "./discoverLogic";

const m = (id: number, backdrop: string | null = "/b.jpg"): Movie => ({
  id, title: `M${id}`, overview: "", posterPath: "/p.jpg", backdropPath: backdrop, releaseDate: "2020-01-01", voteAverage: 7, genreIds: [], originalLanguage: "en", runtime: null, matchPercentage: null, reasons: [],
});
const range = (from: number, n: number) => Array.from({ length: n }, (_, i) => m(from + i));
const empty = (): Lists => ({ trending: [], topRated: [], nowPlaying: [], upcoming: [] });

describe("buildRows", () => {
  it("drops excluded films and caps each row", () => {
    const { rows } = buildRows({ ...empty(), trending: range(1, 40) }, new Set([1, 2, 3]));
    expect(rows.trending).toHaveLength(ROW_SIZE);
    expect(rows.trending[0].id).toBe(4);
  });

  it("does not repeat a film in a later row", () => {
    const { rows } = buildRows({ trending: [m(1), m(2)], topRated: [m(2), m(3)], nowPlaying: [m(1), m(3), m(4)], upcoming: [m(4), m(5)] }, new Set());
    expect(rows.topRated.map((x) => x.id)).toEqual([3]);
    expect(rows.nowPlaying.map((x) => x.id)).toEqual([4]);
    expect(rows.upcoming.map((x) => x.id)).toEqual([5]);
  });

  it("keeps a film once when TMDb's pages repeat it inside one list", () => {
    const { rows } = buildRows({ ...empty(), trending: [m(1), m(2), m(1), m(3), m(2)] }, new Set());
    expect(rows.trending.map((x) => x.id)).toEqual([1, 2, 3]);
  });

  it("features the first unseen trending film with a backdrop", () => {
    const { featured } = buildRows({ ...empty(), trending: [m(1), m(2, null), m(3)] }, new Set([1]));
    expect(featured?.id).toBe(3);
    expect(buildRows({ ...empty(), trending: [m(2, null)] }, new Set()).featured?.id).toBe(2);
    expect(buildRows(empty(), new Set()).featured).toBeNull();
  });
});

describe("freshFromPage", () => {
  it("skips excluded and already-seen films and remembers what it returns", () => {
    const seen = new Set<number>([2]);
    expect(freshFromPage([m(1), m(2), m(3)], new Set([3]), seen).map((x) => x.id)).toEqual([1]);
    expect(seen.has(1)).toBe(true);
    expect(freshFromPage([m(1)], new Set(), seen)).toEqual([]);
  });
});

describe("normalizeTmdbResults", () => {
  it("maps TMDb's snake_case fields and drops unusable entries", () => {
    const out = normalizeTmdbResults({
      results: [
        { id: 1, title: "A", overview: "o", poster_path: "/p", backdrop_path: null, release_date: "", vote_average: 7.5, genre_ids: [18, "x"], original_language: "fr" },
        { id: "bad", title: "B" },
        { id: 3 },
        null,
      ],
    });
    expect(out).toEqual([{ id: 1, title: "A", overview: "o", posterPath: "/p", backdropPath: null, releaseDate: null, voteAverage: 7.5, genreIds: [18], originalLanguage: "fr", runtime: null, matchPercentage: null, reasons: [] }]);
    expect(normalizeTmdbResults(undefined)).toEqual([]);
  });
});
