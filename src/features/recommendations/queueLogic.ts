import type { Movie } from "../../core/models/Movie";

// Pure queue rules for the For You feed. iOS keeps a scored pool and refills the visible
// list as movies are removed (HomeViewModel); this is the web equivalent. Skips are
// session-only — nothing is persisted for a skip, same as iOS.

// Refill from the function when the queue gets short (the function returns up to 40).
export const REFILL_THRESHOLD = 6;

export function removeMovie(queue: readonly Movie[], id: number): Movie[] {
  return queue.filter((m) => m.id !== id);
}

export function needsRefill(queueLength: number, refilling: boolean, exhausted: boolean): boolean {
  return !refilling && !exhausted && queueLength < REFILL_THRESHOLD;
}

// Merge a fresh pool into the queue: drop anything already queued or excluded, and skip
// this session's skipped movies — unless that would leave nothing, in which case they are
// allowed to reappear (iOS lets the oldest skips come back when the pool runs low).
export function mergePool(
  queue: readonly Movie[],
  pool: readonly Movie[],
  excluded: ReadonlySet<number>,
  skipped: ReadonlySet<number>,
): { queue: Movie[]; skippedCleared: boolean; added: number } {
  const queued = new Set(queue.map((m) => m.id));
  const eligible = pool.filter((m) => !queued.has(m.id) && !excluded.has(m.id));
  const fresh = eligible.filter((m) => !skipped.has(m.id));

  if (fresh.length > 0) {
    return { queue: [...queue, ...fresh], skippedCleared: false, added: fresh.length };
  }
  if (eligible.length > 0 && skipped.size > 0) {
    return { queue: [...queue, ...eligible], skippedCleared: true, added: eligible.length };
  }
  return { queue: [...queue], skippedCleared: false, added: 0 };
}
