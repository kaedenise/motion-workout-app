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
import { sendVerificationCodeSMS } from "./sms-service";

// In-memory store for verification codes (in production, use Redis)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

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

  phone: router({
    // Request SMS verification code
    requestCode: publicProcedure
      .input(z.object({ phoneNumber: z.string().min(10).max(20) }))
      .mutation(async ({ input }) => {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Send SMS
        const result = await sendVerificationCodeSMS(input.phoneNumber, code);
        if (!result.success) {
          throw new Error(result.error || "Failed to send SMS");
        }

        // Store code in memory (expires after 10 min)
        verificationCodes.set(input.phoneNumber, { code, expiresAt });

        return { success: true, messageId: result.messageId };
      }),

    // Verify the SMS code
    verifyCode: publicProcedure
      .input(
        z.object({
          phoneNumber: z.string().min(10).max(20),
          code: z.string().length(4),
        })
      )
      .mutation(async ({ input }) => {
        const stored = verificationCodes.get(input.phoneNumber);

        if (!stored) {
          return { success: false, error: "No code requested for this number" };
        }

        if (Date.now() > stored.expiresAt) {
          verificationCodes.delete(input.phoneNumber);
          return { success: false, error: "Code expired" };
        }

        if (input.code !== stored.code) {
          return { success: false, error: "Invalid code" };
        }

        // Code is valid
        verificationCodes.delete(input.phoneNumber);
        return { success: true };
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
