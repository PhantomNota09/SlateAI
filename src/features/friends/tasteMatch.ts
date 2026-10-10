// Taste match between two users — a straight port of FriendsViewModel.calculateTasteMatch so the
// same pair of people sees the same score and label on iOS and the web.
import type { UserStats } from "../../core/models/UserStats";
import type { WatchedRecommendation } from "../../core/models/WatchedRecommendation";

export interface TasteMatch {
  label: string;
  score: number; // 0–100
  insights: string[];
  sharedCount: number;
}

export function calculateTasteMatch(
  myHistory: readonly WatchedRecommendation[],
  friendHistory: readonly WatchedRecommendation[],
  my: Pick<UserStats, "topGenres" | "avgRating">,
  friend: Pick<UserStats, "topGenres" | "avgRating">,
): TasteMatch {
  const myIds = new Set(myHistory.map((m) => m.movieId));
  const friendIds = new Set(friendHistory.map((m) => m.movieId));
  const shared = [...myIds].filter((id) => friendIds.has(id));
  const sharedCount = shared.length;
  const smaller = Math.min(myIds.size, friendIds.size);
  const overlap = smaller > 0 ? Math.min(1, sharedCount / smaller) : 0;

  const ratings = (h: readonly WatchedRecommendation[]) => new Map(h.filter((x) => x.rating > 0).map((x) => [x.movieId, x.rating] as const));
  const mine = ratings(myHistory);
  const theirs = ratings(friendHistory);
  const deltas = shared.flatMap((id) => (mine.has(id) && theirs.has(id) ? [Math.abs(mine.get(id)! - theirs.get(id)!)] : []));

  let agreement = 0;
  let meanDelta = 0;
  if (sharedCount >= 3 && deltas.length > 0) {
    meanDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    agreement = deltas.map((d) => Math.max(0, 1 - d / 2.5)).reduce((a, b) => a + b, 0) / deltas.length;
  }

  const myGenres = new Set(my.topGenres);
  const friendGenres = new Set(friend.topGenres);
  const sharedGenres = [...myGenres].filter((g) => friendGenres.has(g));
  const allGenres = new Set([...myGenres, ...friendGenres]);
  const genreAffinity = allGenres.size === 0 ? 0 : sharedGenres.length / allGenres.size;

  const style = Math.max(0, 1 - Math.abs(my.avgRating - friend.avgRating) / 2.5);

  const raw = sharedCount >= 3 ? 0.3 * overlap + 0.35 * agreement + 0.25 * genreAffinity + 0.1 * style : 0.45 * overlap + 0.4 * genreAffinity + 0.15 * style;
  const score = Math.round(raw * 100);

  const label =
    score >= 85 ? "Cinematic Soulmates" : score >= 70 ? "Film Twins" : score >= 55 ? "Kindred Spirits" : score >= 40 ? "Common Ground" : score >= 25 ? "Different Tastes" : "Uncharted Territory";

  const insights: string[] = [];
  if (sharedCount >= 5) insights.push(`You've both seen ${sharedCount} of the same films`);
  if (sharedCount >= 3 && deltas.length > 0) {
    if (agreement >= 0.75) insights.push(`You rate films almost identically — within ${meanDelta.toFixed(1)}★ on average`);
    else if (agreement < 0.4) insights.push("You've watched the same films but rarely agree on them");
  }
  if (sharedGenres.length >= 2) insights.push(`You both gravitate toward ${[...sharedGenres].sort().slice(0, 2).join(" and ")}`);
  else if (sharedGenres.length === 1) insights.push(`You both gravitate toward ${sharedGenres[0]}`);
  if (overlap >= 0.6 && sharedCount >= 10 && insights.length < 3) insights.push("Huge overlap — you've been watching in parallel");
  if (my.avgRating >= 3.8 && friend.avgRating >= 3.8 && insights.length < 3) insights.push("You're both generous raters — everything gets love");
  else if (my.avgRating <= 2.8 && friend.avgRating <= 2.8 && insights.length < 3) insights.push("You're both tough critics — only the best makes the cut");
  if (sharedCount === 0 && insights.length === 0) insights.push("No overlap yet — discover what they've been watching");

  return { label, score, insights: insights.slice(0, 3), sharedCount };
}
