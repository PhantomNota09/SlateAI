// `users/{uid}/watchedRecommendations/{movieId}` — doc ID is the TMDb movie ID as a string.
import type { TasteFields } from "./Movie";

export interface WatchedRecommendation extends TasteFields {
  movieId: number;
  title: string;
  posterPath: string | null;
  rating: number;
  watchedAt: Date;
}
