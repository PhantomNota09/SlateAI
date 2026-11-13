import { useCallback, useMemo, useState } from "react";
import { addCollectionWatched } from "../../../core/services/collections";
import { useAuth } from "../../auth/context/AuthContext";

// Which franchise films you've watched: users/{uid}.collectionWatchedMovies (the field iOS uses),
// plus marks made in this session so the UI updates before the profile reloads.
export function useCollectionProgress() {
  const { user, profile, refreshProfile } = useAuth();
  const [added, setAdded] = useState<ReadonlySet<number>>(new Set());

  const watched = useMemo(
    () => new Set([...(profile.preferences?.collectionWatchedMovies ?? []), ...added]),
    [profile.preferences, added],
  );

  const markWatched = useCallback(
    async (movieId: number) => {
      if (!user) return;
      await addCollectionWatched(user.uid, movieId);
      setAdded((s) => new Set(s).add(movieId));
      void refreshProfile();
    },
    [user, refreshProfile],
  );

  return { watched, markWatched };
}
