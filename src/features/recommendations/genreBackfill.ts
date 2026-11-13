// One-time background fill-in of genres, language and year for films you rated before those were
// being saved (backend docs/RATED_HISTORY.md: "existing imports without genres"). Only the newest
// 300 rated films matter, because that is all the server reads. Throttled well under the tmdbProxy
// limit of 120 requests a minute so it never gets in the way of anything else.
import type { LetterboxdMovie } from "../../core/models/LetterboxdMovie";
import { tasteFieldsOf, type TasteFields } from "../../core/models/Movie";
import type { WatchedRecommendation } from "../../core/models/WatchedRecommendation";
import { MAX_RATED_HISTORY } from "./ratedHistory";

export interface BackfillTarget {
  movieId: number;
  inWatched: boolean; // the Slate record is missing genres
  inLetterboxd: boolean; // the Letterboxd record is missing genres
}

const ratingOk = (r: unknown): r is number => typeof r === "number" && Number.isFinite(r) && r > 0 && r <= 5;
const time = (d: Date | null | undefined) => (d && d.getTime() > 0 ? d.getTime() : 0);
const hasGenres = (t: TasteFields) => (t.genreIds?.length ?? 0) > 0;

// Among the films the server will actually read (newest 300 rated), the ones whose records lack genres.
export function findBackfillTargets(watched: readonly WatchedRecommendation[], imported: readonly LetterboxdMovie[], skip: ReadonlySet<number> = new Set()): BackfillTarget[] {
  const rated = new Map<number, { at: number; w?: WatchedRecommendation; l?: LetterboxdMovie }>();
  for (const w of watched) if (ratingOk(w.rating)) rated.set(w.movieId, { at: time(w.watchedAt), w });
  for (const l of imported) {
    if (!ratingOk(l.letterboxdRating)) continue;
    const have = rated.get(l.movieId);
    if (have) have.l = l;
    else rated.set(l.movieId, { at: time(l.watchedDate) || time(l.importedAt), l });
  }
  return [...rated.entries()]
    .sort((a, b) => b[1].at - a[1].at || a[0] - b[0])
    .slice(0, MAX_RATED_HISTORY)
    .flatMap(([movieId, v]): BackfillTarget[] => {
      if (skip.has(movieId)) return [];
      const inWatched = !!v.w && !hasGenres(v.w);
      const inLetterboxd = !!v.l && !hasGenres(v.l);
      // What the server will read is Slate's record when there is one, else the import.
      const sentMissing = v.w ? !hasGenres(v.w) : !!v.l && !hasGenres(v.l);
      return sentMissing ? [{ movieId, inWatched, inLetterboxd }] : [];
    });
}

export interface BackfillDeps {
  fetchDetail: (movieId: number) => Promise<unknown>; // raw TMDb /movie/{id}
  write: (target: BackfillTarget, fields: TasteFields) => Promise<void>;
  signal?: AbortSignal;
  spacingMs?: number;
  wait?: (ms: number) => Promise<void>;
  isRateLimited?: (err: unknown) => boolean;
  isSignedOut?: (err: unknown) => boolean;
}

export interface BackfillResult {
  updated: number;
  unresolved: number[]; // TMDb had nothing usable, or the lookup failed; not retried this session
  stopped: boolean;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function tasteFieldsFromTmdb(raw: unknown): TasteFields {
  const r = raw as { genres?: { id?: unknown }[]; original_language?: unknown; release_date?: unknown } | null;
  return tasteFieldsOf({
    genreIds: Array.isArray(r?.genres) ? r!.genres.map((g) => g?.id).filter((g): g is number => Number.isInteger(g)) : [],
    originalLanguage: typeof r?.original_language === "string" ? r.original_language : undefined,
    releaseDate: typeof r?.release_date === "string" ? r.release_date : undefined,
  });
}

export async function runGenreBackfill(targets: readonly BackfillTarget[], deps: BackfillDeps): Promise<BackfillResult> {
  const { fetchDetail, write, signal, spacingMs = 1000, wait = sleep, isRateLimited = () => false, isSignedOut = () => false } = deps;
  const result: BackfillResult = { updated: 0, unresolved: [], stopped: false };

  for (const target of targets) {
    if (signal?.aborted) {
      result.stopped = true;
      break;
    }
    let fields: TasteFields | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        fields = tasteFieldsFromTmdb(await fetchDetail(target.movieId));
        break;
      } catch (err) {
        if (isSignedOut(err)) {
          result.stopped = true;
          return result;
        }
        if (isRateLimited(err) && attempt === 0) {
          await wait(20_000); // back off, then one more try
          continue;
        }
        break;
      }
    }
    if (!fields || !hasGenres(fields)) {
      result.unresolved.push(target.movieId);
    } else {
      try {
        await write(target, fields);
        result.updated++;
      } catch (err) {
        console.warn("Genre backfill write failed", target.movieId, err);
        result.unresolved.push(target.movieId);
      }
    }
    if (spacingMs > 0) await wait(spacingMs);
  }
  return result;
}
