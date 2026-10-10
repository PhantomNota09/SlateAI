import { describe, expect, it, vi } from "vitest";
import type { LetterboxdCSVEntry } from "./csvParser";
import { estimateMinutes, runImport, type TmdbMatch } from "./importRunner";

const entry = (title: string, year: string | null = "2000", rating: number | null = 4): LetterboxdCSVEntry => ({ title, year, rating, uri: "", date: null });
const movies: Record<string, TmdbMatch> = {
  Heat: { id: 1, title: "Heat", posterPath: "/h.jpg" },
  Alien: { id: 2, title: "Alien", posterPath: null },
};
const search = vi.fn(async (title: string) => movies[title] ?? null);
const base = { search, wait: async () => undefined, now: () => new Date(0) };

describe("runImport", () => {
  it("adds matched movies with rating, date and poster", async () => {
    search.mockClear();
    const r = await runImport({ ...base, entries: [entry("Heat", "1995", 4.5)], existingIds: new Set() });
    expect(r.added).toEqual([{ movieId: 1, title: "Heat", posterPath: "/h.jpg", letterboxdRating: 4.5, watchedDate: null, importedAt: new Date(0) }]);
    expect(r.processed).toBe(1);
  });

  it("skips movies already imported and rows repeated in the file, and lists unmatched ones", async () => {
    const r = await runImport({ ...base, entries: [entry("Heat"), entry("Heat", "2001"), entry("Alien"), entry("Nope", null)], existingIds: new Set([2]) });
    expect(r.added.map((m) => m.movieId)).toEqual([1]);
    expect(r.skipped).toBe(2);
    expect(r.failed).toEqual(["Nope (?)"]);
  });

  it("looks each title and year up once", async () => {
    search.mockClear();
    await runImport({ ...base, entries: [entry("Heat"), entry("Heat")], existingIds: new Set() });
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("counts a failed lookup as unmatched and keeps going", async () => {
    const flaky = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue(movies.Alien);
    const r = await runImport({ ...base, search: flaky, entries: [entry("A"), entry("B")], existingIds: new Set() });
    expect(r.failed).toEqual(["A (2000)"]);
    expect(r.added).toHaveLength(1);
  });

  it("returns what it has when cancelled", async () => {
    const ctrl = new AbortController();
    const r = await runImport({
      ...base,
      signal: ctrl.signal,
      entries: [entry("Heat"), entry("Alien")],
      existingIds: new Set(),
      onProgress: (n) => n === 1 && ctrl.abort(),
    });
    expect(r.cancelled).toBe(true);
    expect(r.added.map((m) => m.movieId)).toEqual([1]);
    expect(r.processed).toBe(1);
  });

  it("reports progress for every row", async () => {
    const onProgress = vi.fn();
    await runImport({ ...base, entries: [entry("Heat"), entry("Alien")], existingIds: new Set(), onProgress });
    expect(onProgress.mock.calls).toEqual([[1, 2], [2, 2]]);
  });
});

describe("estimateMinutes", () => {
  it("is at least a minute and grows with the library", () => {
    expect(estimateMinutes(10)).toBe(1);
    expect(estimateMinutes(1000)).toBe(10);
  });
});
