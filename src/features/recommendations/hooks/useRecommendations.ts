import { useCallback, useEffect, useRef, useState } from "react";
import { tasteFieldsOf, type Movie, type MovieRef } from "../../../core/models/Movie";
import type { DismissalReason, UserPreferences } from "../../../core/models/UserPreferences";
import { getRecommendations } from "../../../core/services/cloudFunctions";
import { describeCallableError } from "../../../core/services/callableErrors";
import { readProfile } from "../../../core/services/firestore";
import { recordStreakInteraction } from "../../../core/services/streak";
import { describeStreakResult } from "../../../core/streak/streakMessages";
import { utcDay } from "../../../core/streak/streakLogic";
import {
  loadUserCollections,
  recordDismissed,
  recordWatched,
  recordWatchLater,
  removeWatchLater,
  type UserCollections,
} from "../../../core/services/userCollections";
import { buildRecommendationRequest } from "../recommendationPayload";
import { startGenreBackfill } from "../startGenreBackfill";
import { mergePool, needsRefill, removeMovie } from "../queueLogic";
import { matchBucket, track } from "../../../core/analytics/analytics";

// State + actions for the For You feed — the web counterpart of HomeViewModel +
// RecommendationCoordinator. Every action updates the UI immediately, writes to Firestore
// in one batch (core/services/userCollections), and if the write fails restores exactly
// that movie's previous state and reports an error.

type Toast = (kind: "success" | "error", message: string) => void;

interface State {
  phase: "loading" | "ready" | "error";
  queue: Movie[];
  collections: UserCollections;
  refilling: boolean;
  exhausted: boolean; // last refill found nothing new
  refillFailed: boolean; // last refill errored (network, TMDb down, rate limit)
  error: string | null;
}

const EMPTY_COLLECTIONS: UserCollections = { watched: [], dismissed: [], watchLater: [], letterboxdIds: [], letterboxdMovies: [] };

const INITIAL: State = {
  phase: "loading",
  queue: [],
  collections: EMPTY_COLLECTIONS,
  refilling: false,
  exhausted: false,
  refillFailed: false,
  error: null,
};

const excludedIds = (c: UserCollections) =>
  new Set<number>([
    ...c.watched.map((w) => w.movieId),
    ...c.dismissed.map((d) => d.movieId),
    ...c.watchLater.map((w) => w.movieId),
    ...c.letterboxdIds,
  ]);

// Replace (or remove, when `entry` is undefined) one movie's entry in a list, newest first.
function setEntry<T extends { movieId: number }>(
  list: readonly T[],
  movieId: number,
  entry: T | undefined,
  dateOf: (item: T) => Date,
): T[] {
  const rest = list.filter((x) => x.movieId !== movieId);
  return (entry ? [entry, ...rest] : rest).sort((a, b) => dateOf(b).getTime() - dateOf(a).getTime());
}

