import AsyncStorage from "@react-native-async-storage/async-storage";

export interface BotPlayer {
  id: string;
  displayName: string;
  avatarId: string;
  isBot: true;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  xp: number;
  totalReps: number;
  totalWorkouts: number;
  currentStreak: number;
  levelTitle: string;
  joinedDate: number;
  lastActivityDate: number;
  personality: "competitive" | "casual" | "grinder" | "social";
  winRate: number;
  achievements: string[];
}

export interface BotActivity {
  botId: string;
  activityType: "workout" | "challenge" | "achievement";
  xpGained: number;
  reps: number;
  timestamp: number;
  description: string;
}

const BOTS_KEY = "@motionfit_bots";
const BOT_ACTIVITIES_KEY = "@motionfit_bot_activities";

const BOT_NAMES = [
  "FitnessPro",
  "GymRat",
  "PowerLift",
  "CardioKing",
  "StrengthSeeker",
  "FitChampion",
  "WorkoutWarrior",
  "ExerciseExpert",
  "FitnessGuru",
  "MotionMaster",
  "RepCounter",
  "PumpItUp",
  "FlexMuscle",
  "EnduranceElite",
  "SpeedDemon",
];

const BOT_AVATARS = ["avatar_1", "avatar_2", "avatar_3", "avatar_4", "avatar_5"];

const BOT_PERSONALITIES = ["competitive", "casual", "grinder", "social"] as const;

/**
 * Create default bot players
 */
export async function initializeBots(): Promise<void> {
  try {
    const existing = await getBots();
    if (existing.length > 0) return;

    const bots: BotPlayer[] = [];

    for (let i = 0; i < 10; i++) {
      const tier = getTierByXP(Math.random() * 50000);
      const personality = BOT_PERSONALITIES[Math.floor(Math.random() * BOT_PERSONALITIES.length)];

      const bot: BotPlayer = {
        id: `bot_${i}`,
        displayName: BOT_NAMES[i],
        avatarId: BOT_AVATARS[i % BOT_AVATARS.length],
        isBot: true,
        tier,
        xp: Math.floor(Math.random() * 50000),
        totalReps: Math.floor(Math.random() * 5000),
        totalWorkouts: Math.floor(Math.random() * 500),
        currentStreak: Math.floor(Math.random() * 100),
        levelTitle: getLevelTitle(tier),
        joinedDate: Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
        lastActivityDate: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
        personality,
        winRate: Math.random() * 100,
        achievements: generateBotAchievements(),
      };

      bots.push(bot);
    }

    await AsyncStorage.setItem(BOTS_KEY, JSON.stringify(bots));
  } catch (error) {
    console.error("Failed to initialize bots:", error);
  }
}

/**
 * Get all bots
 */
export async function getBots(): Promise<BotPlayer[]> {
  try {
    const data = await AsyncStorage.getItem(BOTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get bots:", error);
    return [];
  }
}

/**
 * Get bot by ID
 */
export async function getBotById(botId: string): Promise<BotPlayer | null> {
  try {
    const bots = await getBots();
    return bots.find((b) => b.id === botId) || null;
  } catch (error) {
    console.error("Failed to get bot by ID:", error);
    return null;
  }
}

/**
 * Simulate bot activity and update XP
 */
export async function simulateBotActivity(): Promise<void> {
  try {
    const bots = await getBots();

    for (const bot of bots) {
      if (Math.random() > 0.7) {
        // 30% chance of activity
        const xpGain = Math.floor(Math.random() * 500) + 100;
        const reps = Math.floor(Math.random() * 100) + 20;

        bot.xp += xpGain;
        bot.totalReps += reps;
        bot.totalWorkouts += 1;
        bot.currentStreak += 1;
        bot.lastActivityDate = Date.now();

        const activity: BotActivity = {
          botId: bot.id,
          activityType: "workout",
          xpGained: xpGain,
          reps,
          timestamp: Date.now(),
          description: `${bot.displayName} completed a workout!`,
        };

        await recordBotActivity(activity);
      }
    }

    await AsyncStorage.setItem(BOTS_KEY, JSON.stringify(bots));
  } catch (error) {
    console.error("Failed to simulate bot activity:", error);
  }
}

/**
 * Record bot activity
 */
export async function recordBotActivity(activity: BotActivity): Promise<void> {
  try {
    const activities = await getBotActivities();
    activities.push(activity);

    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities.splice(0, activities.length - 1000);
    }

    await AsyncStorage.setItem(BOT_ACTIVITIES_KEY, JSON.stringify(activities));
  } catch (error) {
    console.error("Failed to record bot activity:", error);
  }
}

/**
 * Get bot activities
 */
