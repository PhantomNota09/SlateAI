// `users/{uid}/letterboxdData/{movieId}` — mirrors iOS `LetterboxdMovie` (Codable). Swift's encoder
// omits nil optionals and stores Dates as Firestore Timestamps; the web writer does the same.
import { tasteFieldsFromDoc, type TasteFields } from "./Movie";

export interface LetterboxdMovie extends TasteFields {
  movieId: number;
  title: string;
  posterPath: string | null;
  letterboxdRating: number | null; // 0.5–5.0
  watchedDate: Date | null;
  importedAt: Date;
}

export type LetterboxdImportSource = "none" | "rss" | "csv" | "both";

const at = (v: unknown): Date | null => (typeof (v as { toDate?: () => Date })?.toDate === "function" ? (v as { toDate: () => Date }).toDate() : null);

// A stored letterboxdData document, or null if it has no usable movie id.
export function parseLetterboxdDoc(id: string, x: Record<string, unknown>): LetterboxdMovie | null {
  const movieId = Number(x.movieId ?? id);
  if (!Number.isFinite(movieId)) return null;
  return {
    movieId,
    title: String(x.title ?? ""),
    posterPath: typeof x.posterPath === "string" ? x.posterPath : null,
    letterboxdRating: typeof x.letterboxdRating === "number" ? x.letterboxdRating : null,
    watchedDate: at(x.watchedDate),
    importedAt: at(x.importedAt) ?? new Date(0),
    ...tasteFieldsFromDoc(x),
  };
}
