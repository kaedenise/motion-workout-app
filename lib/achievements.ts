import AsyncStorage from "@react-native-async-storage/async-storage";

export type AchievementCategory = "workout" | "streak" | "social" | "leaderboard" | "milestone";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  badge: string;
  xpReward: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  condition: string;
  unlockedDate?: number;
  progress?: number;
  maxProgress?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  achievementId: string;
  unlockedDate: number;
  displayOnProfile: boolean;
}

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  maxProgress: number;
  percentComplete: number;
}

const ACHIEVEMENTS_KEY = "@motionfit_achievements";
const BADGES_KEY = "@motionfit_badges";
const PROGRESS_KEY = "@motionfit_achievement_progress";

const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // Workout achievements
  {
    id: "first_workout",
    name: "First Step",
    description: "Complete your first workout",
    category: "workout",
    badge: "🎯",
    xpReward: 50,
    rarity: "common",
    condition: "totalWorkouts >= 1",
  },
  {
    id: "hundred_reps",
    name: "Century",
    description: "Complete 100 reps in a single workout",
    category: "workout",
    badge: "💯",
    xpReward: 200,
    rarity: "rare",
    condition: "singleWorkoutReps >= 100",
  },
  {
    id: "thousand_reps",
    name: "Thousand Strong",
    description: "Complete 1000 total reps",
    category: "workout",
    badge: "🔥",
    xpReward: 500,
    rarity: "epic",
    condition: "totalReps >= 1000",
  },
  {
    id: "five_thousand_reps",
    name: "Legendary",
    description: "Complete 5000 total reps",
    category: "workout",
    badge: "👑",
    xpReward: 2000,
    rarity: "legendary",
    condition: "totalReps >= 5000",
  },

  // Streak achievements
  {
    id: "three_day_streak",
    name: "On Fire",
    description: "Maintain a 3-day workout streak",
    category: "streak",
    badge: "🔥",
    xpReward: 100,
    rarity: "common",
    condition: "streak >= 3",
  },
  {
    id: "seven_day_streak",
    name: "Week Warrior",
    description: "Maintain a 7-day workout streak",
    category: "streak",
    badge: "⚡",
    xpReward: 300,
    rarity: "rare",
    condition: "streak >= 7",
  },
  {
    id: "thirty_day_streak",
    name: "Monthly Master",
    description: "Maintain a 30-day workout streak",
    category: "streak",
    badge: "💪",
    xpReward: 1000,
    rarity: "epic",
    condition: "streak >= 30",
  },

  // Leaderboard achievements
  {
    id: "top_100",
    name: "Rising Star",
    description: "Reach top 100 on leaderboard",
    category: "leaderboard",
    badge: "⭐",
    xpReward: 250,
    rarity: "rare",
    condition: "rank <= 100",
  },
  {
    id: "top_10",
    name: "Elite",
    description: "Reach top 10 on leaderboard",
    category: "leaderboard",
    badge: "🏆",
    xpReward: 500,
    rarity: "epic",
    condition: "rank <= 10",
  },
  {
    id: "number_one",
    name: "Champion",
    description: "Reach #1 on leaderboard",
    category: "leaderboard",
    badge: "👑",
    xpReward: 2000,
    rarity: "legendary",
    condition: "rank == 1",
  },

  // Social achievements
  {
    id: "first_friend_challenge",
    name: "Social Butterfly",
    description: "Challenge your first friend",
    category: "social",
    badge: "🦋",
    xpReward: 75,
    rarity: "common",
    condition: "friendChallenges >= 1",
  },
  {
    id: "ten_friend_challenges",
    name: "Challenge Master",
    description: "Challenge 10 friends",
    category: "social",
    badge: "🎯",
    xpReward: 300,
    rarity: "rare",
    condition: "friendChallenges >= 10",
  },

  // Milestone achievements
  {
    id: "gold_tier",
    name: "Golden",
    description: "Reach Gold tier",
    category: "milestone",
    badge: "🥇",
    xpReward: 400,
    rarity: "rare",
    condition: "tier == gold",
  },
  {
    id: "platinum_tier",
    name: "Platinum",
    description: "Reach Platinum tier",
    category: "milestone",
    badge: "💎",
    xpReward: 1000,
    rarity: "epic",
    condition: "tier == platinum",
  },
  {
    id: "diamond_tier",
    name: "Diamond",
    description: "Reach Diamond tier",
    category: "milestone",
    badge: "💠",
    xpReward: 2500,
    rarity: "legendary",
    condition: "tier == diamond",
  },
];

