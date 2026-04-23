import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Meal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export interface MealPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  duration: number;
  meals: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
    snacks: Meal[];
  };
  startDate: number;
  endDate: number;
  completed: boolean;
  adherence: number;
}

export interface UserNutritionProfile {
  userId: string;
  age: number;
  gender: "male" | "female";
  weight: number;
  height: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  fitnessGoal: "weight_loss" | "muscle_gain" | "maintenance" | "endurance";
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

const MEAL_PLANS_KEY = "@motionfit_meal_plans";
const NUTRITION_PROFILE_KEY = "@motionfit_nutrition_profile";
const MEALS_KEY = "@motionfit_meals";

const SAMPLE_MEALS: Meal[] = [
  {
    id: "meal_oatmeal",
    name: "Protein Oatmeal",
    description: "High-protein oatmeal with berries and almonds",
    calories: 350,
    protein: 15,
    carbs: 45,
    fat: 8,
    fiber: 8,
    ingredients: ["1 cup oats", "1 scoop protein powder", "1 cup berries", "1/4 cup almonds", "1 cup milk"],
    instructions: ["Cook oats according to package", "Add protein powder", "Top with berries and almonds"],
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    difficulty: "easy",
    tags: ["breakfast", "high-protein", "quick"],
  },
  {
    id: "meal_chicken_rice",
    name: "Grilled Chicken & Brown Rice",
    description: "Lean protein with complex carbs",
    calories: 550,
    protein: 45,
    carbs: 55,
    fat: 8,
    fiber: 5,
    ingredients: ["200g chicken breast", "1 cup brown rice", "broccoli", "olive oil", "garlic"],
    instructions: ["Grill chicken breast", "Cook brown rice", "Steam broccoli", "Combine and season"],
    prepTime: 10,
    cookTime: 30,
    servings: 1,
    difficulty: "easy",
    tags: ["lunch", "dinner", "high-protein", "muscle-gain"],
  },
  {
    id: "meal_salmon",
    name: "Baked Salmon with Vegetables",
    description: "Omega-3 rich meal with roasted vegetables",
    calories: 480,
    protein: 40,
    carbs: 35,
    fat: 18,
    fiber: 6,
    ingredients: ["150g salmon", "sweet potato", "asparagus", "olive oil", "lemon"],
    instructions: ["Preheat oven to 400F", "Season salmon", "Roast vegetables", "Bake for 20 minutes"],
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    difficulty: "medium",
    tags: ["dinner", "omega-3", "healthy"],
  },
  {
    id: "meal_greek_yogurt",
    name: "Greek Yogurt Parfait",
    description: "Protein-rich snack with granola and honey",
    calories: 250,
    protein: 20,
    carbs: 30,
    fat: 4,
    fiber: 3,
    ingredients: ["1 cup Greek yogurt", "1/2 cup granola", "berries", "honey", "almonds"],
    instructions: ["Layer yogurt in bowl", "Add granola", "Top with berries", "Drizzle honey"],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: "easy",
    tags: ["snack", "breakfast", "high-protein"],
  },
];

/**
 * Create user nutrition profile
 */
export async function createNutritionProfile(userId: string, profile: UserNutritionProfile): Promise<void> {
  try {
    profile.userId = userId;
    await AsyncStorage.setItem(`${NUTRITION_PROFILE_KEY}_${userId}`, JSON.stringify(profile));
  } catch (error) {
    console.error("Failed to create nutrition profile:", error);
  }
}

/**
 * Get user nutrition profile
 */
export async function getNutritionProfile(userId: string): Promise<UserNutritionProfile | null> {
  try {
    const data = await AsyncStorage.getItem(`${NUTRITION_PROFILE_KEY}_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to get nutrition profile:", error);
    return null;
  }
}

/**
 * Generate AI meal plan based on user profile
 */
export async function generateAIMealPlan(userId: string, durationDays: number = 7): Promise<MealPlan | null> {
  try {
    const profile = await getNutritionProfile(userId);
    if (!profile) return null;

    const mealPlan: MealPlan = {
      id: `plan_${Date.now()}`,
      userId,
      name: `${durationDays}-Day Personalized Meal Plan`,
      description: `AI-generated meal plan for ${profile.fitnessGoal} goal`,
      dailyCalories: profile.targetCalories,
      dailyProtein: profile.targetProtein,
      dailyCarbs: profile.targetCarbs,
      dailyFat: profile.targetFat,
      duration: durationDays,
      meals: {
        breakfast: SAMPLE_MEALS.filter((m) => m.tags.includes("breakfast")).slice(0, 2),
        lunch: SAMPLE_MEALS.filter((m) => m.tags.includes("lunch")).slice(0, 2),
        dinner: SAMPLE_MEALS.filter((m) => m.tags.includes("dinner")).slice(0, 2),
        snacks: SAMPLE_MEALS.filter((m) => m.tags.includes("snack")).slice(0, 2),
      },
      startDate: Date.now(),
      endDate: Date.now() + durationDays * 24 * 60 * 60 * 1000,
      completed: false,
      adherence: 0,
    };

    const existing = await getMealPlans(userId);
    existing.push(mealPlan);
    await AsyncStorage.setItem(`${MEAL_PLANS_KEY}_${userId}`, JSON.stringify(existing));

    return mealPlan;
  } catch (error) {
    console.error("Failed to generate meal plan:", error);
    return null;
  }
}

/**
 * Get meal plans
 */
export async function getMealPlans(userId: string): Promise<MealPlan[]> {
  try {
    const data = await AsyncStorage.getItem(`${MEAL_PLANS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get meal plans:", error);
    return [];
  }
}

/**
 * Get active meal plan
 */
export async function getActiveMealPlan(userId: string): Promise<MealPlan | null> {
  try {
    const plans = await getMealPlans(userId);
    const now = Date.now();
    return plans.find((p) => p.startDate <= now && p.endDate >= now && !p.completed) || null;
  } catch (error) {
    console.error("Failed to get active meal plan:", error);
    return null;
  }
}

/**
 * Update meal plan adherence
 */
export async function updateMealPlanAdherence(userId: string, planId: string, adherence: number): Promise<void> {
  try {
    const plans = await getMealPlans(userId);
    const plan = plans.find((p) => p.id === planId);

    if (plan) {
      plan.adherence = Math.min(100, adherence);
      await AsyncStorage.setItem(`${MEAL_PLANS_KEY}_${userId}`, JSON.stringify(plans));
    }
  } catch (error) {
    console.error("Failed to update meal plan adherence:", error);
  }
}

/**
 * Complete meal plan
 */
export async function completeMealPlan(userId: string, planId: string): Promise<void> {
  try {
    const plans = await getMealPlans(userId);
    const plan = plans.find((p) => p.id === planId);

    if (plan) {
      plan.completed = true;
      await AsyncStorage.setItem(`${MEAL_PLANS_KEY}_${userId}`, JSON.stringify(plans));
    }
  } catch (error) {
    console.error("Failed to complete meal plan:", error);
  }
}

/**
 * Get meal by ID
 */
export function getMealById(mealId: string): Meal | undefined {
  return SAMPLE_MEALS.find((m) => m.id === mealId);
}

/**
 * Get meals by tag
 */
export function getMealsByTag(tag: string): Meal[] {
  return SAMPLE_MEALS.filter((m) => m.tags.includes(tag));
}

/**
 * Calculate daily nutrition totals
 */
export function calculateDailyNutrition(meals: Meal[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
} {
  return meals.reduce(
    (total, meal) => ({
      calories: total.calories + meal.calories,
      protein: total.protein + meal.protein,
      carbs: total.carbs + meal.carbs,
      fat: total.fat + meal.fat,
      fiber: total.fiber + meal.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

/**
 * Get meal recommendations based on remaining calories
 */
export function getMealRecommendations(
  remainingCalories: number,
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
): Meal[] {
  return SAMPLE_MEALS.filter((m) => m.tags.includes(mealType) && m.calories <= remainingCalories).slice(0, 3);
}

/**
 * Get all sample meals
 */
export function getAllMeals(): Meal[] {
  return SAMPLE_MEALS;
}

/**
 * Calculate macronutrient percentages
 */
export function calculateMacroPercentages(
  protein: number,
  carbs: number,
  fat: number
): { proteinPercent: number; carbsPercent: number; fatPercent: number } {
  const totalCalories = protein * 4 + carbs * 4 + fat * 9;
  return {
    proteinPercent: totalCalories > 0 ? Math.round((protein * 4) / totalCalories * 100) : 0,
    carbsPercent: totalCalories > 0 ? Math.round((carbs * 4) / totalCalories * 100) : 0,
    fatPercent: totalCalories > 0 ? Math.round((fat * 9) / totalCalories * 100) : 0,
  };
}
