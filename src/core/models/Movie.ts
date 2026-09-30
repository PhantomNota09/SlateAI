// Shape of entries in `pool` returned by the `getRecommendations` callable (spec §3).
// Not a full TMDb movie object — only the fields the function returns.
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  voteAverage: number;
  genreIds: number[];
  originalLanguage: string;
  runtime: number | null;
  // From the engine's scoring pass (getRecommendations). null when the function had no score.
  matchPercentage: number | null;
  reasons: string[];
  // Present only when a streaming filter was requested. true = fetched with the provider
  // filter (on the user's services in their region); false = backfill, availability unknown.
  onSelectedServices?: boolean;
}

// Minimal reference used by the watched / dismissed / watch-later writes.
export type MovieRef = Pick<Movie, "id" | "title" | "posterPath">;

export interface MatchInfo {
  matchPercentage: number;
  reasons: string[];
}

export interface RecommendationResponse {
  pool: Movie[];
}

// Wrong-typed or missing scoring fields degrade to "no match info", never to a crash.
export function normalizePool(raw: unknown): Movie[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((m) => {
    const pct = typeof m?.matchPercentage === "number" && Number.isFinite(m.matchPercentage) ? m.matchPercentage : null;
    const movie = {
      ...m,
      matchPercentage: pct === null ? null : Math.max(0, Math.min(100, Math.round(pct))),
      reasons: Array.isArray(m?.reasons) ? m.reasons.filter((r: unknown): r is string => typeof r === "string") : [],
    } as Movie;
    if (typeof movie.onSelectedServices !== "boolean") delete movie.onSelectedServices;
    return movie;
  });
}

// The card only shows match info when there is a score.
export function matchInfoOf(movie: Movie): MatchInfo | null {
  return movie.matchPercentage === null ? null : { matchPercentage: movie.matchPercentage, reasons: movie.reasons };
}

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Poster/backdrop URLs are built client-side, same as iOS (spec §3) — only the API key
// needs a proxy, not the images.
export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w500"): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280"): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export function releaseYear(releaseDate: string | null | undefined): string {
  return releaseDate ? releaseDate.slice(0, 4) : "";
}
