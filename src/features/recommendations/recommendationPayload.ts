import type { RecommendationRequest } from "../../core/services/cloudFunctions";
import type { UserCollections } from "../../core/services/userCollections";
import type { UserPreferences } from "../../core/models/UserPreferences";
import { buildRatedHistory } from "./ratedHistory";

// The preference fields `getRecommendations` reads (spec §3 / functions/index.js). Missing
// fields fall back to iOS's defaults so a partially-filled document still scores sensibly.
// Same pool size Android requests (spec §3). Bigger pools fetch more TMDb pages, so they are
// slower; this is requested once per load and on the rare refill, never per card.
export const RECOMMENDATION_POOL_SIZE = 60;

// Streaming filter fields (docs/STREAMING_FILTER.md in the backend repo). Sanitized the way the
// server validates them, so a malformed stored value can never make the request fail.
const MAX_STREAMING_PROVIDERS = 50;

export function sanitizeProviderIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const ids = value.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(ids)].slice(0, MAX_STREAMING_PROVIDERS);
}

export function sanitizeRegion(value: unknown): string | undefined {
  const region = typeof value === "string" ? value.trim().toUpperCase() : "";
  return /^[A-Z]{2}$/.test(region) ? region : undefined;
}

export function sanitizeAvailabilityTypes(value: unknown): string[] {
  const types = Array.isArray(value) ? value.filter((t): t is string => typeof t === "string" && t.trim() !== "") : [];
  return types.length > 0 ? [...new Set(types.map((t) => t.trim().toLowerCase()))] : ["flatrate"];
}

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
    // An empty provider list means "All Streaming Services": the server applies no filter, and
    // `region` is then inert. Users' iOS selections apply here too, exactly as on iOS.
    preferredStreamingServices: sanitizeProviderIds(p?.preferredStreamingServices),
    region: sanitizeRegion(p?.region),
    streamingAvailabilityTypes: sanitizeAvailabilityTypes(p?.streamingAvailabilityTypes),
  };
}

export function buildRecommendationRequest(
  preferences: Partial<UserPreferences> | null,
  c: UserCollections,
): RecommendationRequest {
  const ratedHistory = buildRatedHistory(c.watched, c.letterboxdMovies ?? []);
  return {
    preferences: pickEnginePreferences(preferences),
    watchedHistory: c.watched.map((w) => ({ movieId: w.movieId })),
    dismissedHistory: c.dismissed.map((d) => ({ movieId: d.movieId })),
    watchLaterMovieIds: c.watchLater.map((w) => w.movieId),
    letterboxdMovieIds: c.letterboxdIds,
    // Omitted entirely when there is nothing to learn from, so the request is exactly what it was.
    ...(ratedHistory.length > 0 ? { ratedHistory } : {}),
    poolSize: RECOMMENDATION_POOL_SIZE,
  };
}
