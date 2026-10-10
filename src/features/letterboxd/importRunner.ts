import type { LetterboxdMovie } from "../../core/models/LetterboxdMovie";
import type { LetterboxdCSVEntry } from "./csvParser";

export interface TmdbMatch {
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
  const { entries, search, onProgress, signal, minIntervalMs = 600, now = () => new Date(), wait = sleep } = options;
  const seen = new Set(options.existingIds);
  const cache = new Map<string, TmdbMatch | null>();
  const result: ImportResult = { added: [], skipped: 0, failed: [], processed: 0, cancelled: false };
  const label = (e: LetterboxdCSVEntry) => `${e.title} (${e.year ?? "?"})`;

  for (const entry of entries) {
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
    result.added.push({
      movieId: match.id,
      title: match.title,
      posterPath: match.posterPath,
      letterboxdRating: entry.rating,
      watchedDate: entry.date,
      importedAt: now(),
    });
  }
  return result;
}

// Rough time for the progress screen: one lookup per interval.
export function estimateMinutes(count: number, minIntervalMs = 600): number {
  return Math.max(1, Math.ceil((count * minIntervalMs) / 60000));
}
