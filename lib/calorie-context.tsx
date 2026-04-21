import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FoodItem,
  DailyNutrition,
  NutritionGoals,
  DEFAULT_NUTRITION_GOALS,
  getTodayDate,
} from "./calorie-tracker";

interface CalorieContextType {
  dailyNutrition: DailyNutrition;
  goals: NutritionGoals;
  isLoading: boolean;
  addFoodItem: (item: Omit<FoodItem, "id" | "timestamp">) => Promise<void>;
  removeFoodItem: (foodId: string) => Promise<void>;
  updateFoodItem: (foodId: string, updates: Partial<FoodItem>) => Promise<void>;
  loadDailyNutrition: (date?: string) => Promise<void>;
  setGoals: (goals: NutritionGoals) => Promise<void>;
  refreshNutrition: () => Promise<void>;
}

const CalorieContext = createContext<CalorieContextType | null>(null);

const STORAGE_KEY_PREFIX = "calorie_";
const GOALS_STORAGE_KEY = "nutrition_goals";

export function CalorieProvider({ children }: { children: React.ReactNode }) {
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition>({
    date: getTodayDate(),
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0,
    foods: [],
  });

  const [goals, setGoalsState] = useState<NutritionGoals>(DEFAULT_NUTRITION_GOALS);
  const [isLoading, setIsLoading] = useState(true);

  // Load nutrition goals on mount
  useEffect(() => {
    loadGoals();
    loadDailyNutrition();
  }, []);

  const loadGoals = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
      if (stored) {
        setGoalsState(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load nutrition goals:", error);
    }
  }, []);

  const loadDailyNutrition = useCallback(async (date?: string) => {
    setIsLoading(true);
    try {
      const targetDate = date || getTodayDate();
      const key = `${STORAGE_KEY_PREFIX}${targetDate}`;
      const stored = await AsyncStorage.getItem(key);

      if (stored) {
        setDailyNutrition(JSON.parse(stored));
      } else {
        // Initialize empty nutrition for this date
        setDailyNutrition({
          date: targetDate,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          foods: [],
        });
      }
    } catch (error) {
      console.error("Failed to load daily nutrition:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateTotals = useCallback((foods: FoodItem[]): Omit<DailyNutrition, "date" | "foods"> => {
    return {
      totalCalories: foods.reduce((sum, f) => sum + f.calories, 0),
      totalProtein: foods.reduce((sum, f) => sum + f.protein, 0),
      totalCarbs: foods.reduce((sum, f) => sum + f.carbs, 0),
      totalFat: foods.reduce((sum, f) => sum + f.fat, 0),
      totalFiber: foods.reduce((sum, f) => sum + f.fiber, 0),
    };
  }, []);

  const saveDailyNutrition = useCallback(
    async (nutrition: DailyNutrition) => {
      try {
        const key = `${STORAGE_KEY_PREFIX}${nutrition.date}`;
        await AsyncStorage.setItem(key, JSON.stringify(nutrition));
      } catch (error) {
        console.error("Failed to save daily nutrition:", error);
      }
    },
    []
  );

  const addFoodItem = useCallback(
    async (item: Omit<FoodItem, "id" | "timestamp">) => {
      const newFood: FoodItem = {
        ...item,
        id: `food_${Date.now()}`,
        timestamp: Date.now(),
      };

      const updatedFoods = [...dailyNutrition.foods, newFood];
      const totals = calculateTotals(updatedFoods);
      const updated: DailyNutrition = {
        ...dailyNutrition,
        ...totals,
        foods: updatedFoods,
      };

      setDailyNutrition(updated);
      await saveDailyNutrition(updated);
    },
    [dailyNutrition, calculateTotals, saveDailyNutrition]
  );

  const removeFoodItem = useCallback(
    async (foodId: string) => {
      const updatedFoods = dailyNutrition.foods.filter((f) => f.id !== foodId);
      const totals = calculateTotals(updatedFoods);
      const updated: DailyNutrition = {
        ...dailyNutrition,
        ...totals,
        foods: updatedFoods,
      };

      setDailyNutrition(updated);
      await saveDailyNutrition(updated);
    },
    [dailyNutrition, calculateTotals, saveDailyNutrition]
  );

  const updateFoodItem = useCallback(
    async (foodId: string, updates: Partial<FoodItem>) => {
      const updatedFoods = dailyNutrition.foods.map((f) =>
        f.id === foodId ? { ...f, ...updates } : f
      );
      const totals = calculateTotals(updatedFoods);
      const updated: DailyNutrition = {
        ...dailyNutrition,
        ...totals,
        foods: updatedFoods,
      };

      setDailyNutrition(updated);
      await saveDailyNutrition(updated);
    },
    [dailyNutrition, calculateTotals, saveDailyNutrition]
  );

  const setGoals = useCallback(async (newGoals: NutritionGoals) => {
    setGoalsState(newGoals);
    try {
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(newGoals));
    } catch (error) {
      console.error("Failed to save nutrition goals:", error);
    }
  }, []);

  const refreshNutrition = useCallback(async () => {
    await loadDailyNutrition();
  }, [loadDailyNutrition]);

  return (
    <CalorieContext.Provider
      value={{
        dailyNutrition,
        goals,
        isLoading,
        addFoodItem,
        removeFoodItem,
        updateFoodItem,
        loadDailyNutrition,
        setGoals,
        refreshNutrition,
      }}
    >
      {children}
    </CalorieContext.Provider>
  );
}

export function useCalories() {
  const ctx = useContext(CalorieContext);
  if (!ctx) throw new Error("useCalories must be used within CalorieProvider");
  return ctx;
}
