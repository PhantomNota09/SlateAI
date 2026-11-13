// The `ratedHistory` request field (backend docs/RATED_HISTORY.md): your Slate and Letterboxd
// ratings with genres and language, so the engine can learn what you like. Optional on the server;
// without it recommendations are scored from onboarding preferences only.
import type { LetterboxdMovie } from "../../core/models/LetterboxdMovie";
import type { TasteFields } from "../../core/models/Movie";
import type { WatchedRecommendation } from "../../core/models/WatchedRecommendation";

export interface RatedHistoryEntry extends TasteFields {
  movieId: number;
  rating: number; // 0.5–5
}

export const MAX_RATED_HISTORY = 300; // the server keeps the first 300 valid entries

const ratingOk = (r: unknown): r is number => typeof r === "number" && Number.isFinite(r) && r > 0 && r <= 5;
const time = (d: Date | null | undefined) => (d && d.getTime() > 0 ? d.getTime() : 0);

// Rated films only (unrated ones carry no taste and are excluded through the usual lists), newest
// first, one entry per film with Slate's own rating winning over Letterboxd's.
export function buildRatedHistory(watched: readonly WatchedRecommendation[], imported: readonly LetterboxdMovie[]): RatedHistoryEntry[] {
  const entries = new Map<number, RatedHistoryEntry & { at: number }>();
  for (const w of watched) {
    if (ratingOk(w.rating)) entries.set(w.movieId, { movieId: w.movieId, rating: w.rating, at: time(w.watchedAt), ...pick(w) });
  }
  for (const l of imported) {
    if (!entries.has(l.movieId) && ratingOk(l.letterboxdRating)) {
      entries.set(l.movieId, { movieId: l.movieId, rating: l.letterboxdRating, at: time(l.watchedDate) || time(l.importedAt), ...pick(l) });
    }
  }
  return [...entries.values()]
    .sort((a, b) => b.at - a.at || a.movieId - b.movieId)
    .slice(0, MAX_RATED_HISTORY)
    .map(({ at: _at, ...entry }) => ({ ...entry, genreIds: entry.genreIds ?? [] }));
}

const pick = (t: TasteFields): TasteFields => ({
  ...(t.genreIds?.length ? { genreIds: t.genreIds } : {}),
  ...(t.originalLanguage ? { originalLanguage: t.originalLanguage } : {}),
  ...(t.releaseYear ? { releaseYear: t.releaseYear } : {}),
});
