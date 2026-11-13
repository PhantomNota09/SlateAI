import { useCallback, useEffect, useState } from "react";
import type { LeaderboardResult } from "../../../core/models/LeaderboardEntry";
import { loadFriendsLeaderboard, loadGlobalLeaderboard } from "../../../core/services/leaderboard";

export type LeaderboardScope = "global" | "friends";

// `friendUids` identity may change every render; the list's contents key the reload.
export function useLeaderboard(uid: string, scope: LeaderboardScope, friendUids: string[]) {
  const [result, setResult] = useState<LeaderboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const friendKey = friendUids.slice().sort().join(",");

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setResult(scope === "global" ? await loadGlobalLeaderboard(uid) : await loadFriendsLeaderboard(uid, friendKey ? friendKey.split(",") : []));
    } catch (err) {
      console.error("Leaderboard load failed", err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [uid, scope, friendKey]);

  useEffect(() => {
    setResult(null);
    void load();
  }, [load]);

  return { result, loading, failed, reload: load };
}
