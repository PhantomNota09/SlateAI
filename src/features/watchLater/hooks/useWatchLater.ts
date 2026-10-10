import { useCallback, useEffect, useRef, useState } from "react";
import type { MovieRef } from "../../../core/models/Movie";
import type { WatchLaterItem } from "../../../core/models/WatchLaterItem";
import { recordStreakInteraction } from "../../../core/services/streak";
import { loadUserCollections, recordWatched, removeWatchLater } from "../../../core/services/userCollections";
import { describeStreakResult } from "../../../core/streak/streakMessages";

type Toast = (kind: "success" | "error", message: string) => void;

// State + actions for the Watch Later page (iOS WatchLaterViewModel). Removing and marking as
// watched update the list immediately and roll that one item back if the write fails.
export function useWatchLater(uid: string, onToast: Toast) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [items, setItemsRaw] = useState<WatchLaterItem[]>([]);
  const itemsRef = useRef<WatchLaterItem[]>([]);
  // The ref is updated synchronously so an action can read the current list right away.
  const setItems = useCallback((update: (list: WatchLaterItem[]) => WatchLaterItem[]) => {
    itemsRef.current = update(itemsRef.current);
    setItemsRaw(itemsRef.current);
  }, []);
  const toast = useRef(onToast);
  toast.current = onToast;
  const generation = useRef(0);

  const load = useCallback(async () => {
    const gen = ++generation.current;
    setPhase("loading");
    try {
      const { watchLater } = await loadUserCollections(uid);
      if (gen !== generation.current) return;
      setItems(() => watchLater);
      setPhase("ready");
    } catch (err) {
      if (gen !== generation.current) return;
      console.error("Failed to load Watch Later", err);
      setPhase("error");
    }
  }, [uid, setItems]);

  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);

  // Puts one item back where it was, without disturbing other changes made meanwhile.
  const restore = useCallback((item: WatchLaterItem) => {
    setItems((list) =>
      list.some((x) => x.movieId === item.movieId)
        ? list
        : [...list, item].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime()),
    );
  }, [setItems]);

  const take = useCallback(
    (movieId: number): WatchLaterItem | undefined => {
      const found = itemsRef.current.find((x) => x.movieId === movieId);
      if (found) setItems((list) => list.filter((x) => x.movieId !== movieId));
      return found;
    },
    [setItems],
  );

  const remove = useCallback(
    async (movieId: number) => {
      const item = take(movieId);
      if (!item) return;
      try {
        await removeWatchLater(uid, movieId);
        toast.current("success", "Removed from Watch Later");
      } catch (err) {
        console.error("Failed to remove from watch later", err);
        restore(item);
        toast.current("error", "Couldn't remove that. Please try again.");
      }
    },
    [uid, take, restore],
  );

  const markWatched = useCallback(
    async (movie: MovieRef, rating: number) => {
      const item = take(movie.id);
      if (!item) return;
      try {
        await recordWatched(uid, movie, rating, { dismissed: false, inWatchLater: true });
        toast.current("success", "Marked as watched");
        void recordStreakInteraction(uid)
          .then((result) => {
            const message = describeStreakResult(result);
            if (message) toast.current("success", message);
          })
          .catch((err) => console.error("Streak tracking failed", err));
      } catch (err) {
        console.error("Failed to save watched movie", err);
        restore(item);
        toast.current("error", "Couldn't save that rating. Please try again.");
      }
    },
    [uid, take, restore],
  );

  return { phase, items, reload: load, remove, markWatched };
}
