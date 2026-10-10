// History = everything you've rated on Slate plus films imported from Letterboxd, merged by TMDb id
// (iOS HistoryTab.combinedHistory), and the films you marked "Not for me".
import type { DismissedRecommendation } from "../../core/models/DismissedRecommendation";
import type { LetterboxdMovie } from "../../core/models/LetterboxdMovie";
import type { WatchedRecommendation } from "../../core/models/WatchedRecommendation";

export interface HistoryItem {
  movieId: number;
  title: string;
  posterPath: string | null;
  slateRating: number | null;
  letterboxdRating: number | null;
  date: Date; // most recent of the dates we have, for ordering
  source: "slate" | "letterboxd" | "both";
}

export type HistoryFilter = "all" | "watched" | "letterboxd" | "dismissed";

const latest = (...dates: (Date | null | undefined)[]): Date => {
  const times = dates.flatMap((d) => (d && d.getTime() > 0 ? [d.getTime()] : []));
  return new Date(times.length ? Math.max(...times) : 0);
};

// Slate's title and poster win when a film is in both; the newest date wins for ordering.
export function combineHistory(watched: readonly WatchedRecommendation[], imported: readonly LetterboxdMovie[]): HistoryItem[] {
  const items = new Map<number, HistoryItem>();
  for (const w of watched) {
    items.set(w.movieId, { movieId: w.movieId, title: w.title, posterPath: w.posterPath, slateRating: w.rating > 0 ? w.rating : null, letterboxdRating: null, date: latest(w.watchedAt), source: "slate" });
  }
  for (const l of imported) {
    const when = l.watchedDate ?? l.importedAt;
    const existing = items.get(l.movieId);
    if (existing) {
      items.set(l.movieId, { ...existing, posterPath: existing.posterPath ?? l.posterPath, letterboxdRating: l.letterboxdRating, date: latest(existing.date, when), source: "both" });
    } else {
      items.set(l.movieId, { movieId: l.movieId, title: l.title, posterPath: l.posterPath, slateRating: null, letterboxdRating: l.letterboxdRating, date: latest(when), source: "letterboxd" });
    }
  }
  return [...items.values()].sort((a, b) => b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title));
}

export function filterItems(items: readonly HistoryItem[], filter: Exclude<HistoryFilter, "dismissed">): HistoryItem[] {
  if (filter === "watched") return items.filter((i) => i.source !== "letterboxd");
  if (filter === "letterboxd") return items.filter((i) => i.source !== "slate");
  return [...items];
}

export interface HistoryCounts {
  all: number;
  watched: number;
  letterboxd: number;
  dismissed: number;
}

export function historyCounts(items: readonly HistoryItem[], dismissed: readonly DismissedRecommendation[]): HistoryCounts {
  return {
    all: items.length,
    watched: items.filter((i) => i.source !== "letterboxd").length,
    letterboxd: items.filter((i) => i.source !== "slate").length,
    dismissed: dismissed.length,
  };
}

export function formatStars(rating: number | null): string {
  if (!rating) return "";
  const full = Math.floor(rating);
  return "★".repeat(full) + (rating - full >= 0.5 ? "½" : "");
}
