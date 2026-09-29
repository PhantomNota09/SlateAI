import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { parseUserStats, type UserStats } from "../models/UserStats";
import type { WatchedRecommendation } from "../models/WatchedRecommendation";

// Read-only. userStats is written by Cloud Functions (and, for streaks/badges, by the client
// streak service) — the web profile never writes to it.
export async function loadUserStats(uid: string): Promise<UserStats | null> {
  const snap = await getDoc(doc(db, "userStats", uid));
  return snap.exists() ? parseUserStats(snap.data()) : null;
}

export async function loadRecentWatched(uid: string, count = 12): Promise<WatchedRecommendation[]> {
  const snap = await getDocs(
    query(collection(db, "users", uid, "watchedRecommendations"), orderBy("watchedAt", "desc"), limit(count)),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      movieId: Number(data.movieId ?? d.id),
      title: typeof data.title === "string" ? data.title : "",
      posterPath: typeof data.posterPath === "string" ? data.posterPath : null,
      rating: typeof data.rating === "number" ? data.rating : 0,
      watchedAt: typeof data.watchedAt?.toDate === "function" ? data.watchedAt.toDate() : new Date(0),
    };
  });
}
