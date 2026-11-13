import { beforeEach, describe, expect, it, vi } from "vitest";

const tmdbProxy = vi.fn();
vi.mock("../../core/services/cloudFunctions", () => ({ tmdbProxy: (...a: unknown[]) => tmdbProxy(...a) }));

import { searchMovie } from "./tmdbSearch";

beforeEach(() => vi.clearAllMocks());

describe("searchMovie", () => {
  it("returns the top hit with its genres, language and release year from the same response", async () => {
    tmdbProxy.mockResolvedValue({ results: [{ id: 5, title: "Parasite", poster_path: "/p.jpg", genre_ids: [35, 53, 18], original_language: "ko", release_date: "2019-05-30" }] });
    expect(await searchMovie("Parasite", "2019")).toEqual({ id: 5, title: "Parasite", posterPath: "/p.jpg", genreIds: [35, 53, 18], originalLanguage: "ko", releaseYear: 2019 });
    expect(tmdbProxy).toHaveBeenCalledTimes(1); // no extra lookup for the genres
  });

  it("copes with a result that has none of them", async () => {
    tmdbProxy.mockResolvedValue({ results: [{ id: 6, title: "Obscure", poster_path: null }] });
    expect(await searchMovie("Obscure", null)).toEqual({ id: 6, title: "Obscure", posterPath: null });
  });

  it("returns null when nothing matches", async () => {
    tmdbProxy.mockResolvedValue({ results: [] });
    expect(await searchMovie("Nothing", null)).toBeNull();
  });
});
