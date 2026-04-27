/**
 * Enhanced User Profile Context
 * Complete user management with preferences, settings, and data persistence
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type FitnessLevel = "beginner" | "intermediate" | "advanced" | "elite";
export type Goal = "weight_loss" | "muscle_gain" | "endurance" | "flexibility" | "general_health";
export type Theme = "light" | "dark" | "auto";

export interface UserProfile {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  fitnessLevel: FitnessLevel;
  goals: Goal[];
  age?: number;
  weight?: number; // kg
  height?: number; // cm
  gender?: "male" | "female" | "other";
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  userId: string;
  theme: Theme;
  notifications: {
    enabled: boolean;
    challenges: boolean;
    achievements: boolean;
    leaderboard: boolean;
    friendActivity: boolean;
    workoutReminders: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showStats: boolean;
    allowFriendRequests: boolean;
  };
  language: string;
  units: "metric" | "imperial";
  dailyGoals: {
    steps: number;
    calories: number;
    workoutMinutes: number;
    waterIntake: number; // ml
  };
}

export interface UserStats {
  userId: string;
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  totalSteps: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xp: number;
  badges: string[];
  achievements: string[];
  lastActiveAt: Date;
}

const USER_PROFILE_KEY = "@motionfit_user_profile";
const USER_PREFERENCES_KEY = "@motionfit_user_preferences";
const USER_STATS_KEY = "@motionfit_user_stats";

/**
 * Create or update user profile
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Failed to save user profile:", error);
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!data) return null;

    const profile = JSON.parse(data);
    return profile.userId === userId ? profile : null;
  } catch (error) {
    console.error("Failed to get user profile:", error);
    return null;
  }
}

/**
 * Update user profile fields
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const updated: UserProfile = {
      ...profile,
      ...updates,
      userId, // Ensure userId doesn't change
      updatedAt: new Date(),
    };

    await saveUserProfile(updated);
    return updated;
  } catch (error) {
    console.error("Failed to update user profile:", error);
    throw error;
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
    if (!data) {
      return getDefaultPreferences(userId);
    }

    const prefs = JSON.parse(data);
    return prefs.userId === userId ? prefs : getDefaultPreferences(userId);
  } catch (error) {
    console.error("Failed to get user preferences:", error);
    return getDefaultPreferences(userId);
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
  try {
    const prefs = await getUserPreferences(userId);
    const updated: UserPreferences = {
      ...prefs,
      ...updates,
      userId, // Ensure userId doesn't change
    };

    await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Failed to update user preferences:", error);
    throw error;
  }
}

/**
 * Get default preferences
 */
function getDefaultPreferences(userId: string): UserPreferences {
  return {
    userId,
    theme: "auto",
    notifications: {
      enabled: true,
      challenges: true,
      achievements: true,
      leaderboard: true,
      friendActivity: true,
      workoutReminders: true,
    },
    privacy: {
      profilePublic: false,
      showStats: true,
      allowFriendRequests: true,
    },
    language: "en",
    units: "metric",
    dailyGoals: {
      steps: 10000,
      calories: 2000,
      workoutMinutes: 30,
      waterIntake: 2000,
    },
  };
}

/**
 * Get user stats
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const data = await AsyncStorage.getItem(`${USER_STATS_KEY}_${userId}`);
    if (!data) {
      return getDefaultStats(userId);
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to get user stats:", error);
    return getDefaultStats(userId);
  }
}

/**
 * Update user stats
 */
export async function updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats> {
  try {
    const stats = await getUserStats(userId);
    const updated: UserStats = {
      ...stats,
      ...updates,
      userId, // Ensure userId doesn't change
      lastActiveAt: new Date(),
    };

    await AsyncStorage.setItem(`${USER_STATS_KEY}_${userId}`, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Failed to update user stats:", error);
    throw error;
  }
}

/**
 * Get default stats
 */
function getDefaultStats(userId: string): UserStats {
  return {
    userId,
    totalWorkouts: 0,
    totalMinutes: 0,
    totalCalories: 0,
    totalSteps: 0,
    currentStreak: 0,
    longestStreak: 0,
    level: 1,
    xp: 0,
    badges: [],
    achievements: [],
    lastActiveAt: new Date(),
  };
}

/**
 * Add XP to user
 */
export async function addXP(userId: string, amount: number): Promise<{ newXP: number; levelUp: boolean; newLevel: number }> {
  try {
    const stats = await getUserStats(userId);
    const newXP = stats.xp + amount;
    const xpPerLevel = 1000;
    const newLevel = Math.floor(newXP / xpPerLevel) + 1;
    const levelUp = newLevel > stats.level;

    await updateUserStats(userId, {
      xp: newXP,
      level: newLevel,
    });

    return { newXP, levelUp, newLevel };
  } catch (error) {
    console.error("Failed to add XP:", error);
    throw error;
  }
}

/**
 * Add badge to user
 */
export async function addBadge(userId: string, badgeId: string): Promise<void> {
  try {
    const stats = await getUserStats(userId);
    if (!stats.badges.includes(badgeId)) {
      stats.badges.push(badgeId);
      await updateUserStats(userId, { badges: stats.badges });
    }
  } catch (error) {
    console.error("Failed to add badge:", error);
  }
}

/**
 * Add achievement to user
 */
export async function addAchievement(userId: string, achievementId: string): Promise<void> {
  try {
    const stats = await getUserStats(userId);
    if (!stats.achievements.includes(achievementId)) {
      stats.achievements.push(achievementId);
      await updateUserStats(userId, { achievements: stats.achievements });
    }
  } catch (error) {
    console.error("Failed to add achievement:", error);
  }
}

/**
 * Update streak
 */
export async function updateStreak(userId: string, workoutCompleted: boolean): Promise<{ currentStreak: number; longestStreak: number }> {
  try {
    const stats = await getUserStats(userId);
    let newStreak = stats.currentStreak;

    if (workoutCompleted) {
      newStreak = stats.currentStreak + 1;
    } else {
      newStreak = 0;
    }

    const newLongest = Math.max(newStreak, stats.longestStreak);

    await updateUserStats(userId, {
      currentStreak: newStreak,
      longestStreak: newLongest,
    });

    return { currentStreak: newStreak, longestStreak: newLongest };
  } catch (error) {
    console.error("Failed to update streak:", error);
    throw error;
  }
}

/**
 * Export user data
 */
export async function exportUserData(userId: string): Promise<{
  profile: UserProfile | null;
  preferences: UserPreferences;
  stats: UserStats;
  exportDate: Date;
}> {
  try {
    const profile = await getUserProfile(userId);
    const preferences = await getUserPreferences(userId);
    const stats = await getUserStats(userId);

    return {
      profile,
      preferences,
      stats,
      exportDate: new Date(),
    };
  } catch (error) {
    console.error("Failed to export user data:", error);
    throw error;
  }
}

/**
 * Delete user account and all data
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
    await AsyncStorage.removeItem(USER_PREFERENCES_KEY);
    await AsyncStorage.removeItem(`${USER_STATS_KEY}_${userId}`);
    console.log("User account deleted:", userId);
  } catch (error) {
    console.error("Failed to delete user account:", error);
    throw error;
  }
}
