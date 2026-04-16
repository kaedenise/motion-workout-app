import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  upsertLeaderboardEntry,
  getTopLeaderboard,
  getUserRank,
} from "./leaderboard-db";
import { getLevelInfo } from "../lib/gamification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  leaderboard: router({
    // Get top 50 players
    getTop: publicProcedure.query(async () => {
      return getTopLeaderboard(50);
    }),

    // Submit/update the current user's score (phone auth)
    submit: publicProcedure
      .input(
        z.object({
          phoneNumber: z.string().min(10).max(20),
          displayName: z.string().min(1).max(64),
          avatarId: z.string().max(32),
          xp: z.number().int().min(0),
          totalReps: z.number().int().min(0),
          totalWorkouts: z.number().int().min(0),
          currentStreak: z.number().int().min(0),
        })
      )
      .mutation(async ({ input }) => {
        const levelInfo = getLevelInfo(input.xp);
        await upsertLeaderboardEntry(input.phoneNumber, {
          displayName: input.displayName,
          avatarId: input.avatarId,
          xp: input.xp,
          totalReps: input.totalReps,
          totalWorkouts: input.totalWorkouts,
          currentStreak: input.currentStreak,
          levelTitle: levelInfo.current.title,
        });
        return { success: true };
      }),

    // Get the current user's rank by phone
    myRank: publicProcedure
      .input(z.object({ phoneNumber: z.string() }))
      .query(async ({ input }) => {
        // For now, just return 0 — phone-based ranking would need a separate DB lookup
        return { rank: 0 };
      }),
  }),
});

export type AppRouter = typeof appRouter;
