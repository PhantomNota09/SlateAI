import { describe, expect, it } from "vitest";
import {
  buildRecommendationRequest,
  pickEnginePreferences,
  sanitizeAvailabilityTypes,
  sanitizeProviderIds,
  sanitizeRegion,
} from "./recommendationPayload";
import type { UserCollections } from "../../core/services/userCollections";

const collections: UserCollections = {
  watched: [{ movieId: 1, title: "A", posterPath: null, rating: 4, watchedAt: new Date(0) }],
  dismissed: [{ movieId: 2, title: "B", posterPath: null, reason: "Too long", customReason: null, dismissedAt: new Date(0) }],
  watchLater: [{ movieId: 3, title: "C", posterPath: null, voteAverage: 7, releaseDate: null, addedAt: new Date(0) }],
  letterboxdIds: [4],
  letterboxdMovies: [],
};

describe("buildRecommendationRequest", () => {
  it("sends every exclusion source the engine reads", () => {
    const req = buildRecommendationRequest({ topGenres: [28] }, collections);
    expect(req.watchedHistory).toEqual([{ movieId: 1 }]);
    expect(req.dismissedHistory).toEqual([{ movieId: 2 }]);
    expect(req.watchLaterMovieIds).toEqual([3]);
    expect(req.letterboxdMovieIds).toEqual([4]);
    expect(req.preferences.topGenres).toEqual([28]);
  });

  it("asks for the same pool size as Android", () => {
    expect(buildRecommendationRequest({}, collections).poolSize).toBe(60);
  });

  it("only sends the preference fields the function documents", () => {
    const keys = Object.keys(pickEnginePreferences({ name: "x", email: "y", isOnboarded: true } as never)).sort();
    expect(keys).toEqual(
      [
        "avoidGenres", "caresAbout", "collectionWatchedMovies", "favoriteThemes", "foreignFilmPreference",
        "imdbThreshold", "maxSessionMinutes", "oldestAcceptableYear", "preferredLanguages", "ratedMovies",
        "preferredStreamingServices", "region", "releasePreference", "runtimePreference", "streamingAvailabilityTypes",
        "tonePreference", "topGenres", "watchingWith",
      ].sort(),
    );
  });

  it("falls back to iOS defaults for missing fields", () => {
    expect(pickEnginePreferences(null)).toMatchObject({
      imdbThreshold: 6,
      oldestAcceptableYear: 1970,
      foreignFilmPreference: "Open to",
      releasePreference: "Mix of new and old",
    });
  });
});

describe("streaming filter fields", () => {
  it("sends the user's stored iOS selection", () => {
    const p = pickEnginePreferences({ preferredStreamingServices: [8, 337], region: "us", streamingAvailabilityTypes: ["flatrate", "rent"] });
    expect(p).toMatchObject({ preferredStreamingServices: [8, 337], region: "US", streamingAvailabilityTypes: ["flatrate", "rent"] });
  });

  it("defaults to no filter: empty providers, flatrate", () => {
    expect(pickEnginePreferences(null)).toMatchObject({ preferredStreamingServices: [], region: undefined, streamingAvailabilityTypes: ["flatrate"] });
  });

  it("sanitizes provider ids like the server does", () => {
    expect(sanitizeProviderIds([8, "9", 8, 0, -1, 1.5, "x", null])).toEqual([8, 9]);
    expect(sanitizeProviderIds("nope")).toEqual([]);
    expect(sanitizeProviderIds(Array.from({ length: 80 }, (_, i) => i + 1))).toHaveLength(50);
  });

  it("only sends a valid 2-letter region", () => {
    expect(sanitizeRegion(" gb ")).toBe("GB");
    for (const bad of ["", "USA", "U", "12", 5, null, undefined]) expect(sanitizeRegion(bad)).toBeUndefined();
  });

  it("normalizes availability types and falls back to flatrate", () => {
    expect(sanitizeAvailabilityTypes(["Rent", "buy", "rent", 3, ""])).toEqual(["rent", "buy"]);
    for (const empty of [[], undefined, "flatrate", [1, 2]]) expect(sanitizeAvailabilityTypes(empty)).toEqual(["flatrate"]);
  });
});

describe("ratedHistory in the request", () => {
  it("is sent when there are ratings to learn from", () => {
    const req = buildRecommendationRequest(null, {
      ...collections,
      watched: [{ movieId: 1, title: "A", posterPath: null, rating: 4, watchedAt: new Date(5), genreIds: [18] }],
      letterboxdMovies: [{ movieId: 9, title: "B", posterPath: null, letterboxdRating: 3.5, watchedDate: new Date(2), importedAt: new Date(1), genreIds: [27], originalLanguage: "ja" }],
    });
    expect(req.ratedHistory).toEqual([
      { movieId: 1, rating: 4, genreIds: [18] },
      { movieId: 9, rating: 3.5, genreIds: [27], originalLanguage: "ja" },
    ]);
    expect(req.watchedHistory).toEqual([{ movieId: 1 }]); // the usual exclusion lists are unchanged
    expect(req.letterboxdMovieIds).toEqual([4]);
  });

  it("is left out entirely when nothing is rated, so the request is exactly as before", () => {
    const req = buildRecommendationRequest(null, { ...collections, watched: [{ movieId: 1, title: "A", posterPath: null, rating: 0, watchedAt: new Date(0) }] });
    expect("ratedHistory" in req).toBe(false);
  });
});
