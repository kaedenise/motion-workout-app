import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Reward types
 */
export type RewardType = "discount" | "subscription" | "merchandise" | "charity" | "premium_feature" | "exclusive_badge";

/**
 * Reward tier
 */
export type RewardTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

/**
 * Reward interface
 */
export interface Reward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  pointsCost: number;
  category: "fitness" | "nutrition" | "premium" | "charity" | "merchandise";
  partner?: string;
  discount?: number;
  expiresAt?: number;
  image?: string;
  tier: RewardTier;
  quantity?: number;
  claimedCount: number;
  totalAvailable: number;
  active: boolean;
}

/**
 * User reward redemption
 */
export interface RedemptionRecord {
  id: string;
  userId: string;
  rewardId: string;
  rewardName: string;
  pointsSpent: number;
  redeemedAt: number;
  expiresAt?: number;
  code?: string;
  status: "pending" | "claimed" | "expired" | "used";
}

/**
 * Partner integration
 */
export interface Partner {
  id: string;
  name: string;
  category: "gym" | "nutrition" | "apparel" | "charity";
  logo?: string;
  description: string;
  discountPercentage: number;
  pointsPerDollar: number;
  active: boolean;
}

/**
 * Leaderboard reward tier
 */
export interface LeaderboardRewardTier {
  tier: RewardTier;
  minRank: number;
  maxRank: number;
  weeklyBonusPoints: number;
  exclusiveRewards: string[];
  monthlyGiveaway: boolean;
}

const REWARDS_KEY = "@motionfit_rewards";
const REDEMPTIONS_KEY = "@motionfit_redemptions";
const PARTNERS_KEY = "@motionfit_partners";
const USER_POINTS_KEY = "@motionfit_user_points";

/**
 * Sample rewards
 */
const SAMPLE_REWARDS: Reward[] = [
  {
    id: "reward_premium_month",
    name: "1 Month Premium",
    description: "Unlock all premium features for 30 days",
    type: "subscription",
    pointsCost: 5000,
    category: "premium",
    tier: "gold",
    claimedCount: 245,
    totalAvailable: 500,
    active: true,
  },
  {
    id: "reward_gym_discount",
    name: "$50 Gym Credit",
    description: "Use at any partner gym nationwide",
    type: "discount",
    pointsCost: 3000,
    category: "fitness",
    partner: "FitnessPro Gyms",
    discount: 50,
    tier: "silver",
    claimedCount: 612,
    totalAvailable: 1000,
    active: true,
  },
  {
    id: "reward_nutrition_plan",
    name: "3-Month Meal Plan",
    description: "Personalized nutrition coaching and meal plans",
    type: "premium_feature",
    pointsCost: 4000,
    category: "nutrition",
    partner: "NutriCoach",
    tier: "gold",
    claimedCount: 189,
    totalAvailable: 300,
    active: true,
  },
  {
    id: "reward_charity_donation",
    name: "Donate to Fitness Charity",
    description: "$25 donation to youth fitness programs",
    type: "charity",
    pointsCost: 2000,
    category: "charity",
    tier: "bronze",
    claimedCount: 1245,
    totalAvailable: 10000,
    active: true,
  },
  {
    id: "reward_apparel",
    name: "MotionFit Exclusive Hoodie",
    description: "Limited edition branded hoodie",
    type: "merchandise",
    pointsCost: 3500,
    category: "merchandise",
    tier: "silver",
    claimedCount: 78,
    totalAvailable: 200,
    active: true,
  },
  {
    id: "reward_diamond_badge",
    name: "Diamond Elite Badge",
    description: "Exclusive profile badge for top performers",
    type: "exclusive_badge",
    pointsCost: 10000,
    category: "premium",
    tier: "diamond",
    claimedCount: 12,
    totalAvailable: 50,
    active: true,
  },
];

/**
 * Sample partners
 */
