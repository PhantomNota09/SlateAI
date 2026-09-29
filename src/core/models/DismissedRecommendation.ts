import type { DismissalReason } from "./UserPreferences";

// `users/{uid}/dismissedRecommendations/{movieId}`
export interface DismissedRecommendation {
  movieId: number;
  title: string;
  posterPath: string | null;
  reason: DismissalReason;
  customReason: string | null;
  dismissedAt: Date;
}
