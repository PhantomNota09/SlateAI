// Friends data (iOS FriendModels.swift). Field names are the cross-platform contract.
//   users/{uid}/friends/{friendUID}   → FriendEntry (written by the onFriendRequestAccepted function)
//   friendRequests/{requestId}        → FriendRequest (top-level; what the Cloud Functions trigger on)
export interface FriendEntry {
  uid: string; // document id
  username: string;
  displayName: string;
  avatarURL: string;
  topGenres: string[];
  since: Date;
}

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequest {
  id: string;
  fromUID: string;
  toUID: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatarURL: string;
  status: FriendRequestStatus;
  createdAt: Date;
}

export interface UserSearchResult {
  uid: string;
  username: string;
  displayName: string;
  avatarURL: string;
  moviesRated: number;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const date = (v: unknown): Date => {
  const t = v as { toDate?: () => Date } | undefined;
  return typeof t?.toDate === "function" ? t.toDate() : new Date(0);
};

export function parseFriendEntry(uid: string, d: Record<string, unknown>): FriendEntry {
  return {
    uid,
    username: str(d.username),
    displayName: str(d.displayName),
    avatarURL: str(d.avatarURL),
    topGenres: Array.isArray(d.topGenres) ? d.topGenres.filter((g): g is string => typeof g === "string") : [],
    since: date(d.since),
  };
}

export function parseFriendRequest(id: string, d: Record<string, unknown>): FriendRequest | null {
  const fromUID = str(d.fromUID);
  const toUID = str(d.toUID);
  if (!fromUID || !toUID) return null;
  const status = d.status === "accepted" || d.status === "rejected" ? d.status : "pending";
  return { id, fromUID, toUID, fromUsername: str(d.fromUsername), fromDisplayName: str(d.fromDisplayName), fromAvatarURL: str(d.fromAvatarURL), status, createdAt: date(d.createdAt) };
}
