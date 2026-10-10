import { useEffect, useMemo, useState } from "react";
import type { UserStats } from "../../../core/models/UserStats";
import type { WatchedRecommendation } from "../../../core/models/WatchedRecommendation";
import { loadWatchHistory } from "../../../core/services/friends";
import { loadUserStats } from "../../../core/services/userStats";
import { calculateTasteMatch } from "../tasteMatch";

// A friend's stats and latest films, and how your taste compares (iOS FriendProfileView).
export function useFriendProfile(myUid: string, friendUid: string) {
  const [state, setState] = useState<{
    phase: "loading" | "ready" | "error";
    stats: UserStats | null;
    myStats: UserStats | null;
    theirs: WatchedRecommendation[];
    mine: WatchedRecommendation[];
  }>({ phase: "loading", stats: null, myStats: null, theirs: [], mine: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading", stats: null, myStats: null, theirs: [], mine: [] });
    (async () => {
      try {
        const [stats, myStats] = await Promise.all([loadUserStats(friendUid), loadUserStats(myUid).catch(() => null)]);
        if (!stats) throw new Error("no stats");
        // The match is a nice-to-have: without histories the page still shows the profile.
        const [theirs, mine] = await Promise.all([loadWatchHistory(friendUid).catch(() => []), loadWatchHistory(myUid).catch(() => [])]);
        if (!cancelled) setState({ phase: "ready", stats, myStats, theirs, mine });
      } catch (err) {
        console.error("Failed to load friend profile", err);
        if (!cancelled) setState({ phase: "error", stats: null, myStats: null, theirs: [], mine: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [myUid, friendUid, attempt]);

  const recent = useMemo(() => [...state.theirs].sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime()).slice(0, 5), [state.theirs]);
  const match = useMemo(
    () => (state.stats && state.myStats ? calculateTasteMatch(state.mine, state.theirs, state.myStats, state.stats) : null),
    [state.stats, state.myStats, state.mine, state.theirs],
  );

  return { phase: state.phase, stats: state.stats, recent, match, reload: () => setAttempt((n) => n + 1) };
}
