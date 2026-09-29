// `users/{uid}/watchLater/{movieId}`
export interface WatchLaterItem {
  movieId: number;
  title: string;
  posterPath: string | null;
  voteAverage: number;
  releaseDate: string | null;
  addedAt: Date;
}
