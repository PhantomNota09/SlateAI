import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { normalizePool, type RecommendationResponse } from "../models/Movie";
import type { UserPreferences } from "../models/UserPreferences";

// All TMDb access goes through the `tmdbProxy` callable — the API key never ships in the
// bundle (CLAUDE.md non-negotiables). Only allowlisted paths work (functions/tmdb.js).
export async function tmdbProxy<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  const call = httpsCallable<{ path: string; params: Record<string, unknown> }, T>(functions, "tmdbProxy");
  const { data } = await call({ path, params });
  return data;
}

// The scoring engine lives only in the `getRecommendations` function (functions/
// recommendationEngine.js) — never reimplement it here (CLAUDE.md non-negotiables).
export interface RecommendationRequest {
  preferences: Partial<UserPreferences>;
  watchedHistory: { movieId: number }[];
  dismissedHistory: { movieId: number }[];
  watchLaterMovieIds: number[];
  letterboxdMovieIds: number[];
  poolSize?: number; // 20-100, default 40; larger sizes fetch more TMDb pages (slower)
}

export async function getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
  const call = httpsCallable<RecommendationRequest, RecommendationResponse>(functions, "getRecommendations");
  const { data } = await call(request);
  // An empty pool on success means the user has acted on every candidate; failures throw.
  return { pool: normalizePool(data?.pool) };
}

// Advanced Analytics only — never from the recommendation path (spec §3). Cached server-side per
// user for 7 days, so there is no client cache on top of it.
export interface AnalyticsInsights {
  personalityInsights: string[];
  tasteProfile: string;
  recommendedNextSteps: string[];
}

export interface AnalyticsInsightsRequest {
  totalMovies: number;
  averageRating: number;
  topGenres: string[]; // genre display names
  explorationScore: number; // 0–100
  forceRefresh?: boolean;
}

export async function generateAnalyticsInsights(request: AnalyticsInsightsRequest): Promise<AnalyticsInsights> {
  const call = httpsCallable<AnalyticsInsightsRequest, AnalyticsInsights>(functions, "generateAnalyticsInsights");
  const { data } = await call(request);
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : []);
  return {
    personalityInsights: strings(data?.personalityInsights),
    tasteProfile: typeof data?.tasteProfile === "string" ? data.tasteProfile : "",
    recommendedNextSteps: strings(data?.recommendedNextSteps),
  };
}
