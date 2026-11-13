import type { TasteFields } from "../../core/models/Movie";
import type { LetterboxdMovie } from "../../core/models/LetterboxdMovie";
import type { LetterboxdCSVEntry } from "./csvParser";

export interface TmdbMatch extends TasteFields {
  id: number;
  title: string;
  posterPath: string | null;
}

export interface ImportResult {
  added: LetterboxdMovie[];
  skipped: number; // already imported (or listed twice in the file)
  failed: string[]; // "Title (Year)" the lookup couldn't match
  processed: number;
  cancelled: boolean;
}

export interface RunOptions {
  entries: LetterboxdCSVEntry[];
  existingIds: ReadonlySet<number>;
  search: (title: string, year: string | null) => Promise<TmdbMatch | null>;
  onProgress?: (processed: number, total: number) => void;
  signal?: AbortSignal;
  // Skip this many rows from the top (resuming an earlier run of the same file).
  startAt?: number;
  // Called with each batch of new matches as they accumulate, so they are saved while the import is
  // still running, and with whatever is left at the end. `processed` counts rows done so far.
  onMatches?: (batch: LetterboxdMovie[], processed: number) => Promise<void>;
  batchSize?: number;
  // Gap between lookups. The tmdbProxy callable allows 120 requests a minute per user, so the
  // default of 600ms (100/min) leaves headroom for the rest of the app.
  minIntervalMs?: number;
  now?: () => Date;
  wait?: (ms: number) => Promise<void>;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Matches each CSV row to a TMDb movie, one lookup at a time (port of LetterboxdCSVImportService).
// A cancelled run still returns what it matched so far, so nothing the user waited for is lost.
export async function runImport(options: RunOptions): Promise<ImportResult> {
  const { entries, search, onProgress, signal, onMatches, startAt = 0, batchSize = 50, minIntervalMs = 600, now = () => new Date(), wait = sleep } = options;
  const seen = new Set(options.existingIds);
  const cache = new Map<string, TmdbMatch | null>();
  const result: ImportResult = { added: [], skipped: 0, failed: [], processed: startAt, cancelled: false };
  let pending: LetterboxdMovie[] = [];
  const flush = async () => {
    if (pending.length === 0 || !onMatches) return;
    const batch = pending;
    await onMatches(batch, result.processed);
    pending = [];
  };
  const label = (e: LetterboxdCSVEntry) => `${e.title} (${e.year ?? "?"})`;

  for (const entry of entries.slice(startAt)) {
    if (signal?.aborted) {
      result.cancelled = true;
      break;
    }
    result.processed++;
    onProgress?.(result.processed, entries.length);

    const key = `${entry.title}|${entry.year ?? ""}`;
    let match: TmdbMatch | null;
    if (cache.has(key)) {
      match = cache.get(key) ?? null;
    } else {
      try {
        match = await search(entry.title, entry.year);
      } catch (err) {
        if (signal?.aborted) {
          result.processed--;
          result.cancelled = true;
          break;
        }
        console.warn("Letterboxd lookup failed", entry.title, err);
        match = null;
      }
      cache.set(key, match);
      if (minIntervalMs > 0) await wait(minIntervalMs);
    }

    if (!match) {
      result.failed.push(label(entry));
      continue;
    }
    if (seen.has(match.id)) {
      result.skipped++;
      continue;
    }
    seen.add(match.id);
    const movie: LetterboxdMovie = {
      movieId: match.id,
      title: match.title,
      posterPath: match.posterPath,
      letterboxdRating: entry.rating,
      watchedDate: entry.date,
      importedAt: now(),
      ...(match.genreIds?.length ? { genreIds: match.genreIds } : {}),
      ...(match.originalLanguage ? { originalLanguage: match.originalLanguage } : {}),
      ...(match.releaseYear ? { releaseYear: match.releaseYear } : {}),
    };
    result.added.push(movie);
    pending.push(movie);
    if (pending.length >= batchSize) await flush();
  }
  await flush();
  return result;
}

// Rough time for the progress screen: one lookup per interval.
export function estimateMinutes(count: number, minIntervalMs = 600): number {
  return Math.max(1, Math.ceil((count * minIntervalMs) / 60000));
}
