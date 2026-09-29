import { describe, expect, it } from "vitest";
import { buildRecommendationRequest, pickEnginePreferences } from "./recommendationPayload";
import type { UserCollections } from "../../core/services/userCollections";

const collections: UserCollections = {
  watched: [{ movieId: 1, title: "A", posterPath: null, rating: 4, watchedAt: new Date(0) }],
  dismissed: [{ movieId: 2, title: "B", posterPath: null, reason: "Too long", customReason: null, dismissedAt: new Date(0) }],
  watchLater: [{ movieId: 3, title: "C", posterPath: null, voteAverage: 7, releaseDate: null, addedAt: new Date(0) }],
  letterboxdIds: [4],
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
        "releasePreference", "runtimePreference", "tonePreference", "topGenres", "watchingWith",
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
