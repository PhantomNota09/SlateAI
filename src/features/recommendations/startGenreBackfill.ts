import type { UserCollections } from "../../core/services/userCollections";
import { tmdbProxy } from "../../core/services/cloudFunctions";
import { writeTasteFields } from "../../core/services/tasteBackfill";
import { findBackfillTargets, runGenreBackfill } from "./genreBackfill";

const started = new Set<string>(); // once per signed-in user per browser session
const skipKey = (uid: string) => `slate.genre-backfill-skip.${uid}`;

function readSkip(uid: string): Set<number> {
  try {
    const v = JSON.parse(localStorage.getItem(skipKey(uid)) ?? "[]");
    return new Set(Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

function writeSkip(uid: string, ids: Set<number>) {
  try {
    localStorage.setItem(skipKey(uid), JSON.stringify([...ids].slice(-1000)));
  } catch {
    /* it just tries them again next session */
  }
}

const codeOf = (err: unknown) => String((err as { code?: unknown })?.code ?? "").replace(/^functions\//, "");

// Fire and forget: called with the collections the feed has just loaded, so it needs no extra reads.
export function startGenreBackfill(uid: string, c: Pick<UserCollections, "watched" | "letterboxdMovies">): void {
  if (started.has(uid)) return;
  const skip = readSkip(uid);
  const targets = findBackfillTargets(c.watched, c.letterboxdMovies, skip);
  if (targets.length === 0) return;
  started.add(uid);

  void runGenreBackfill(targets, {
    fetchDetail: (id) => tmdbProxy<unknown>(`/movie/${id}`),
    write: (t, fields) => writeTasteFields(uid, t, fields),
    isRateLimited: (err) => codeOf(err) === "resource-exhausted",
    isSignedOut: (err) => codeOf(err) === "unauthenticated" || codeOf(err) === "permission-denied",
  })
    .then((result) => {
      if (result.unresolved.length > 0) writeSkip(uid, new Set([...skip, ...result.unresolved]));
    })
    .catch((err) => console.warn("Genre backfill stopped", err));
}