export function useRecommendations(uid: string, onToast: Toast) {
  const [state, setStateRaw] = useState<State>(INITIAL);
  const stateRef = useRef(state);
  const setState = useCallback((update: (s: State) => State) => {
    stateRef.current = update(stateRef.current);
    setStateRaw(stateRef.current);
  }, []);

  const skipped = useRef(new Set<number>());
  const preferences = useRef<Partial<UserPreferences> | null>(null);
  const generation = useRef(0); // ignores responses from a load that has been superseded
  const toast = useRef(onToast);
  toast.current = onToast;

  // iOS counts rating, dismissing, saving to Watch Later and skipping as a daily interaction
  // (RecommendationCoordinator). One check per UTC day per session is enough: after it has been
  // counted (or found already counted) further actions today skip the extra read.
  const streakCountedOn = useRef<string | null>(null);
  const trackInteraction = useCallback(() => {
    const today = utcDay();
    if (streakCountedOn.current === today) return;
    // The service already swallows its own errors; the catch keeps a misbehaving one from ever
    // surfacing as an unhandled rejection or disturbing the action that triggered it.
    void recordStreakInteraction(uid)
      .then((result) => {
        if (result.kind !== "failed" && result.kind !== "skipped") streakCountedOn.current = today;
        const message = describeStreakResult(result);
        if (message) toast.current("success", message);
      })
      .catch((err) => console.error("Streak tracking failed", err));
  }, [uid]);

  const load = useCallback(async () => {
    const gen = ++generation.current;
    skipped.current.clear();
    setState(() => ({ ...INITIAL }));
    try {
      const [collections, profile] = await Promise.all([loadUserCollections(uid), readProfile(uid)]);
      preferences.current = profile.preferences;
      startGenreBackfill(uid, collections);
      const res = await getRecommendations(buildRecommendationRequest(preferences.current, collections));
      if (gen !== generation.current) return;
      const { queue } = mergePool([], res.pool, excludedIds(collections), skipped.current);
      setState(() => ({
        ...INITIAL,
        phase: "ready",
        queue,
        collections,
        exhausted: queue.length === 0,
      }));
    } catch (err) {
      if (gen !== generation.current) return;
      console.error("Failed to load recommendations", err);
      setState((s) => ({ ...s, phase: "error", error: describeCallableError(err).message }));
    }
  }, [uid, setState]);

  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);

  // Top up the queue when it runs short, using the latest exclusions.
  const refillIfNeeded = useCallback(async () => {
    const s = stateRef.current;
    if (s.phase !== "ready" || !needsRefill(s.queue.length, s.refilling, s.exhausted)) return;
    const gen = generation.current;
    setState((x) => ({ ...x, refilling: true }));
    try {
      const res = await getRecommendations(buildRecommendationRequest(preferences.current, stateRef.current.collections));
      if (gen !== generation.current) return;
      const cur = stateRef.current;
      const merged = mergePool(cur.queue, res.pool, excludedIds(cur.collections), skipped.current);
      if (merged.skippedCleared) skipped.current.clear();
      setState((x) => ({
        ...x,
        queue: merged.queue,
        exhausted: merged.added === 0,
        refillFailed: false,
        error: null,
      }));
    } catch (err) {
      console.error("Failed to refill recommendations", err);
      // Keep what's on screen; the next action retries. If the queue is already empty the page
      // shows the error with a Retry, so the user is never left on a loading state.
      if (gen === generation.current) {
        setState((x) => ({ ...x, refillFailed: true, error: describeCallableError(err).message }));
      }
    } finally {
      if (gen === generation.current) setState((x) => ({ ...x, refilling: false }));
    }
  }, [setState]);

  // Snapshot one movie's state so a failed write can put it back exactly.
  const snapshot = (id: number) => {
    const s = stateRef.current;
    return {
      id,
      queueIndex: s.queue.findIndex((m) => m.id === id),
      queueMovie: s.queue.find((m) => m.id === id),
      watched: s.collections.watched.find((w) => w.movieId === id),
      dismissed: s.collections.dismissed.find((d) => d.movieId === id),
      watchLater: s.collections.watchLater.find((w) => w.movieId === id),
    };
  };
  type Snapshot = ReturnType<typeof snapshot>;

  const restore = (snap: Snapshot) =>
    setState((s) => {
      const queue = [...s.queue];
      if (snap.queueMovie && !queue.some((m) => m.id === snap.id)) {
        queue.splice(Math.min(Math.max(snap.queueIndex, 0), queue.length), 0, snap.queueMovie);
      }
      return {
        ...s,
        queue,
        collections: {
          ...s.collections,
          watched: setEntry(s.collections.watched, snap.id, snap.watched, (x) => x.watchedAt),
          dismissed: setEntry(s.collections.dismissed, snap.id, snap.dismissed, (x) => x.dismissedAt),
          watchLater: setEntry(s.collections.watchLater, snap.id, snap.watchLater, (x) => x.addedAt),
        },
      };
    });

  const skip = useCallback(
    (movie: Movie) => {
      skipped.current.add(movie.id);
      setState((s) => ({ ...s, queue: removeMovie(s.queue, movie.id) }));
      track({ name: "card_action", params: { action: "skipped", movie_id: movie.id, match_bucket: matchBucket(movie.matchPercentage) } });
      trackInteraction();
      void refillIfNeeded();
    },
    [setState, refillIfNeeded, trackInteraction],
  );

  const markWatched = useCallback(
    async (movie: MovieRef, rating: number) => {
      const snap = snapshot(movie.id);
      skipped.current.delete(movie.id);
      setState((s) => ({
        ...s,
        queue: removeMovie(s.queue, movie.id),
        collections: {
          ...s.collections,
          watched: setEntry(s.collections.watched, movie.id, { movieId: movie.id, title: movie.title, posterPath: movie.posterPath, rating, watchedAt: new Date(), ...tasteFieldsOf(movie) }, (x) => x.watchedAt),
          dismissed: setEntry(s.collections.dismissed, movie.id, undefined, (x) => x.dismissedAt),
          watchLater: setEntry(s.collections.watchLater, movie.id, undefined, (x) => x.addedAt),
        },
      }));
      try {
        await recordWatched(uid, movie, rating, { dismissed: !!snap.dismissed, inWatchLater: !!snap.watchLater });
        toast.current("success", "Marked as watched");
        track({ name: "card_action", params: { action: "rated", movie_id: movie.id, match_bucket: matchBucket((movie as Partial<Movie>).matchPercentage), rating } });
        trackInteraction();
        void refillIfNeeded();
      } catch (err) {
        console.error("Failed to save watched movie", err);
        restore(snap);
        toast.current("error", "Couldn't save that rating. Please try again.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, setState, refillIfNeeded, trackInteraction],
  );

  const dismiss = useCallback(
    async (movie: Movie, reason: DismissalReason) => {
      const snap = snapshot(movie.id);
      skipped.current.delete(movie.id);
      setState((s) => ({
        ...s,
        queue: removeMovie(s.queue, movie.id),
        collections: {
          ...s.collections,
          dismissed: setEntry(s.collections.dismissed, movie.id, { movieId: movie.id, title: movie.title, posterPath: movie.posterPath, reason, customReason: null, dismissedAt: new Date() }, (x) => x.dismissedAt),
          watchLater: setEntry(s.collections.watchLater, movie.id, undefined, (x) => x.addedAt),
        },
      }));
      try {
        await recordDismissed(uid, movie, reason, { inWatchLater: !!snap.watchLater });
        toast.current("success", "Got it — improving your picks");
        track({
          name: "card_action",
          params: { action: "dismissed", movie_id: movie.id, match_bucket: matchBucket(movie.matchPercentage), dismiss_reason: reason === "Other (specify)" ? "Other" : reason },
        });
        trackInteraction();
        void refillIfNeeded();
      } catch (err) {
        console.error("Failed to save dismissed movie", err);
        restore(snap);
        toast.current("error", "Couldn't save that. Please try again.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, setState, refillIfNeeded, trackInteraction],
  );

  const saveForLater = useCallback(
    async (movie: Movie) => {
      const snap = snapshot(movie.id);
      setState((s) => ({
        ...s,
        queue: removeMovie(s.queue, movie.id),
        collections: {
          ...s.collections,
          dismissed: setEntry(s.collections.dismissed, movie.id, undefined, (x) => x.dismissedAt),
          watchLater: setEntry(s.collections.watchLater, movie.id, { movieId: movie.id, title: movie.title, posterPath: movie.posterPath, voteAverage: movie.voteAverage, releaseDate: movie.releaseDate, addedAt: new Date() }, (x) => x.addedAt),
        },
      }));
      try {
        await recordWatchLater(uid, movie, { dismissed: !!snap.dismissed });
        toast.current("success", "Added to Watch Later");
        track({ name: "card_action", params: { action: "watch_later", movie_id: movie.id, match_bucket: matchBucket(movie.matchPercentage) } });
        trackInteraction();
        void refillIfNeeded();
      } catch (err) {
        console.error("Failed to save to watch later", err);
        restore(snap);
        toast.current("error", "Couldn't save to Watch Later. Please try again.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, setState, refillIfNeeded, trackInteraction],
  );

  const removeFromWatchLater = useCallback(
    async (movieId: number) => {
      const snap = snapshot(movieId);
      setState((s) => ({
        ...s,
        collections: { ...s.collections, watchLater: setEntry(s.collections.watchLater, movieId, undefined, (x) => x.addedAt) },
      }));
      try {
        await removeWatchLater(uid, movieId);
        toast.current("success", "Removed from Watch Later");
      } catch (err) {
        console.error("Failed to remove from watch later", err);
        restore(snap);
        toast.current("error", "Couldn't remove that. Please try again.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, setState],
  );

  return {
    phase: state.phase,
    error: state.error,
    current: state.queue[0] ?? null,
    upNext: state.queue.slice(1, 5),
    queueLength: state.queue.length,
    refilling: state.refilling,
    exhausted: state.exhausted,
    refillFailed: state.refillFailed,
    refillError: state.error,
    watchLater: state.collections.watchLater,
    dismissedIds: new Set(state.collections.dismissed.map((d) => d.movieId)),
    reload: load,
    skip,
    markWatched,
    dismiss,
    saveForLater,
    removeFromWatchLater,
  };
}
