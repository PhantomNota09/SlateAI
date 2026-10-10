import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Movie, MovieRef } from "../../../core/models/Movie";
import { recordStreakInteraction } from "../../../core/services/streak";
import { loadUserCollections, recordWatched, recordWatchLater } from "../../../core/services/userCollections";
import { describeStreakResult } from "../../../core/streak/streakMessages";

type Toast = (kind: "success" | "error", message: string) => void;
export type MovieStatus = "watched" | "saved" | null;

// What you've already watched, saved or imported (so Discover can hide it), plus the two actions
// available from a film's detail dialog: Save to Watch Later and Already watched.
export function useSeenMovies(uid: string, onToast: Toast) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [watchedIds, setWatchedIds] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<number>>(new Set());
  const toast = useRef(onToast);
  toast.current = onToast;

  const load = useCallback(async () => {
    setReady(false);
    setFailed(false);
    try {
      const c = await loadUserCollections(uid);
      setWatchedIds(new Set(c.watched.map((w) => w.movieId)));
      setSavedIds(new Set(c.watchLater.map((w) => w.movieId)));
      setImportedIds(new Set(c.letterboxdIds));
    } catch (err) {
      // Without the lists the page still works, it just can't hide seen films.
      console.error("Failed to load your history for Discover", err);
      setFailed(true);
    } finally {
      setReady(true);
    }
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const excluded = useMemo(() => new Set([...watchedIds, ...savedIds, ...importedIds]), [watchedIds, savedIds, importedIds]);
  const statusOf = useCallback(
    (id: number): MovieStatus => (watchedIds.has(id) || importedIds.has(id) ? "watched" : savedIds.has(id) ? "saved" : null),
    [watchedIds, importedIds, savedIds],
  );

  const countStreak = useCallback(() => {
    void recordStreakInteraction(uid)
      .then((result) => {
        const message = describeStreakResult(result);
        if (message) toast.current("success", message);
      })
      .catch((err) => console.error("Streak tracking failed", err));
  }, [uid]);

  const saveForLater = useCallback(
    async (movie: Movie): Promise<boolean> => {
      try {
        await recordWatchLater(uid, movie, { dismissed: false });
        setSavedIds((s) => new Set(s).add(movie.id));
        toast.current("success", "Added to Watch Later");
        countStreak();
        return true;
      } catch (err) {
        console.error("Failed to save to watch later", err);
        toast.current("error", "Couldn't save to Watch Later. Please try again.");
        return false;
      }
    },
    [uid, countStreak],
  );

  const markWatched = useCallback(
    async (movie: MovieRef, rating: number): Promise<boolean> => {
      const wasSaved = savedIds.has(movie.id);
      try {
        await recordWatched(uid, movie, rating, { dismissed: false, inWatchLater: wasSaved });
        setWatchedIds((s) => new Set(s).add(movie.id));
        setSavedIds((s) => {
          const n = new Set(s);
          n.delete(movie.id);
          return n;
        });
        toast.current("success", "Marked as watched");
        countStreak();
        return true;
      } catch (err) {
        console.error("Failed to save watched movie", err);
        toast.current("error", "Couldn't save that rating. Please try again.");
        return false;
      }
    },
    [uid, savedIds, countStreak],
  );

  return { ready, failed, excluded, statusOf, saveForLater, markWatched };
}
