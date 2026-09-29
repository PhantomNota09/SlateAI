// `users/{uid}/watchedRecommendations/{movieId}` — doc ID is the TMDb movie ID as a string.
export interface WatchedRecommendation {
  movieId: number;
  title: string;
  posterPath: string | null;
  rating: number;
  watchedAt: Date;
}
