import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { computeStreak } from "../streak/streakLogic";

// Records a meaningful interaction for the streak (iOS StreakService.recordInteraction).
// Runs in a transaction so two devices acting at once can't both count the same day, and
// writes only the fields the rules let a client update. It never creates userStats (rules
// forbid client creates; the onUserCreated function owns that), and any failure is non-fatal:
// a missed streak tick must never get in the way of rating a movie.
export type StreakResult =
  | { kind: "first"; streak: number; badgeId: string | null }
  | { kind: "extended"; streak: number; badgeId: string | null }
  | { kind: "reset"; streak: number; badgeId: string | null }
  | { kind: "already" }
  | { kind: "skipped" } // no userStats document yet
  | { kind: "failed" };

export async function recordStreakInteraction(uid: string, now: Date = new Date()): Promise<StreakResult> {
  try {
    return await runTransaction(db, async (tx): Promise<StreakResult> => {
      const ref = doc(db, "userStats", uid);
      const snap = await tx.get(ref);
      if (!snap.exists()) return { kind: "skipped" };

      const { event, badgeId, update } = computeStreak(snap.data(), now);
      if (event.kind === "already" || !update) return { kind: "already" };

      tx.update(ref, { ...update });
      return { kind: event.kind, streak: event.streak, badgeId };
    });
  } catch (err) {
    console.error("Failed to record streak interaction", err);
    return { kind: "failed" };
  }
}
