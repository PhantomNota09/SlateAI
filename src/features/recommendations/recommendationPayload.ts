import type { RecommendationRequest } from "../../core/services/cloudFunctions";
import type { UserCollections } from "../../core/services/userCollections";
import type { UserPreferences } from "../../core/models/UserPreferences";

// The preference fields `getRecommendations` reads (spec §3 / functions/index.js). Missing
// fields fall back to iOS's defaults so a partially-filled document still scores sensibly.
// Same pool size Android requests (spec §3). Bigger pools fetch more TMDb pages, so they are
// slower; this is requested once per load and on the rare refill, never per card.
export const RECOMMENDATION_POOL_SIZE = 60;

export function pickEnginePreferences(p: Partial<UserPreferences> | null): Partial<UserPreferences> {
  return {
    topGenres: p?.topGenres ?? [],
    avoidGenres: p?.avoidGenres ?? [],
    favoriteThemes: p?.favoriteThemes ?? [],
    preferredLanguages: p?.preferredLanguages ?? [],
    foreignFilmPreference: p?.foreignFilmPreference ?? "Open to",
    imdbThreshold: p?.imdbThreshold ?? 6.0,
    oldestAcceptableYear: p?.oldestAcceptableYear ?? 1970,
    releasePreference: p?.releasePreference ?? "Mix of new and old",
    caresAbout: p?.caresAbout ?? [],
    runtimePreference: p?.runtimePreference ?? "Doesn't matter",
    maxSessionMinutes: p?.maxSessionMinutes ?? 180,
    tonePreference: p?.tonePreference ?? "Mix of both",
    watchingWith: p?.watchingWith ?? "Alone",
    ratedMovies: p?.ratedMovies ?? [],
    collectionWatchedMovies: p?.collectionWatchedMovies ?? [],
  };
}

export function buildRecommendationRequest(
  preferences: Partial<UserPreferences> | null,
  c: UserCollections,
): RecommendationRequest {
  return {
    preferences: pickEnginePreferences(preferences),
    watchedHistory: c.watched.map((w) => ({ movieId: w.movieId })),
    dismissedHistory: c.dismissed.map((d) => ({ movieId: d.movieId })),
    watchLaterMovieIds: c.watchLater.map((w) => w.movieId),
    letterboxdMovieIds: c.letterboxdIds,
    poolSize: RECOMMENDATION_POOL_SIZE,
  };
}
