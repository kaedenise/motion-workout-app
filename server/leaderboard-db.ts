import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { leaderboard, type InsertLeaderboardEntry } from "../drizzle/schema";

export async function upsertLeaderboardEntry(
  userId: number,
  data: Omit<InsertLeaderboardEntry, "id" | "userId" | "updatedAt">
) {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(leaderboard)
    .where(eq(leaderboard.userId, userId))
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
      .where(eq(leaderboard.userId, userId));
  } else {
    await db.insert(leaderboard).values({ userId, ...data });
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

export async function getUserRank(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const all = await db
    .select({ userId: leaderboard.userId, xp: leaderboard.xp })
    .from(leaderboard)
    .orderBy(desc(leaderboard.xp));

  const idx = all.findIndex((e: { userId: number; xp: number }) => e.userId === userId);
  return idx === -1 ? 0 : idx + 1;
}
