import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { leaderboard, type InsertLeaderboardEntry } from "../drizzle/schema";

export async function upsertLeaderboardEntry(
  phoneNumber: string,
  data: Omit<InsertLeaderboardEntry, "id" | "phoneNumber" | "updatedAt">
) {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(leaderboard)
    .where(eq(leaderboard.phoneNumber, phoneNumber))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(leaderboard)
      .set({
        displayName: data.displayName,
        avatarId: data.avatarId,
        xp: data.xp,
        totalReps: data.totalReps,
        totalWorkouts: data.totalWorkouts,
        currentStreak: data.currentStreak,
        levelTitle: data.levelTitle,
      })
      .where(eq(leaderboard.phoneNumber, phoneNumber));
  } else {
    await db.insert(leaderboard).values({ phoneNumber, ...data });
  }
}

export async function getTopLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(leaderboard)
    .orderBy(desc(leaderboard.xp))
    .limit(limit);
}

export async function getUserRank(phoneNumber: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const all = await db
    .select({ phoneNumber: leaderboard.phoneNumber, xp: leaderboard.xp })
    .from(leaderboard)
    .orderBy(desc(leaderboard.xp));

  const idx = all.findIndex((e: { phoneNumber: string | null; xp: number }) => e.phoneNumber === phoneNumber);
  return idx === -1 ? 0 : idx + 1;
}
