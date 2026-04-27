/**
 * Seasonal Rewards Rotation Service
 * Limited-edition rewards that rotate monthly with exclusive items
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type Season = "spring" | "summer" | "fall" | "winter";
export type RewardCategory = "cosmetic" | "subscription" | "discount" | "badge" | "exclusive";

export interface SeasonalReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  season: Season;
  category: RewardCategory;
  limited: boolean;
  totalAvailable: number;
  claimedCount: number;
  exclusive: boolean;
  image?: string;
  seasonStart: Date;
  seasonEnd: Date;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface SeasonalBadge {
  id: string;
  name: string;
  description: string;
  season: Season;
  icon: string;
  unlockedAt?: Date;
}

const SEASONAL_REWARDS_KEY = "@motionfit_seasonal_rewards";
const SEASONAL_BADGES_KEY = "@motionfit_seasonal_badges";

/**
 * Get current season
 */
function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

/**
 * Get season date range
 */
function getSeasonDateRange(season: Season): { start: Date; end: Date } {
  const year = new Date().getFullYear();
  const ranges: Record<Season, { start: Date; end: Date }> = {
    spring: { start: new Date(year, 2, 1), end: new Date(year, 4, 30) },
    summer: { start: new Date(year, 5, 1), end: new Date(year, 7, 31) },
    fall: { start: new Date(year, 8, 1), end: new Date(year, 10, 30) },
    winter: { start: new Date(year, 11, 1), end: new Date(year + 1, 1, 28) },
  };
  return ranges[season];
}

/**
 * Create seasonal reward
 */
export async function createSeasonalReward(reward: Omit<SeasonalReward, "id">): Promise<SeasonalReward> {
  try {
    const id = `seasonal_${Date.now()}`;
    const fullReward: SeasonalReward = { ...reward, id };

    const rewards = await getSeasonalRewards();
    rewards.push(fullReward);
    await AsyncStorage.setItem(SEASONAL_REWARDS_KEY, JSON.stringify(rewards));

    return fullReward;
  } catch (error) {
    console.error("Failed to create seasonal reward:", error);
    throw error;
  }
}

/**
 * Get all seasonal rewards
 */
export async function getSeasonalRewards(): Promise<SeasonalReward[]> {
  try {
    const data = await AsyncStorage.getItem(SEASONAL_REWARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get seasonal rewards:", error);
    return [];
  }
}

/**
 * Get current season rewards
 */
export async function getCurrentSeasonRewards(): Promise<SeasonalReward[]> {
  try {
    const season = getCurrentSeason();
    const rewards = await getSeasonalRewards();
    return rewards.filter((r) => r.season === season && r.limited);
  } catch (error) {
    console.error("Failed to get current season rewards:", error);
    return [];
  }
}

/**
 * Get rewards by rarity
 */
export async function getRewardsByRarity(rarity: "common" | "rare" | "epic" | "legendary"): Promise<SeasonalReward[]> {
  try {
    const rewards = await getCurrentSeasonRewards();
    return rewards.filter((r) => r.rarity === rarity);
  } catch (error) {
    console.error("Failed to get rewards by rarity:", error);
    return [];
  }
}

/**
 * Claim seasonal reward
 */
export async function claimSeasonalReward(userId: string, rewardId: string): Promise<SeasonalReward | null> {
  try {
    const rewards = await getSeasonalRewards();
    const reward = rewards.find((r) => r.id === rewardId);

    if (!reward) {
      throw new Error("Reward not found");
    }

    if (reward.claimedCount >= reward.totalAvailable) {
      throw new Error("Reward sold out");
    }

    reward.claimedCount += 1;
    await AsyncStorage.setItem(SEASONAL_REWARDS_KEY, JSON.stringify(rewards));

    // Track user's claimed reward
    const userRewards = await getUserSeasonalRewards(userId);
    userRewards.push(rewardId);
    await AsyncStorage.setItem(`${SEASONAL_REWARDS_KEY}_${userId}`, JSON.stringify(userRewards));

    return reward;
  } catch (error) {
    console.error("Failed to claim seasonal reward:", error);
    throw error;
  }
}

/**
 * Get user's seasonal rewards
 */
export async function getUserSeasonalRewards(userId: string): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(`${SEASONAL_REWARDS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get user seasonal rewards:", error);
    return [];
  }
}

/**
 * Create seasonal badge
 */
export async function createSeasonalBadge(badge: Omit<SeasonalBadge, "id">): Promise<SeasonalBadge> {
  try {
    const id = `badge_${Date.now()}`;
    const fullBadge: SeasonalBadge = { ...badge, id };

    const badges = await getSeasonalBadges();
    badges.push(fullBadge);
    await AsyncStorage.setItem(SEASONAL_BADGES_KEY, JSON.stringify(badges));

    return fullBadge;
  } catch (error) {
    console.error("Failed to create seasonal badge:", error);
    throw error;
  }
}

/**
 * Get seasonal badges
 */
export async function getSeasonalBadges(): Promise<SeasonalBadge[]> {
  try {
    const data = await AsyncStorage.getItem(SEASONAL_BADGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get seasonal badges:", error);
    return [];
  }
}

/**
 * Get current season badges
 */
export async function getCurrentSeasonBadges(): Promise<SeasonalBadge[]> {
  try {
    const season = getCurrentSeason();
    const badges = await getSeasonalBadges();
    return badges.filter((b) => b.season === season);
  } catch (error) {
    console.error("Failed to get current season badges:", error);
    return [];
  }
}

/**
 * Unlock seasonal badge for user
 */
export async function unlockSeasonalBadge(userId: string, badgeId: string): Promise<void> {
  try {
    const badges = await getSeasonalBadges();
    const badge = badges.find((b) => b.id === badgeId);

    if (!badge) {
      throw new Error("Badge not found");
    }

    // Mark badge as unlocked
    const userBadges = await getUserSeasonalBadges(userId);
    if (!userBadges.includes(badgeId)) {
      userBadges.push(badgeId);
      await AsyncStorage.setItem(`${SEASONAL_BADGES_KEY}_${userId}`, JSON.stringify(userBadges));
    }
  } catch (error) {
    console.error("Failed to unlock seasonal badge:", error);
  }
}

/**
 * Get user's seasonal badges
 */
export async function getUserSeasonalBadges(userId: string): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(`${SEASONAL_BADGES_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get user seasonal badges:", error);
    return [];
  }
}

/**
 * Get rotation schedule
 */
export function getRotationSchedule(): Array<{ season: Season; start: Date; end: Date }> {
  const year = new Date().getFullYear();
  return [
    {
      season: "spring",
      start: new Date(year, 2, 1),
      end: new Date(year, 4, 30),
    },
    {
      season: "summer",
      start: new Date(year, 5, 1),
      end: new Date(year, 7, 31),
    },
    {
      season: "fall",
      start: new Date(year, 8, 1),
      end: new Date(year, 10, 30),
    },
    {
      season: "winter",
      start: new Date(year, 11, 1),
      end: new Date(year + 1, 1, 28),
    },
  ];
}

/**
 * Get time until next season
 */
export function getTimeUntilNextSeason(): number {
  const schedule = getRotationSchedule();
  const now = new Date();
  const currentSeason = schedule.find((s) => now >= s.start && now <= s.end);

  if (!currentSeason) {
    return schedule[0].start.getTime() - now.getTime();
  }

  const nextSeason = schedule[schedule.indexOf(currentSeason) + 1] || schedule[0];
  return nextSeason.start.getTime() - now.getTime();
}