/**
 * Get all achievements
 */
export function getAllAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS;
}

/**
 * Get achievement by ID
 */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === category);
}

/**
 * Get unlocked badges
 */
export async function getUnlockedBadges(): Promise<Badge[]> {
  try {
    const data = await AsyncStorage.getItem(BADGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get unlocked badges:", error);
    return [];
  }
}

/**
 * Unlock achievement and create badge
 */
export async function unlockAchievement(achievementId: string): Promise<Badge | null> {
  try {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return null;

    const badges = await getUnlockedBadges();
    if (badges.find((b) => b.achievementId === achievementId)) {
      return null; // Already unlocked
    }

    const badge: Badge = {
      id: `badge_${Date.now()}`,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.badge,
      color: getRarityColor(achievement.rarity),
      achievementId,
      unlockedDate: Date.now(),
      displayOnProfile: true,
    };

    badges.push(badge);
    await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(badges));

    return badge;
  } catch (error) {
    console.error("Failed to unlock achievement:", error);
    return null;
  }
}

/**
 * Get badge count by rarity
 */
export async function getBadgeCountByRarity(): Promise<Record<string, number>> {
  try {
    const badges = await getUnlockedBadges();
    const counts: Record<string, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    badges.forEach((badge) => {
      const achievement = getAchievementById(badge.achievementId);
      if (achievement) {
        counts[achievement.rarity]++;
      }
    });

    return counts;
  } catch (error) {
    console.error("Failed to get badge counts:", error);
    return { common: 0, rare: 0, epic: 0, legendary: 0 };
  }
}

/**
 * Get rarity color
 */
function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: "#808080",
    rare: "#4169E1",
    epic: "#9932CC",
    legendary: "#FFD700",
  };
  return colors[rarity] || "#808080";
}

/**
 * Get achievement progress
 */
export async function getAchievementProgress(achievementId: string): Promise<AchievementProgress | null> {
  try {
    const data = await AsyncStorage.getItem(`${PROGRESS_KEY}_${achievementId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to get achievement progress:", error);
    return null;
  }
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  achievementId: string,
  progress: number,
  maxProgress: number
): Promise<void> {
  try {
    const progressData: AchievementProgress = {
      achievementId,
      progress,
      maxProgress,
      percentComplete: (progress / maxProgress) * 100,
    };

    await AsyncStorage.setItem(`${PROGRESS_KEY}_${achievementId}`, JSON.stringify(progressData));

    // Check if achievement should be unlocked
    if (progress >= maxProgress) {
      await unlockAchievement(achievementId);
    }
  } catch (error) {
    console.error("Failed to update achievement progress:", error);
  }
}

/**
 * Get total XP from achievements
 */
export async function getTotalAchievementXP(): Promise<number> {
  try {
    const badges = await getUnlockedBadges();
    return badges.reduce((total, badge) => {
      const achievement = getAchievementById(badge.achievementId);
      return total + (achievement?.xpReward || 0);
    }, 0);
  } catch (error) {
    console.error("Failed to get total achievement XP:", error);
    return 0;
  }
}

/**
 * Get achievement completion percentage
 */
export async function getAchievementCompletionPercent(): Promise<number> {
  try {
    const badges = await getUnlockedBadges();
    const total = ACHIEVEMENT_DEFINITIONS.length;
    return (badges.length / total) * 100;
  } catch (error) {
    console.error("Failed to get achievement completion percent:", error);
    return 0;
  }
}

/**
 * Get next achievable achievement
 */
export async function getNextAchievable(): Promise<Achievement | null> {
  try {
    const badges = await getUnlockedBadges();
    const unlockedIds = badges.map((b) => b.achievementId);

    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      if (!unlockedIds.includes(achievement.id)) {
        return achievement;
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to get next achievable:", error);
    return null;
  }
}