const SAMPLE_PARTNERS: Partner[] = [
  {
    id: "partner_fitnessgym",
    name: "FitnessPro Gyms",
    category: "gym",
    description: "Premium gym network with 500+ locations",
    discountPercentage: 15,
    pointsPerDollar: 1.5,
    active: true,
  },
  {
    id: "partner_nutricoach",
    name: "NutriCoach",
    category: "nutrition",
    description: "AI-powered nutrition coaching platform",
    discountPercentage: 20,
    pointsPerDollar: 2,
    active: true,
  },
  {
    id: "partner_fitapparel",
    name: "FitApparel Co",
    category: "apparel",
    description: "Premium fitness clothing and gear",
    discountPercentage: 25,
    pointsPerDollar: 1.8,
    active: true,
  },
  {
    id: "partner_charity",
    name: "Youth Fitness Foundation",
    category: "charity",
    description: "Supporting youth fitness programs",
    discountPercentage: 0,
    pointsPerDollar: 1,
    active: true,
  },
];

/**
 * Initialize rewards system
 */
export async function initializeRewardsSystem(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(REWARDS_KEY);
    if (!existing) {
      await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(SAMPLE_REWARDS));
      await AsyncStorage.setItem(PARTNERS_KEY, JSON.stringify(SAMPLE_PARTNERS));
    }
  } catch (error) {
    console.error("Failed to initialize rewards system:", error);
  }
}

/**
 * Get user points
 */
export async function getUserPoints(userId: string): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(`${USER_POINTS_KEY}_${userId}`);
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.error("Failed to get user points:", error);
    return 0;
  }
}

/**
 * Add points to user
 */
export async function addUserPoints(userId: string, points: number): Promise<void> {
  try {
    const current = await getUserPoints(userId);
    await AsyncStorage.setItem(`${USER_POINTS_KEY}_${userId}`, String(current + points));
  } catch (error) {
    console.error("Failed to add user points:", error);
  }
}

/**
 * Deduct points from user
 */
export async function deductUserPoints(userId: string, points: number): Promise<boolean> {
  try {
    const current = await getUserPoints(userId);
    if (current < points) return false;

    await AsyncStorage.setItem(`${USER_POINTS_KEY}_${userId}`, String(current - points));
    return true;
  } catch (error) {
    console.error("Failed to deduct user points:", error);
    return false;
  }
}

/**
 * Get all rewards
 */
export async function getAllRewards(): Promise<Reward[]> {
  try {
    const data = await AsyncStorage.getItem(REWARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get rewards:", error);
    return [];
  }
}

/**
 * Get rewards by tier
 */
export async function getRewardsByTier(tier: RewardTier): Promise<Reward[]> {
  try {
    const rewards = await getAllRewards();
    return rewards.filter((r) => r.tier === tier && r.active);
  } catch (error) {
    console.error("Failed to get rewards by tier:", error);
    return [];
  }
}

/**
 * Get rewards by category
 */
export async function getRewardsByCategory(category: string): Promise<Reward[]> {
  try {
    const rewards = await getAllRewards();
    return rewards.filter((r) => r.category === category && r.active);
  } catch (error) {
    console.error("Failed to get rewards by category:", error);
    return [];
  }
}

/**
 * Redeem reward
 */
export async function redeemReward(userId: string, rewardId: string): Promise<RedemptionRecord | null> {
  try {
    const rewards = await getAllRewards();
    const reward = rewards.find((r) => r.id === rewardId);

    if (!reward) return null;

    const success = await deductUserPoints(userId, reward.pointsCost);
    if (!success) return null;

    const redemption: RedemptionRecord = {
      id: `redemption_${Date.now()}`,
      userId,
      rewardId,
      rewardName: reward.name,
      pointsSpent: reward.pointsCost,
      redeemedAt: Date.now(),
      expiresAt: reward.expiresAt,
      code: generateRedemptionCode(),
      status: "pending",
    };

    const redemptions = await getRedemptions(userId);
    redemptions.push(redemption);
    await AsyncStorage.setItem(`${REDEMPTIONS_KEY}_${userId}`, JSON.stringify(redemptions));

    // Update reward claimed count
    reward.claimedCount += 1;
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));

    return redemption;
  } catch (error) {
    console.error("Failed to redeem reward:", error);
    return null;
  }
}

/**
 * Get user redemptions
 */
