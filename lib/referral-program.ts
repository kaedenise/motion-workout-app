/**
 * Referral Program Service
 * Viral growth through referrals with tiered rewards and tracking
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type ReferralTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface ReferralUser {
  userId: string;
  joinedAt: Date;
  pointsEarned: number;
  completed: boolean;
}

export interface ReferralProgram {
  userId: string;
  referralCode: string;
  referredUsers: ReferralUser[];
  totalPointsEarned: number;
  totalReferrals: number;
  tier: ReferralTier;
  createdAt: Date;
}

export interface ReferralReward {
  tier: ReferralTier;
  minReferrals: number;
  pointsPerReferral: number;
  bonusPoints: number;
  badge: string;
  perks: string[];
}

const REFERRAL_KEY = "@motionfit_referral_program";
const REFERRAL_REWARDS: ReferralReward[] = [
  {
    tier: "bronze",
    minReferrals: 0,
    pointsPerReferral: 500,
    bonusPoints: 0,
    badge: "🥉",
    perks: ["Basic referral tracking"],
  },
  {
    tier: "silver",
    minReferrals: 3,
    pointsPerReferral: 750,
    bonusPoints: 1000,
    badge: "🥈",
    perks: ["Increased points", "Referral analytics"],
  },
  {
    tier: "gold",
    minReferrals: 10,
    pointsPerReferral: 1000,
    bonusPoints: 5000,
    badge: "🥇",
    perks: ["Premium perks", "Custom badge"],
  },
  {
    tier: "platinum",
    minReferrals: 25,
    pointsPerReferral: 1500,
    bonusPoints: 15000,
    badge: "💎",
    perks: ["VIP status", "Exclusive rewards"],
  },
  {
    tier: "diamond",
    minReferrals: 50,
    pointsPerReferral: 2000,
    bonusPoints: 50000,
    badge: "👑",
    perks: ["Elite status", "Lifetime benefits"],
  },
];

/**
 * Create referral program for user
 */
export async function createReferralProgram(userId: string): Promise<ReferralProgram> {
  try {
    const referralCode = generateReferralCode(userId);
    const program: ReferralProgram = {
      userId,
      referralCode,
      referredUsers: [],
      totalPointsEarned: 0,
      totalReferrals: 0,
      tier: "bronze",
      createdAt: new Date(),
    };

    const programs = await getAllReferralPrograms();
    programs.push(program);
    await AsyncStorage.setItem(REFERRAL_KEY, JSON.stringify(programs));

    return program;
  } catch (error) {
    console.error("Failed to create referral program:", error);
    throw error;
  }
}

/**
 * Generate unique referral code
 */
function generateReferralCode(userId: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "MOTION";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get referral program for user
 */
export async function getReferralProgram(userId: string): Promise<ReferralProgram | null> {
  try {
    const programs = await getAllReferralPrograms();
    return programs.find((p) => p.userId === userId) || null;
  } catch (error) {
    console.error("Failed to get referral program:", error);
    return null;
  }
}

/**
 * Get all referral programs
 */
async function getAllReferralPrograms(): Promise<ReferralProgram[]> {
  try {
    const data = await AsyncStorage.getItem(REFERRAL_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get referral programs:", error);
    return [];
  }
}

/**
 * Redeem referral code
 */
export async function redeemReferralCode(referralCode: string, newUserId: string): Promise<number> {
  try {
    const programs = await getAllReferralPrograms();
    const referrerProgram = programs.find((p) => p.referralCode === referralCode);

    if (!referrerProgram) {
      throw new Error("Invalid referral code");
    }

    // Check if user already referred
    if (referrerProgram.referredUsers.some((u) => u.userId === newUserId)) {
      throw new Error("User already referred");
    }

    // Add referred user
    const referralReward = getReferralReward(referrerProgram.tier);
    const pointsAwarded = referralReward.pointsPerReferral;

    referrerProgram.referredUsers.push({
      userId: newUserId,
      joinedAt: new Date(),
      pointsEarned: pointsAwarded,
      completed: false,
    });

    referrerProgram.totalReferrals += 1;
    referrerProgram.totalPointsEarned += pointsAwarded;

    // Update tier
    referrerProgram.tier = calculateReferralTier(referrerProgram.totalReferrals);

    // Award bonus if tier changed
    const newReward = getReferralReward(referrerProgram.tier);
    if (newReward.bonusPoints > 0 && referrerProgram.totalReferrals === newReward.minReferrals) {
      referrerProgram.totalPointsEarned += newReward.bonusPoints;
    }

    await AsyncStorage.setItem(REFERRAL_KEY, JSON.stringify(programs));

    // Award points to new user as well
    const newUserBonus = 250; // Sign-up bonus for using referral
    return pointsAwarded + newUserBonus;
  } catch (error) {
    console.error("Failed to redeem referral code:", error);
    throw error;
  }
}

/**
 * Calculate referral tier based on number of referrals
 */
function calculateReferralTier(referralCount: number): ReferralTier {
  if (referralCount >= 50) return "diamond";
  if (referralCount >= 25) return "platinum";
  if (referralCount >= 10) return "gold";
  if (referralCount >= 3) return "silver";
  return "bronze";
}

/**
 * Get referral reward for tier
 */
function getReferralReward(tier: ReferralTier): ReferralReward {
  return REFERRAL_REWARDS.find((r) => r.tier === tier) || REFERRAL_REWARDS[0];
}

/**
 * Mark referral as completed (new user completed first workout)
 */
export async function completeReferral(referrerUserId: string, newUserId: string): Promise<void> {
  try {
    const program = await getReferralProgram(referrerUserId);
    if (!program) return;

    const referredUser = program.referredUsers.find((u) => u.userId === newUserId);
    if (referredUser) {
      referredUser.completed = true;
      // Could award bonus points here
    }

    const programs = await getAllReferralPrograms();
    const index = programs.findIndex((p) => p.userId === referrerUserId);
    if (index >= 0) {
      programs[index] = program;
      await AsyncStorage.setItem(REFERRAL_KEY, JSON.stringify(programs));
    }
  } catch (error) {
    console.error("Failed to complete referral:", error);
  }
}

/**
 * Get referral statistics
 */
export async function getReferralStats(userId: string): Promise<{
  totalReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  totalPointsEarned: number;
  tier: ReferralTier;
  nextTierReferrals: number;
}> {
  try {
    const program = await getReferralProgram(userId);
    if (!program) {
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        completedReferrals: 0,
        totalPointsEarned: 0,
        tier: "bronze",
        nextTierReferrals: 3,
      };
    }

    const currentReward = getReferralReward(program.tier);
    const nextTier = REFERRAL_REWARDS.find((r) => r.minReferrals > program.totalReferrals);

    return {
      totalReferrals: program.totalReferrals,
      activeReferrals: program.referredUsers.filter((u) => !u.completed).length,
      completedReferrals: program.referredUsers.filter((u) => u.completed).length,
      totalPointsEarned: program.totalPointsEarned,
      tier: program.tier,
      nextTierReferrals: nextTier ? nextTier.minReferrals : program.totalReferrals + 25,
    };
  } catch (error) {
    console.error("Failed to get referral stats:", error);
    throw error;
  }
}

/**
 * Get all referral rewards
 */
export function getAllReferralRewards(): ReferralReward[] {
  return REFERRAL_REWARDS;
}
