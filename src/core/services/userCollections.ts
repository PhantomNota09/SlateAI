import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { MovieRef, Movie } from "../models/Movie";
import type { DismissalReason } from "../models/UserPreferences";
import type { WatchedRecommendation } from "../models/WatchedRecommendation";
import type { DismissedRecommendation } from "../models/DismissedRecommendation";
import type { WatchLaterItem } from "../models/WatchLaterItem";

// Reads and writes for the per-user subcollections (spec §2), mirroring iOS
// WatchedViewModel / DismissedViewModel / WatchLaterViewModel and the side effects in
// RecommendationCoordinator. Doc ID is the TMDb movie ID as a string. userStats
// aggregation (counts, ratings, badges) is done server-side by the Cloud Functions the
// moment a watchedRecommendations doc is written — nothing to write for that here.

export interface UserCollections {
  watched: WatchedRecommendation[];
  dismissed: DismissedRecommendation[];
  watchLater: WatchLaterItem[];
  letterboxdIds: number[];
}

export const VALID_RATINGS = Array.from({ length: 10 }, (_, i) => (i + 1) / 2); // 0.5 … 5.0

const userDoc = (uid: string, sub: string, movieId: number) => doc(db, "users", uid, sub, String(movieId));

function toDate(value: unknown): Date {
  const v = value as { toDate?: () => Date } | undefined;
  return typeof v?.toDate === "function" ? v.toDate() : new Date(0);
}

const idOf = (d: QueryDocumentSnapshot<DocumentData>): number => Number(d.data().movieId ?? d.id);
const byNewest = (a: Date, b: Date) => b.getTime() - a.getTime();

// Sorted client-side on purpose: Firestore's orderBy silently drops documents that lack the
// field, and a dropped watched/dismissed/watch-later entry would let that movie be
// recommended again.
export async function loadUserCollections(uid: string): Promise<UserCollections> {
  const sub = (name: string) => getDocs(collection(db, "users", uid, name));
  const [watched, dismissed, watchLater, letterboxd] = await Promise.all([
    sub("watchedRecommendations"),
    sub("dismissedRecommendations"),
    sub("watchLater"),
    sub("letterboxdData"),
  ]);

  return {
    watched: watched.docs
      .map((d): WatchedRecommendation => ({
        movieId: idOf(d),
        title: d.data().title ?? "",
        posterPath: d.data().posterPath ?? null,
        rating: Number(d.data().rating ?? 0),
        watchedAt: toDate(d.data().watchedAt),
      }))
      .sort((a, b) => byNewest(a.watchedAt, b.watchedAt)),
    dismissed: dismissed.docs
      .map((d): DismissedRecommendation => ({
        movieId: idOf(d),
        title: d.data().title ?? "",
        posterPath: d.data().posterPath ?? null,
        reason: d.data().reason,
        customReason: d.data().customReason ?? null,
        dismissedAt: toDate(d.data().dismissedAt),
      }))
      .sort((a, b) => byNewest(a.dismissedAt, b.dismissedAt)),
    watchLater: watchLater.docs
      .map((d): WatchLaterItem => ({
        movieId: idOf(d),
        title: d.data().title ?? "",
        posterPath: d.data().posterPath ?? null,
        voteAverage: Number(d.data().voteAverage ?? 0),
        releaseDate: d.data().releaseDate ?? null,
        addedAt: toDate(d.data().addedAt),
      }))
      .sort((a, b) => byNewest(a.addedAt, b.addedAt)),
    letterboxdIds: letterboxd.docs.map(idOf).filter((n) => Number.isFinite(n)),
  };
}

// "Already watched" with a rating. Also clears the movie from dismissed / watch later if it
// was there (RecommendationCoordinator.markAsWatched) — in one atomic batch, so a failure
// can't leave the movie both watched and still in watch later.
export async function recordWatched(
  uid: string,
  movie: MovieRef,
  rating: number,
  was: { dismissed: boolean; inWatchLater: boolean },
): Promise<void> {
  if (!VALID_RATINGS.includes(rating)) throw new Error(`Invalid rating: ${rating}`);
  const batch = writeBatch(db);
  if (was.dismissed) batch.delete(userDoc(uid, "dismissedRecommendations", movie.id));
  if (was.inWatchLater) batch.delete(userDoc(uid, "watchLater", movie.id));
  batch.set(userDoc(uid, "watchedRecommendations", movie.id), {
    movieId: movie.id,
    title: movie.title,
    posterPath: movie.posterPath,
    rating,
    watchedAt: serverTimestamp(),
  });
  await batch.commit();
}

// "Not for me". Removes the movie from watch later if present (coordinator.dismissMovie).
// iOS stores no custom text, so customReason is always null.
export async function recordDismissed(
  uid: string,
  movie: MovieRef,
  reason: DismissalReason,
  was: { inWatchLater: boolean },
): Promise<void> {
  const batch = writeBatch(db);
  if (was.inWatchLater) batch.delete(userDoc(uid, "watchLater", movie.id));
  batch.set(userDoc(uid, "dismissedRecommendations", movie.id), {
    movieId: movie.id,
    title: movie.title,
    posterPath: movie.posterPath,
    reason,
    customReason: null,
    dismissedAt: serverTimestamp(),
  });
  await batch.commit();
}

// Removes the movie from dismissed if present (coordinator.addToWatchLater).
export async function recordWatchLater(
  uid: string,
  movie: Pick<Movie, "id" | "title" | "posterPath" | "voteAverage" | "releaseDate">,
  was: { dismissed: boolean },
): Promise<void> {
  const batch = writeBatch(db);
  if (was.dismissed) batch.delete(userDoc(uid, "dismissedRecommendations", movie.id));
  batch.set(userDoc(uid, "watchLater", movie.id), {
    movieId: movie.id,
    title: movie.title,
    posterPath: movie.posterPath,
    voteAverage: movie.voteAverage,
    releaseDate: movie.releaseDate,
    addedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function removeWatchLater(uid: string, movieId: number): Promise<void> {
  await deleteDoc(userDoc(uid, "watchLater", movieId));
}

// Undo "Not for me": the movie can be recommended again.
export async function removeDismissed(uid: string, movieId: number): Promise<void> {
  await deleteDoc(userDoc(uid, "dismissedRecommendations", movieId));
}

// Live size of the Watch Later list, for the nav badge. Local writes update it immediately.
export function subscribeWatchLaterCount(uid: string, onCount: (count: number) => void, onError: (err: unknown) => void): Unsubscribe {
  return onSnapshot(collection(db, "users", uid, "watchLater"), (snap) => onCount(snap.size), onError);
}
