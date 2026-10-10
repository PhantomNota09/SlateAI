import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  parseFriendEntry,
  parseFriendRequest,
  type FriendEntry,
  type FriendRequest,
  type UserSearchResult,
} from "../models/Friends";
import type { WatchedRecommendation } from "../models/WatchedRecommendation";

// Firestore side of Friends (iOS FriendsViewModel). Accepting a request only flips its status:
// the onFriendRequestAccepted Cloud Function writes both users' friend entries.

export function subscribeFriends(uid: string, onData: (friends: FriendEntry[]) => void, onError: (err: unknown) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "users", uid, "friends"), orderBy("displayName")),
    (snap) => onData(snap.docs.map((d) => parseFriendEntry(d.id, d.data()))),
    onError,
  );
}

// Needs the composite index toUID + status + createdAt (firestore.indexes.json in the backend repo).
export function subscribeIncomingRequests(uid: string, onData: (requests: FriendRequest[]) => void, onError: (err: unknown) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "friendRequests"), where("toUID", "==", uid), where("status", "==", "pending"), orderBy("createdAt", "desc")),
    (snap) => onData(snap.docs.flatMap((d) => parseFriendRequest(d.id, d.data()) ?? [])),
    onError,
  );
}

export async function loadOutgoingPendingIds(uid: string): Promise<Set<string>> {
  const snap = await getDocs(query(collection(db, "friendRequests"), where("fromUID", "==", uid), where("status", "==", "pending")));
  return new Set(snap.docs.map((d) => String(d.data().toUID)));
}

// Prefix match on usernames/ (doc id is the username, data has userId), then resolve each hit to
// a profile summary: userStats first (accurate counts), users/{uid} for accounts without stats yet.
export async function searchUsersByUsername(rawQuery: string): Promise<UserSearchResult[]> {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 2) return [];
  const snap = await getDocs(
    query(collection(db, "usernames"), where(documentId(), ">=", q), where(documentId(), "<", q + ""), limit(15)),
  );
  const uids = [...new Set(snap.docs.map((d) => d.data().userId).filter((u): u is string => typeof u === "string"))];

  const resolved = await Promise.all(
    uids.map(async (uid): Promise<UserSearchResult | null> => {
      try {
        const stats = await getDoc(doc(db, "userStats", uid));
        if (stats.exists()) {
          const d = stats.data();
          return {
            uid,
            username: String(d.username ?? ""),
            displayName: String(d.displayName ?? ""),
            avatarURL: String(d.avatarURL ?? ""),
            moviesRated: Number(d.moviesRated ?? 0) + Number(d.letterboxdMoviesRated ?? 0),
          };
        }
      } catch (err) {
        console.warn("userStats lookup failed", uid, err);
      }
      try {
        const user = await getDoc(doc(db, "users", uid));
        if (user.exists()) {
          const d = user.data();
          return { uid, username: String(d.username ?? ""), displayName: String(d.name ?? ""), avatarURL: String(d.avatarURL ?? ""), moviesRated: 0 };
        }
      } catch (err) {
        console.warn("users lookup failed", uid, err);
      }
      return null;
    }),
  );
  return resolved.filter((r): r is UserSearchResult => r !== null && r.username !== "");
}

export async function sendFriendRequest(
  from: { uid: string; username: string; displayName: string; avatarURL: string },
  toUID: string,
): Promise<"sent" | "already-sent"> {
  const existing = await getDocs(
    query(collection(db, "friendRequests"), where("fromUID", "==", from.uid), where("toUID", "==", toUID), where("status", "==", "pending")),
  ).catch(() => null); // a failed check shouldn't block sending (iOS behaves the same)
  if (existing && !existing.empty) return "already-sent";

  await setDoc(doc(collection(db, "friendRequests")), {
    fromUID: from.uid,
    toUID,
    fromUsername: from.username,
    fromDisplayName: from.displayName,
    fromAvatarURL: from.avatarURL,
    status: "pending",
    createdAt: Timestamp.now(),
  });
  return "sent";
}

export async function respondToRequest(requestId: string, status: "accepted" | "rejected"): Promise<void> {
  await updateDoc(doc(db, "friendRequests", requestId), { status });
}

export async function cancelRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, "friendRequests", requestId));
}

export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "users", myUid, "friends", friendUid));
  batch.delete(doc(db, "users", friendUid, "friends", myUid));
  await batch.commit();
}

function toWatched(d: { id: string; data: () => Record<string, unknown> }): WatchedRecommendation {
  const x = d.data();
  const at = x.watchedAt as { toDate?: () => Date } | undefined;
  return {
    movieId: Number(x.movieId ?? d.id),
    title: typeof x.title === "string" ? x.title : "",
    posterPath: typeof x.posterPath === "string" ? x.posterPath : null,
    rating: typeof x.rating === "number" ? x.rating : 0,
    watchedAt: typeof at?.toDate === "function" ? at.toDate() : new Date(0),
  };
}

// Everything a friend has rated on Slate (used for the taste match). Rules let any signed-in user read it.
export async function loadWatchHistory(uid: string): Promise<WatchedRecommendation[]> {
  const snap = await getDocs(collection(db, "users", uid, "watchedRecommendations"));
  return snap.docs.map(toWatched).filter((w) => Number.isFinite(w.movieId));
}
