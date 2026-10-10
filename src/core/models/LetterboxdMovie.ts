// `users/{uid}/letterboxdData/{movieId}` — mirrors iOS `LetterboxdMovie` (Codable). Swift's encoder
// omits nil optionals and stores Dates as Firestore Timestamps; the web writer does the same.
export interface LetterboxdMovie {
  movieId: number;
  title: string;
  posterPath: string | null;
  letterboxdRating: number | null; // 0.5–5.0
  watchedDate: Date | null;
  importedAt: Date;
}

export type LetterboxdImportSource = "none" | "rss" | "csv" | "both";