export async function getRedemptions(userId: string): Promise<RedemptionRecord[]> {
  try {
    const data = await AsyncStorage.getItem(`${REDEMPTIONS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get redemptions:", error);
    return [];
  }
}

/**
 * Get active redemptions
 */
export async function getActiveRedemptions(userId: string): Promise<RedemptionRecord[]> {
  try {
    const redemptions = await getRedemptions(userId);
    return redemptions.filter((r) => r.status === "pending" || r.status === "claimed");
  } catch (error) {
    console.error("Failed to get active redemptions:", error);
    return [];
  }
}

/**
 * Claim redemption
 */
export async function claimRedemption(userId: string, redemptionId: string): Promise<boolean> {
  try {
    const redemptions = await getRedemptions(userId);
    const redemption = redemptions.find((r) => r.id === redemptionId);

    if (!redemption) return false;

    redemption.status = "claimed";
    await AsyncStorage.setItem(`${REDEMPTIONS_KEY}_${userId}`, JSON.stringify(redemptions));

    return true;
  } catch (error) {
    console.error("Failed to claim redemption:", error);
    return false;
  }
}

/**
 * Get all partners
 */
export async function getAllPartners(): Promise<Partner[]> {
  try {
    const data = await AsyncStorage.getItem(PARTNERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get partners:", error);
    return [];
  }
}

/**
 * Get partners by category
 */
export async function getPartnersByCategory(category: string): Promise<Partner[]> {
  try {
    const partners = await getAllPartners();
    return partners.filter((p) => p.category === category && p.active);
  } catch (error) {
    console.error("Failed to get partners by category:", error);
    return [];
  }
}

/**
 * Calculate points earned from workout
 */
export function calculateWorkoutPoints(reps: number, difficulty: "easy" | "medium" | "hard"): number {
  const basePoints = reps * 10;
  const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 };
  return Math.floor(basePoints * difficultyMultiplier[difficulty]);
}

/**
 * Calculate points earned from challenge
 */
export function calculateChallengePoints(placement: number, totalParticipants: number): number {
  const basePoints = 1000;
  const placementBonus = Math.max(0, (totalParticipants - placement + 1) / totalParticipants) * 500;
  return Math.floor(basePoints + placementBonus);
}

/**
 * Calculate leaderboard bonus points
 */
export function calculateLeaderboardBonus(rank: number): number {
  if (rank <= 10) return 500;
  if (rank <= 50) return 250;
  if (rank <= 100) return 100;
  return 0;
}

/**
 * Get leaderboard reward tier
 */
export function getLeaderboardRewardTier(rank: number): LeaderboardRewardTier {
  const tiers: LeaderboardRewardTier[] = [
    {
      tier: "diamond",
      minRank: 1,
      maxRank: 10,
      weeklyBonusPoints: 500,
      exclusiveRewards: ["reward_diamond_badge"],
      monthlyGiveaway: true,
    },
    {
      tier: "platinum",
      minRank: 11,
      maxRank: 50,
      weeklyBonusPoints: 250,
      exclusiveRewards: ["reward_premium_month"],
      monthlyGiveaway: false,
    },
    {
      tier: "gold",
      minRank: 51,
      maxRank: 100,
      weeklyBonusPoints: 100,
      exclusiveRewards: ["reward_gym_discount"],
      monthlyGiveaway: false,
    },
    {
      tier: "silver",
      minRank: 101,
      maxRank: 500,
      weeklyBonusPoints: 50,
      exclusiveRewards: [],
      monthlyGiveaway: false,
    },
    {
      tier: "bronze",
      minRank: 501,
      maxRank: 999999,
      weeklyBonusPoints: 10,
      exclusiveRewards: [],
      monthlyGiveaway: false,
    },
  ];

  return tiers.find((t) => rank >= t.minRank && rank <= t.maxRank) || tiers[tiers.length - 1];
}

/**
 * Generate redemption code
 */
function generateRedemptionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get reward availability
 */
export function getRewardAvailability(reward: Reward): number {
  return reward.totalAvailable - reward.claimedCount;
}

/**
 * Check if reward is available
 */
export function isRewardAvailable(reward: Reward): boolean {
  return reward.active && getRewardAvailability(reward) > 0;
}
