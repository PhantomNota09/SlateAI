import { useCallback, useEffect, useState } from "react";
import type { UserStats } from "../../../core/models/UserStats";
import type { WatchedRecommendation } from "../../../core/models/WatchedRecommendation";
import { loadRecentWatched, loadUserStats } from "../../../core/services/userStats";

// Read-only data for /app/profile. Deliberately does not replicate iOS's "self-healing badge"
// writes to userStats: the web profile never modifies stats or badges.
export function useProfile(uid: string) {
  const [state, setState] = useState<{
    phase: "loading" | "ready" | "error";
    stats: UserStats | null;
    recent: WatchedRecommendation[];
  }>({ phase: "loading", stats: null, recent: [] });

  const load = useCallback(async () => {
    setState({ phase: "loading", stats: null, recent: [] });
    try {
      // Recent history is a nice-to-have: if it fails the stats still show.
      const [stats, recent] = await Promise.all([
        loadUserStats(uid),
        loadRecentWatched(uid).catch(() => [] as WatchedRecommendation[]),
      ]);
      setState({ phase: "ready", stats, recent });
    } catch (err) {
      console.error("Failed to load profile", err);
      setState({ phase: "error", stats: null, recent: [] });
    }
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
