import { useCallback, useEffect, useMemo, useState } from "react";
import type { DismissedRecommendation } from "../../../core/models/DismissedRecommendation";
import type { LetterboxdMovie } from "../../../core/models/LetterboxdMovie";
import type { WatchedRecommendation } from "../../../core/models/WatchedRecommendation";
import { loadLetterboxdMovies } from "../../../core/services/letterboxd";
import { loadUserCollections } from "../../../core/services/userCollections";
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

  const items = useMemo(() => combineHistory(watched, imported), [watched, imported]);
  const counts = useMemo(() => historyCounts(items, dismissed), [items, dismissed]);
  return { phase, items, dismissed, counts, reload: load };
}
