// Pure maths for the Insights page, so it is testable without React or Firebase. Mirrors the
// real parts of iOS MovieAnalytics (iOS also has placeholder values — a fixed 4.2 genre rating,
// "Horror" as most critical — which are deliberately not copied).
import { GENRES } from "../../core/models/genres";

export interface RatedFilm {
  movieId: number;
  rating: number | null; // 0.5–5; imported films may have none
  at: Date;
}

export const MIN_FILMS = 5; // iOS needs five films before it analyses anything

// Slate's own record wins when a film is both rated on Slate and imported from Letterboxd.
export function combineHistory(slate: RatedFilm[], imported: RatedFilm[]): RatedFilm[] {
  const seen = new Set(slate.map((f) => f.movieId));
  return [...slate, ...imported.filter((f) => !seen.has(f.movieId))];
}

export const RATING_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

export interface Summary {
  total: number;
  rated: number;
  average: number; // over rated films
  distribution: { rating: number; count: number }[];
  perWeek: number;
  busiestMonth: string | null;
  monthly: { label: string; count: number }[]; // last 12 months, oldest first
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function summarize(films: RatedFilm[], now = new Date()): Summary {
  const rated = films.filter((f): f is RatedFilm & { rating: number } => typeof f.rating === "number" && f.rating > 0);
  const average = rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : 0;
  const distribution = RATING_STEPS.map((step) => ({ rating: step, count: rated.filter((f) => Math.round(f.rating * 2) / 2 === step).length }));

  // Films per week across the period they were logged; never less than one week, so a first
  // evening of rating doesn't read as hundreds a week.
  const times = films.map((f) => f.at.getTime()).filter((t) => t > 0);
  const span = times.length > 1 ? Math.max(Math.max(...times) - Math.min(...times), WEEK_MS) : WEEK_MS;
  const perWeek = times.length ? (times.length / span) * WEEK_MS : 0;

  const byMonthOfYear = new Array<number>(12).fill(0);
  for (const f of films) if (f.at.getTime() > 0) byMonthOfYear[f.at.getMonth()]++;
  const top = Math.max(...byMonthOfYear);
  const busiestMonth = top > 0 ? MONTHS[byMonthOfYear.indexOf(top)] : null;

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const count = films.filter((f) => f.at.getFullYear() === d.getFullYear() && f.at.getMonth() === d.getMonth()).length;
    return { label: d.toLocaleString("en", { month: "short" }), count };
  });

  return { total: films.length, rated: rated.length, average, distribution, perWeek, busiestMonth, monthly };
}

export interface FilmDetail {
  id: number;
  genres: { id: number; name: string }[];
  releaseDate: string | null;
  language: string;
  runtime: number;
  voteAverage: number;
}

export interface TasteBreakdown {
  sampled: number;
  topGenres: { name: string; count: number; percent: number }[];
  favoriteDecade: string | null;
  foreignPercent: number;
  averageRuntime: number; // minutes, films with a runtime only
  totalHours: number;
  hiddenGems: number; // rated 4+ by you, under 7.0 on TMDb
  variety: number; // 0–100: how many of the 19 genres your films span
}

export function tasteBreakdown(details: FilmDetail[], ratings: ReadonlyMap<number, number | null>): TasteBreakdown {
  const n = details.length;
  if (n === 0) return { sampled: 0, topGenres: [], favoriteDecade: null, foreignPercent: 0, averageRuntime: 0, totalHours: 0, hiddenGems: 0, variety: 0 };

  const genreCounts = new Map<string, number>();
  for (const d of details) for (const g of d.genres) genreCounts.set(g.name, (genreCounts.get(g.name) ?? 0) + 1);
  const topGenres = [...genreCounts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, percent: Math.round((count / n) * 100) }));

  const decades = new Map<number, number>();
  for (const d of details) {
    const year = Number((d.releaseDate ?? "").slice(0, 4));
    if (Number.isInteger(year) && year > 1800) decades.set(Math.floor(year / 10) * 10, (decades.get(Math.floor(year / 10) * 10) ?? 0) + 1);
  }
  const decade = [...decades].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];

  const withRuntime = details.filter((d) => d.runtime > 0);
  const totalMinutes = withRuntime.reduce((s, d) => s + d.runtime, 0);

  const known = new Set(GENRES.map((g) => g.name));
  const spanned = [...genreCounts.keys()].filter((name) => known.has(name)).length;

  return {
    sampled: n,
    topGenres,
    favoriteDecade: decade ? `${decade[0]}s` : null,
    foreignPercent: Math.round((details.filter((d) => d.language && d.language !== "en").length / n) * 100),
    averageRuntime: withRuntime.length ? Math.round(totalMinutes / withRuntime.length) : 0,
    totalHours: Math.round(totalMinutes / 60),
    hiddenGems: details.filter((d) => (ratings.get(d.id) ?? 0) >= 4 && d.voteAverage < 7).length,
    variety: Math.min(100, Math.round((spanned / GENRES.length) * 100)),
  };
}

// The TMDb /movie/{id} payload, trimmed to what the breakdown needs. Returns null for junk.
export function parseFilmDetail(raw: unknown): FilmDetail | null {
  const r = raw as Record<string, unknown> | null;
  if (!r || !Number.isInteger(r.id)) return null;
  const genres = Array.isArray(r.genres)
    ? r.genres.flatMap((g: { id?: unknown; name?: unknown }) => (Number.isInteger(g?.id) && typeof g?.name === "string" ? [{ id: g.id as number, name: g.name }] : []))
    : [];
  return {
    id: r.id as number,
    genres,
    releaseDate: typeof r.release_date === "string" && r.release_date ? r.release_date : null,
    language: typeof r.original_language === "string" ? r.original_language : "",
    runtime: typeof r.runtime === "number" ? r.runtime : 0,
    voteAverage: typeof r.vote_average === "number" ? r.vote_average : 0,
  };
}
