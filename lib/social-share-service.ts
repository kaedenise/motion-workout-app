import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as Clipboard from "expo-clipboard";

export interface WorkoutShare {
  exerciseType: string;
  reps: number;
  duration: number;
  calories?: number;
  xpEarned: number;
  date: string;
}

export interface AchievementShare {
  name: string;
  description: string;
  unlockedDate: string;
}

export interface CalorieShare {
  totalCalories: number;
  goalCalories: number;
  date: string;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

/**
 * Generate workout share message
 */
export function generateWorkoutShareMessage(workout: WorkoutShare): string {
  return `🏋️ Just completed a workout on MotionFit!\n\n` +
    `Exercise: ${workout.exerciseType}\n` +
    `Reps: ${workout.reps}\n` +
    `Duration: ${workout.duration}s\n` +
    `XP Earned: +${workout.xpEarned} 🔥\n` +
    `${workout.calories ? `Calories: ${workout.calories}` : ""}\n\n` +
    `Join me on MotionFit - the ultimate fitness challenge app! 💪`;
}

/**
 * Generate achievement share message
 */
export function generateAchievementShareMessage(achievement: AchievementShare): string {
  return `🏆 Achievement Unlocked on MotionFit!\n\n` +
    `${achievement.name}\n` +
    `${achievement.description}\n\n` +
    `Can you unlock this too? Join MotionFit! 🚀`;
}

/**
 * Generate calorie milestone share message
 */
export function generateCalorieShareMessage(calorie: CalorieShare): string {
  const percentage = Math.round((calorie.totalCalories / calorie.goalCalories) * 100);
  return `🍎 Daily Nutrition Update on MotionFit!\n\n` +
    `Calories: ${calorie.totalCalories}/${calorie.goalCalories} (${percentage}%)\n` +
    `Protein: ${calorie.macros.protein}g\n` +
    `Carbs: ${calorie.macros.carbs}g\n` +
    `Fat: ${calorie.macros.fat}g\n\n` +
    `Track your nutrition with MotionFit! 💪`;
}

/**
 * Generate referral link
 */
export function generateReferralLink(userId: string): string {
  return `https://motionfit.app/join?ref=${userId}`;
}

/**
 * Share workout to social media
 */
export async function shareWorkout(workout: WorkoutShare) {
  const message = generateWorkoutShareMessage(workout);
  
  if (Platform.OS === "web") {
    // Copy to clipboard on web
    await Clipboard.setStringAsync(message);
    return { success: true, method: "clipboard" };
  }

  try {
    const result = await Sharing.shareAsync(message, {
      mimeType: "text/plain",
      UTI: "public.plain-text",
    });
    return { success: true, method: "share", result };
  } catch (error) {
    console.error("Failed to share workout:", error);
    // Fallback to clipboard
    await Clipboard.setStringAsync(message);
    return { success: true, method: "clipboard" };
  }
}

/**
 * Share achievement to social media
 */
export async function shareAchievement(achievement: AchievementShare) {
  const message = generateAchievementShareMessage(achievement);
  
  if (Platform.OS === "web") {
    await Clipboard.setStringAsync(message);
    return { success: true, method: "clipboard" };
  }

  try {
    const result = await Sharing.shareAsync(message, {
      mimeType: "text/plain",
      UTI: "public.plain-text",
    });
    return { success: true, method: "share", result };
  } catch (error) {
    console.error("Failed to share achievement:", error);
    await Clipboard.setStringAsync(message);
    return { success: true, method: "clipboard" };
  }
}

/**
 * Share calorie milestone to social media
 */
export async function shareCalorieMilestone(calorie: CalorieShare) {
  const message = generateCalorieShareMessage(calorie);
  
  if (Platform.OS === "web") {
    await Clipboard.setStringAsync(message);
    return { success: true, method: "clipboard" };
  }

  try {
    const result = await Sharing.shareAsync(message, {
      mimeType: "text/plain",
      UTI: "public.plain-text",
    });
    return { success: true, method: "share", result };
  } catch (error) {
    console.error("Failed to share calorie milestone:", error);
    await Clipboard.setStringAsync(message);
    return { success: true, method: "clipboard" };
  }
}

/**
 * Copy referral link to clipboard
 */
export async function copyReferralLink(userId: string) {
  const link = generateReferralLink(userId);
  await Clipboard.setStringAsync(link);
  return link;
}

/**
 * Share referral link
 */
export async function shareReferralLink(userId: string) {
  const link = generateReferralLink(userId);
  const message = `Join me on MotionFit - the ultimate fitness challenge app! 💪\n${link}`;
  
  if (Platform.OS === "web") {
    await Clipboard.setStringAsync(message);
    return { success: true, method: "clipboard" };
  }

  try {
    const result = await Sharing.shareAsync(message, {
      mimeType: "text/plain",
      UTI: "public.plain-text",
    });
    return { success: true, method: "share", result };
  } catch (error) {
    console.error("Failed to share referral link:", error);
    await Clipboard.setStringAsync(message);
    return { success: true, method: "clipboard" };
  }
}
