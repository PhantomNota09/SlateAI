import { BADGES } from "../models/badges";
import type { StreakResult } from "../services/streak";

// Toast copy for a streak result; null means stay quiet. A newly earned badge takes priority
// over the streak line (iOS shows the badge banner instead of a concurrent streak banner).
export function describeStreakResult(result: StreakResult): string | null {
  if (result.kind === "already" || result.kind === "skipped" || result.kind === "failed") return null;
  if (result.badgeId) {
    const badge = BADGES.find((b) => b.id === result.badgeId);
    if (badge) return `Badge unlocked: ${badge.name}`;
  }
  if (result.kind === "first") return "Streak started — come back tomorrow to keep it going";
  if (result.kind === "extended") return `${result.streak}-day streak`;
  return "New streak started";
}
