import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { TasteFields } from "../models/Movie";

// Adds genres/language/year to records that predate them. Touches only those fields: for a Slate
// record the rating and date are untouched, so the stats functions see no change (backend
// docs/WATCHED_STATS.md: an edit that doesn't change the rating does nothing).
export async function writeTasteFields(uid: string, target: { movieId: number; inWatched: boolean; inLetterboxd: boolean }, fields: TasteFields): Promise<void> {
  const id = String(target.movieId);
  const writes: Promise<void>[] = [];
  if (target.inWatched) writes.push(updateDoc(doc(db, "users", uid, "watchedRecommendations", id), { ...fields }));
  if (target.inLetterboxd) writes.push(updateDoc(doc(db, "users", uid, "letterboxdData", id), { ...fields }));
  await Promise.all(writes);
}