export async function getBotActivities(): Promise<BotActivity[]> {
  try {
    const data = await AsyncStorage.getItem(BOT_ACTIVITIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get bot activities:", error);
    return [];
  }
}

/**
 * Get recent bot activities
 */
export async function getRecentBotActivities(limit: number = 10): Promise<BotActivity[]> {
  try {
    const activities = await getBotActivities();
    return activities.slice(-limit).reverse();
  } catch (error) {
    console.error("Failed to get recent bot activities:", error);
    return [];
  }
}

/**
 * Get tier by XP
 */
function getTierByXP(xp: number): BotPlayer["tier"] {
  if (xp < 5000) return "bronze";
  if (xp < 15000) return "silver";
  if (xp < 30000) return "gold";
  if (xp < 45000) return "platinum";
  return "diamond";
}

/**
 * Get level title by tier
 */
function getLevelTitle(tier: BotPlayer["tier"]): string {
  const titles: Record<BotPlayer["tier"], string> = {
    bronze: "Bronze Warrior",
    silver: "Silver Champion",
    gold: "Gold Master",
    platinum: "Platinum Legend",
    diamond: "Diamond Elite",
  };
  return titles[tier];
}

/**
 * Generate random bot achievements
 */
function generateBotAchievements(): string[] {
  const allAchievements = [
    "First 100 Reps",
    "7-Day Streak",
    "Top 10 Finish",
    "100 Workouts",
    "Form Master",
    "Speed Demon",
    "Consistency King",
    "Challenge Champion",
  ];

  const count = Math.floor(Math.random() * 5) + 1;
  const achievements: string[] = [];

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * allAchievements.length);
    if (!achievements.includes(allAchievements[idx])) {
      achievements.push(allAchievements[idx]);
    }
  }

  return achievements;
}

/**
 * Get bot leaderboard position
 */
export async function getBotLeaderboardPosition(botId: string): Promise<number> {
  try {
    const bots = await getBots();
    const sorted = [...bots].sort((a, b) => b.xp - a.xp);
    const idx = sorted.findIndex((b) => b.id === botId);
    return idx === -1 ? 0 : idx + 1;
  } catch (error) {
    console.error("Failed to get bot leaderboard position:", error);
    return 0;
  }
}

/**
 * Get top bots
 */
export async function getTopBots(limit: number = 10): Promise<BotPlayer[]> {
  try {
    const bots = await getBots();
    return bots.sort((a, b) => b.xp - a.xp).slice(0, limit);
  } catch (error) {
    console.error("Failed to get top bots:", error);
    return [];
  }
}

/**
 * Get bots by tier
 */
export async function getBotsByTier(tier: BotPlayer["tier"]): Promise<BotPlayer[]> {
  try {
    const bots = await getBots();
    return bots.filter((b) => b.tier === tier).sort((a, b) => b.xp - a.xp);
  } catch (error) {
    console.error("Failed to get bots by tier:", error);
    return [];
  }
}

/**
 * Get bot stats
 */
export async function getBotStats(): Promise<{
  totalBots: number;
  totalXP: number;
  totalReps: number;
  totalWorkouts: number;
  averageWinRate: number;
}> {
  try {
    const bots = await getBots();

    return {
      totalBots: bots.length,
      totalXP: bots.reduce((sum, b) => sum + b.xp, 0),
      totalReps: bots.reduce((sum, b) => sum + b.totalReps, 0),
      totalWorkouts: bots.reduce((sum, b) => sum + b.totalWorkouts, 0),
      averageWinRate: bots.reduce((sum, b) => sum + b.winRate, 0) / bots.length,
    };
  } catch (error) {
    console.error("Failed to get bot stats:", error);
    return {
      totalBots: 0,
      totalXP: 0,
      totalReps: 0,
      totalWorkouts: 0,
      averageWinRate: 0,
    };
  }
}

/**
 * Update bot after challenge
 */
export async function updateBotAfterChallenge(botId: string, xpGain: number, reps: number): Promise<void> {
  try {
    const bots = await getBots();
    const bot = bots.find((b) => b.id === botId);

    if (bot) {
      bot.xp += xpGain;
      bot.totalReps += reps;
      bot.totalWorkouts += 1;
      bot.currentStreak += 1;
      bot.lastActivityDate = Date.now();

      await AsyncStorage.setItem(BOTS_KEY, JSON.stringify(bots));

      const activity: BotActivity = {
        botId,
        activityType: "challenge",
        xpGained: xpGain,
        reps,
        timestamp: Date.now(),
        description: `${bot.displayName} won a challenge!`,
      };

      await recordBotActivity(activity);
    }
  } catch (error) {
    console.error("Failed to update bot after challenge:", error);
  }
}
