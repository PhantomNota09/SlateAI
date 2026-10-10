import { collection, doc, getDoc, getDocs, serverTimestamp, Timestamp, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { LetterboxdImportSource, LetterboxdMovie } from "../models/LetterboxdMovie";

// Firestore side of the Letterboxd import (iOS LetterboxdViewModel.addLetterboxdMoviesBatch and
// LetterboxdCSVImportService.updateLetterboxdMetadata). Writing a letterboxdData doc with a rating
// is what makes the server-side trigger count it in userStats and award the import badge.

export async function loadLetterboxdIds(uid: string): Promise<Set<number>> {
  const snap = await getDocs(collection(db, "users", uid, "letterboxdData"));
  const ids = snap.docs.map((d) => Number(d.data().movieId ?? d.id)).filter((n) => Number.isFinite(n));
  return new Set(ids);
}

// Same shape Swift's Codable writes: nil optionals are left out, Dates are Timestamps.
function toDoc(m: LetterboxdMovie) {
  return {
    movieId: m.movieId,
    title: m.title,
    ...(m.posterPath ? { posterPath: m.posterPath } : {}),
    ...(m.letterboxdRating != null ? { letterboxdRating: m.letterboxdRating } : {}),
    ...(m.watchedDate ? { watchedDate: Timestamp.fromDate(m.watchedDate) } : {}),
    importedAt: Timestamp.fromDate(m.importedAt),
  };
}

const CHUNK = 500; // Firestore's batch limit

export async function commitLetterboxdMovies(uid: string, movies: LetterboxdMovie[]): Promise<void> {
  for (let i = 0; i < movies.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const m of movies.slice(i, i + CHUNK)) {
      batch.set(doc(db, "users", uid, "letterboxdData", String(m.movieId)), toDoc(m));
    }
    await batch.commit();
  }
}

// An earlier RSS sync plus this CSV import becomes "both".
export function mergeImportSource(current: unknown): LetterboxdImportSource {
  return current === "rss" || current === "both" ? "both" : "csv";
}

export async function updateLetterboxdMetadata(uid: string, totalMovies: number): Promise<void> {
  const ref = doc(db, "users", uid);
  const current = (await getDoc(ref)).data()?.letterboxdImportSource;
  await updateDoc(ref, {
    letterboxdImportSource: mergeImportSource(current),
    letterboxdFullImportDate: serverTimestamp(),
    letterboxdTotalMoviesImported: totalMovies,
  });
}
