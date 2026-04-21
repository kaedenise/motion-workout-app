/**
 * Calorie Tracker - AI-powered food recognition and nutrition tracking
 */

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  servingSize: string; // e.g., "1 cup", "100g"
  confidence: number; // 0-1, how confident the AI is
  imageUrl?: string; // URL to the food photo
  timestamp: number; // when it was logged
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  notes?: string;
}

export interface DailyNutrition {
  date: string; // ISO date string
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  foods: FoodItem[];
}

export interface NutritionGoals {
  dailyCalories: number; // default 2000
  dailyProtein: number; // grams
  dailyCarbs: number; // grams
  dailyFat: number; // grams
}

export interface AIFoodRecognitionResult {
  foodName: string;
  confidence: number; // 0-1
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  alternativeNames?: string[]; // other possible foods
  notes?: string;
}

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  dailyCalories: 2000,
  dailyProtein: 150, // ~30% of calories
  dailyCarbs: 225, // ~45% of calories
  dailyFat: 65, // ~25% of calories
};

/**
 * Calculate macronutrient percentages
 */
export function calculateMacroPercentages(nutrition: DailyNutrition) {
  const total = nutrition.totalCalories;
  if (total === 0) return { protein: 0, carbs: 0, fat: 0 };

  return {
    protein: Math.round((nutrition.totalProtein * 4) / total * 100),
    carbs: Math.round((nutrition.totalCarbs * 4) / total * 100),
    fat: Math.round((nutrition.totalFat * 9) / total * 100),
  };
}

/**
 * Calculate remaining calories for the day
 */
export function calculateRemainingCalories(
  daily: DailyNutrition,
  goals: NutritionGoals
) {
  return Math.max(0, goals.dailyCalories - daily.totalCalories);
}

/**
 * Get progress percentage for a nutrient
 */
export function getNutrientProgress(
  consumed: number,
  goal: number
): number {
  if (goal === 0) return 0;
  return Math.min(100, Math.round((consumed / goal) * 100));
}

/**
 * Format calorie display
 */
export function formatCalories(calories: number): string {
  return `${Math.round(calories)} cal`;
}

/**
 * Format macronutrient display
 */
export function formatMacro(grams: number, label: string): string {
  return `${Math.round(grams)}g ${label}`;
}

/**
 * Get meal type emoji
 */
export function getMealTypeEmoji(mealType: FoodItem["mealType"]): string {
  const emojis = {
    breakfast: "🌅",
    lunch: "🍽️",
    dinner: "🍽️",
    snack: "🍿",
  };
  return emojis[mealType];
}

/**
 * Get today's date in ISO format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Validate food item data
 */
export function validateFoodItem(item: Partial<FoodItem>): boolean {
  return !!(
    item.name &&
    item.calories !== undefined &&
    item.calories >= 0 &&
    item.protein !== undefined &&
    item.protein >= 0 &&
    item.carbs !== undefined &&
    item.carbs >= 0 &&
    item.fat !== undefined &&
    item.fat >= 0
  );
}

/**
 * Calculate calories from macronutrients
 * Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
 */
export function calculateCaloriesFromMacros(
  protein: number,
  carbs: number,
  fat: number
): number {
  return protein * 4 + carbs * 4 + fat * 9;
}
