// A row on the leaderboard (iOS LeaderboardEntry). The score is films rated: Slate + Letterboxd.
export interface LeaderboardEntry {
  rank: number; // 0 = unknown
  uid: string;
  username: string;
  displayName: string;
  avatarURL: string;
  score: number;
  topGenres: string[];
  isCurrentUser: boolean;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v : "");

// totalMoviesRated is stored by the Cloud Functions (= moviesRated + letterboxdMoviesRated); older
// documents without it fall back to adding the two parts.
export function scoreOf(stats: Record<string, unknown>): number {
  return typeof stats.totalMoviesRated === "number" ? stats.totalMoviesRated : num(stats.moviesRated) + num(stats.letterboxdMoviesRated);
}

// `username` is the authoritative one from users/{uid}; userStats.username can be stale.
export function parseLeaderboardEntry(uid: string, stats: Record<string, unknown>, rank: number, me: string, username?: string): LeaderboardEntry {
  return {
    rank,
    uid,
    username: username || str(stats.username),
    displayName: str(stats.displayName),
    avatarURL: str(stats.avatarURL),
    score: scoreOf(stats),
    topGenres: Array.isArray(stats.topGenres) ? stats.topGenres.filter((g): g is string => typeof g === "string") : [],
    isCurrentUser: uid === me,
  };
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[]; // top 10
  me: LeaderboardEntry | null; // your row when you're outside the top 10 (or the list is empty)
}
