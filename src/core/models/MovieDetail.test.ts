import { describe, expect, it } from "vitest";
import { parseMovieDetail } from "./MovieDetail";

const raw = {
  id: 7, title: "T", overview: "O", backdrop_path: "/b.jpg", release_date: "2020-05-01", runtime: 101,
  vote_average: 7.3, genres: [{ id: 28, name: "Action" }], original_language: "hi",
  production_countries: [{ name: "India" }],
  credits: { cast: [{ id: 1, name: "A", character: "X", profile_path: "/p.jpg" }] },
  videos: { results: [{ type: "Teaser", site: "YouTube", key: "no" }, { type: "Trailer", site: "YouTube", key: "yes" }] },
  "watch/providers": {
    results: {
      IN: {
        link: "https://jw",
        flatrate: [{ provider_id: 2, provider_name: "B", logo_path: "/b", display_priority: 5 }, { provider_id: 1, provider_name: "A", logo_path: "/a", display_priority: 1 }],
        rent: [{ provider_id: 3, provider_name: "R", logo_path: null, display_priority: 2 }],
        buy: [{ provider_id: 3, provider_name: "R", logo_path: null, display_priority: 2 }],
      },
    },
  },
};

describe("parseMovieDetail", () => {
  it("parses the fields the card uses", () => {
    const d = parseMovieDetail(raw, "in");
    expect(d).toMatchObject({ id: 7, runtime: 101, trailerKey: "yes", countries: ["India"], originalLanguage: "hi" });
    expect(d.cast[0]).toEqual({ id: 1, name: "A", character: "X", profilePath: "/p.jpg" });
  });
  it("sorts providers by priority and de-duplicates rent/buy", () => {
    const p = parseMovieDetail(raw, "IN").providers!;
    expect(p.stream.map((x) => x.name)).toEqual(["A", "B"]);
    expect(p.rentOrBuy.map((x) => x.id)).toEqual([3]);
    expect(p.link).toBe("https://jw");
  });
  it("returns no providers for a region without data, and survives sparse input", () => {
    expect(parseMovieDetail(raw, "US").providers).toBeNull();
    expect(parseMovieDetail({ id: 1 }, "US")).toMatchObject({ title: "", cast: [], trailerKey: null, runtime: null });
  });
});
