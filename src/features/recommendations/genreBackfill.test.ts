import { describe, expect, it, vi } from "vitest";
import type { LetterboxdMovie } from "../../core/models/LetterboxdMovie";
import type { WatchedRecommendation } from "../../core/models/WatchedRecommendation";
import { findBackfillTargets, runGenreBackfill, tasteFieldsFromTmdb, type BackfillTarget } from "./genreBackfill";

const w = (movieId: number, rating: number, day: number, genreIds?: number[]): WatchedRecommendation => ({ movieId, title: "", posterPath: null, rating, watchedAt: new Date(2026, 0, day), ...(genreIds ? { genreIds } : {}) });
const l = (movieId: number, rating: number | null, day: number, genreIds?: number[]): LetterboxdMovie => ({ movieId, title: "", posterPath: null, letterboxdRating: rating, watchedDate: new Date(2026, 0, day), importedAt: new Date(0), ...(genreIds ? { genreIds } : {}) });

describe("findBackfillTargets", () => {
  it("picks rated films whose records lack genres, and ignores ones that have them or are unrated", () => {
    const t = findBackfillTargets([w(1, 4, 5), w(2, 4, 4, [18]), w(3, 0, 3)], [l(4, 3, 2), l(5, null, 1)]);
    expect(t).toEqual([
      { movieId: 1, inWatched: true, inLetterboxd: false },
      { movieId: 4, inWatched: false, inLetterboxd: true },
    ]);
  });

  it("fills both records when a film is in both and neither has genres", () => {
    expect(findBackfillTargets([w(1, 4, 5)], [l(1, 3, 4)])).toEqual([{ movieId: 1, inWatched: true, inLetterboxd: true }]);
  });

  it("only looks at the newest 300 rated films, since that is all the server reads", () => {
    const many = Array.from({ length: 350 }, (_, i) => w(i + 1, 4, 1 + (i % 28)));
    expect(findBackfillTargets(many, [])).toHaveLength(300);
  });

  it("skips films already marked unresolvable", () => {
    expect(findBackfillTargets([w(1, 4, 5), w(2, 4, 4)], [], new Set([1])).map((t) => t.movieId)).toEqual([2]);
  });
});

describe("tasteFieldsFromTmdb", () => {
  it("reads genres, language and year from a TMDb detail response", () => {
    expect(tasteFieldsFromTmdb({ genres: [{ id: 18 }, { id: 53 }, { id: "x" }], original_language: "ko", release_date: "2019-05-30" })).toEqual({ genreIds: [18, 53], originalLanguage: "ko", releaseYear: 2019 });
    expect(tasteFieldsFromTmdb(null)).toEqual({});
  });
});

describe("runGenreBackfill", () => {
  const targets: BackfillTarget[] = [1, 2, 3].map((movieId) => ({ movieId, inWatched: true, inLetterboxd: false }));
  const detail = (id: number) => ({ genres: [{ id: 18 }], original_language: "en", release_date: `${2000 + id}-01-01` });
  const base = { wait: async () => undefined };

  it("fetches each film once and writes its fields to the records that need them", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const fetchDetail = vi.fn(async (id: number) => detail(id));
    const r = await runGenreBackfill(targets, { ...base, fetchDetail, write });
    expect(fetchDetail).toHaveBeenCalledTimes(3);
    expect(write).toHaveBeenCalledWith(targets[1], { genreIds: [18], originalLanguage: "en", releaseYear: 2002 });
    expect(r).toEqual({ updated: 3, unresolved: [], stopped: false });
  });

  it("spaces requests out", async () => {
    const wait = vi.fn(async () => undefined);
    await runGenreBackfill(targets, { fetchDetail: async (id) => detail(id), write: async () => undefined, wait, spacingMs: 1000 });
    expect(wait).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledWith(1000);
  });

  it("notes films TMDb can't resolve and keeps going", async () => {
    const fetchDetail = vi.fn(async (id: number) => { if (id === 2) throw new Error("404"); return detail(id); });
    const r = await runGenreBackfill(targets, { ...base, fetchDetail, write: async () => undefined });
    expect(r.updated).toBe(2);
    expect(r.unresolved).toEqual([2]);
  });

  it("treats a response with no genres as unresolved rather than writing nothing useful", async () => {
    const write = vi.fn();
    const r = await runGenreBackfill([targets[0]], { ...base, fetchDetail: async () => ({ genres: [] }), write });
    expect(write).not.toHaveBeenCalled();
    expect(r.unresolved).toEqual([1]);
  });

  it("waits out a rate limit once, then retries", async () => {
    const wait = vi.fn(async () => undefined);
    let calls = 0;
    const fetchDetail = vi.fn(async (id: number) => { if (calls++ === 0) throw Object.assign(new Error("slow"), { code: "resource-exhausted" }); return detail(id); });
    const r = await runGenreBackfill([targets[0]], { wait, spacingMs: 0, fetchDetail, write: async () => undefined, isRateLimited: (e) => (e as { code?: string }).code === "resource-exhausted" });
    expect(wait).toHaveBeenCalledWith(20_000);
    expect(r.updated).toBe(1);
  });

  it("stops when signed out and when aborted", async () => {
    const out = await runGenreBackfill(targets, { ...base, fetchDetail: async () => { throw Object.assign(new Error("x"), { code: "unauthenticated" }); }, write: async () => undefined, isSignedOut: () => true });
    expect(out.stopped).toBe(true);
    expect(out.updated).toBe(0);

    const ctrl = new AbortController();
    const fetchDetail = vi.fn(async (id: number) => { ctrl.abort(); return detail(id); });
    const aborted = await runGenreBackfill(targets, { ...base, fetchDetail, write: async () => undefined, signal: ctrl.signal });
    expect(fetchDetail).toHaveBeenCalledTimes(1);
    expect(aborted).toMatchObject({ updated: 1, stopped: true });
  });
});
