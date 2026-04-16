import {} from "./schema";
import { relations } from "drizzle-orm";
import { users, leaderboard } from "./schema";

export const usersRelations = relations(users, ({ one }) => ({
  leaderboardEntry: one(leaderboard, {
    fields: [users.id],
    references: [leaderboard.userId],
  }),
}));

export const leaderboardRelations = relations(leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [leaderboard.userId],
    references: [users.id],
  }),
}));
