import { collection, doc, documentId, getCountFromServer, getDoc, getDocs, limit, orderBy, query, where, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { parseLeaderboardEntry, scoreOf, type LeaderboardResult } from "../models/LeaderboardEntry";

// Leaderboard (iOS LeaderboardViewModel). Read-only: userStats is readable by any signed-in user.
// Unlike iOS this never writes back a corrected username (the rules only let the owner write their own).
const TOP = 10;
const IN_LIMIT = 30; // Firestore `in` queries take at most 30 values

const chunk = <T,>(items: T[], size: number): T[][] => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

// users/{uid}.username is written atomically at sign-up, so it wins over userStats.username.
async function authoritativeUsernames(uids: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  await Promise.all(
    chunk(uids, IN_LIMIT).map(async (ids) => {
      const snap = await getDocs(query(collection(db, "users"), where(documentId(), "in", ids)));
      snap.docs.forEach((d) => {
        const name = d.data().username;
        if (typeof name === "string" && name) names.set(d.id, name);
      });
    }),
  );
  return names;
}

const rowsOf = (docs: QueryDocumentSnapshot<DocumentData>[], names: Map<string, string>, me: string, firstRank: number) =>
  docs.map((d, i) => parseLeaderboardEntry(d.id, d.data(), firstRank + i, me, names.get(d.id)));

export async function loadGlobalLeaderboard(me: string): Promise<LeaderboardResult> {
  // Ordering by a field silently skips documents that lack it, so before totalMoviesRated exists
  // everywhere the query is repeated on moviesRated rather than showing an empty board.
  let field = "totalMoviesRated";
  let snap = await getDocs(query(collection(db, "userStats"), orderBy(field, "desc"), limit(TOP)));
  if (snap.empty) {
    field = "moviesRated";
    snap = await getDocs(query(collection(db, "userStats"), orderBy(field, "desc"), limit(TOP)));
  }
  const names = await authoritativeUsernames(snap.docs.map((d) => d.id));
  const entries = rowsOf(snap.docs, names, me, 1);
  if (entries.some((e) => e.isCurrentUser)) return { entries, me: null };

  const mine = await getDoc(doc(db, "userStats", me));
  if (!mine.exists()) return { entries, me: null };
  const data = mine.data();
  const myScore = typeof data[field] === "number" ? (data[field] as number) : scoreOf(data);
  const ahead = await getCountFromServer(query(collection(db, "userStats"), where(field, ">", myScore)));
  const myNames = await authoritativeUsernames([me]);
  return { entries, me: parseLeaderboardEntry(me, data, ahead.data().count + 1, me, myNames.get(me)) };
}

export async function loadFriendsLeaderboard(me: string, friendUids: string[]): Promise<LeaderboardResult> {
  const uids = [...new Set([...friendUids, me])];
  const docs = (
    await Promise.all(chunk(uids, IN_LIMIT).map((ids) => getDocs(query(collection(db, "userStats"), where(documentId(), "in", ids)))))
  ).flatMap((s) => s.docs);
  const names = await authoritativeUsernames(uids);
  const sorted = docs
    .map((d) => ({ d, score: scoreOf(d.data()) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.d);
  const all = rowsOf(sorted, names, me, 1);
  const entries = all.slice(0, TOP);
  return { entries, me: entries.some((e) => e.isCurrentUser) ? null : all.find((e) => e.isCurrentUser) ?? null };
}
