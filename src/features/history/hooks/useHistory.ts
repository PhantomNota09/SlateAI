import { useCallback, useEffect, useMemo, useState } from "react";
import type { DismissedRecommendation } from "../../../core/models/DismissedRecommendation";
import type { LetterboxdMovie } from "../../../core/models/LetterboxdMovie";
import type { WatchedRecommendation } from "../../../core/models/WatchedRecommendation";
import { loadLetterboxdMovies } from "../../../core/services/letterboxd";
import { loadUserCollections, removeDismissed, removeWatched, updateWatchedRating } from "../../../core/services/userCollections";
import { combineHistory, historyCounts } from "../historyLogic";

// Everything for the History tab: Slate ratings, Letterboxd imports and "Not for me" picks.
export function useHistory(uid: string) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [watched, setWatched] = useState<WatchedRecommendation[]>([]);
  const [dismissed, setDismissed] = useState<DismissedRecommendation[]>([]);
  const [imported, setImported] = useState<LetterboxdMovie[]>([]);

  const load = useCallback(async () => {
    setPhase("loading");
    try {
      // The import list is secondary: if it fails the Slate history still shows.
      const [collections, lb] = await Promise.all([loadUserCollections(uid), loadLetterboxdMovies(uid).catch(() => [] as LetterboxdMovie[])]);
      setWatched(collections.watched);
      setDismissed(collections.dismissed);
      setImported(lb);
      setPhase("ready");
    } catch (err) {
      console.error("Failed to load history", err);
      setPhase("error");
    }
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load]);

  // Removes the pick from the list straight away and puts it back if the delete fails.
  const undismiss = useCallback(
    async (movieId: number): Promise<boolean> => {
      const before = dismissed;
      setDismissed((list) => list.filter((d) => d.movieId !== movieId));
      try {
        await removeDismissed(uid, movieId);
        return true;
      } catch (err) {
        console.error("Failed to undo Not interested", err);
        setDismissed(before);
        return false;
      }
    },
    [uid, dismissed],
  );

  // Both apply at once and roll back if the write fails.
  const editRating = useCallback(
    async (movieId: number, rating: number): Promise<boolean> => {
      const before = watched;
      setWatched((list) => list.map((w) => (w.movieId === movieId ? { ...w, rating } : w)));
      try {
        await updateWatchedRating(uid, movieId, rating);
        return true;
      } catch (err) {
        console.error("Failed to edit rating", err);
        setWatched(before);
        return false;
      }
    },
    [uid, watched],
  );

  const removeFromHistory = useCallback(
    async (movieId: number): Promise<boolean> => {
      const before = watched;
      setWatched((list) => list.filter((w) => w.movieId !== movieId));
      try {
        await removeWatched(uid, movieId);
        return true;
      } catch (err) {
        console.error("Failed to remove from history", err);
        setWatched(before);
        return false;
      }
    },
    [uid, watched],
  );

  const items = useMemo(() => combineHistory(watched, imported), [watched, imported]);
  const counts = useMemo(() => historyCounts(items, dismissed), [items, dismissed]);
  return { phase, items, dismissed, counts, reload: load, undismiss, editRating, removeFromHistory };
}
