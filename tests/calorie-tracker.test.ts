import { describe, it, expect } from "vitest";
import {
  calculateMacroPercentages,
  calculateRemainingCalories,
  getNutrientProgress,
  formatCalories,
  formatMacro,
  getMealTypeEmoji,
  getTodayDate,
  validateFoodItem,
  calculateCaloriesFromMacros,
  DEFAULT_NUTRITION_GOALS,
  type DailyNutrition,
  type FoodItem,
  type NutritionGoals,
} from "../lib/calorie-tracker";

describe("Calorie Tracker Utilities", () => {
  const mockDaily: DailyNutrition = {
    date: "2026-04-21",
    totalCalories: 1500,
    totalProtein: 120,
    totalCarbs: 150,
    totalFat: 50,
    totalFiber: 25,
    foods: [],
  };

  const mockGoals: NutritionGoals = {
    dailyCalories: 2000,
    dailyProtein: 150,
    dailyCarbs: 225,
    dailyFat: 65,
  };

  describe("calculateMacroPercentages", () => {
    it("should calculate correct macro percentages", () => {
      const percentages = calculateMacroPercentages(mockDaily);
      expect(percentages.protein).toBe(32); // (120 * 4) / 1500 * 100
      expect(percentages.carbs).toBe(40); // (150 * 4) / 1500 * 100
      expect(percentages.fat).toBe(30); // (50 * 9) / 1500 * 100
    });

    it("should handle zero calories", () => {
      const empty: DailyNutrition = {
        ...mockDaily,
        totalCalories: 0,
      };
      const percentages = calculateMacroPercentages(empty);
      expect(percentages.protein).toBe(0);
      expect(percentages.carbs).toBe(0);
      expect(percentages.fat).toBe(0);
    });
  });

  describe("calculateRemainingCalories", () => {
    it("should calculate remaining calories correctly", () => {
      const remaining = calculateRemainingCalories(mockDaily, mockGoals);
      expect(remaining).toBe(500); // 2000 - 1500
    });

    it("should return 0 when over calorie goal", () => {
      const over: DailyNutrition = {
        ...mockDaily,
        totalCalories: 2500,
      };
      const remaining = calculateRemainingCalories(over, mockGoals);
      expect(remaining).toBe(0);
    });
  });

  describe("getNutrientProgress", () => {
    it("should calculate progress percentage", () => {
      const progress = getNutrientProgress(1500, 2000);
      expect(progress).toBe(75);
    });

    it("should cap at 100%", () => {
      const progress = getNutrientProgress(2500, 2000);
      expect(progress).toBe(100);
    });

    it("should handle zero goal", () => {
      const progress = getNutrientProgress(100, 0);
      expect(progress).toBe(0);
    });
  });

  describe("formatCalories", () => {
    it("should format calories correctly", () => {
      expect(formatCalories(1234.5)).toBe("1235 cal");
      expect(formatCalories(500)).toBe("500 cal");
      expect(formatCalories(0)).toBe("0 cal");
    });
  });

  describe("formatMacro", () => {
    it("should format macronutrients correctly", () => {
      expect(formatMacro(123.45, "P")).toBe("123g P");
      expect(formatMacro(50, "C")).toBe("50g C");
      expect(formatMacro(25.8, "F")).toBe("26g F");
    });
  });

  describe("getMealTypeEmoji", () => {
    it("should return correct emoji for meal type", () => {
      expect(getMealTypeEmoji("breakfast")).toBe("🌅");
      expect(getMealTypeEmoji("lunch")).toBe("🍽️");
      expect(getMealTypeEmoji("dinner")).toBe("🍽️");
      expect(getMealTypeEmoji("snack")).toBe("🍿");
    });
  });

  describe("getTodayDate", () => {
    it("should return today's date in ISO format", () => {
      const today = getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should be valid date", () => {
      const today = getTodayDate();
      const date = new Date(today);
      expect(date.toISOString().split("T")[0]).toBe(today);
    });
  });

  describe("validateFoodItem", () => {
    const validFood = {
      name: "Chicken Breast",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    };

    it("should validate complete food item", () => {
      expect(validateFoodItem(validFood)).toBe(true);
    });

    it("should reject missing name", () => {
      expect(validateFoodItem({ ...validFood, name: "" })).toBe(false);
    });

    it("should reject negative calories", () => {
      expect(validateFoodItem({ ...validFood, calories: -100 })).toBe(false);
    });

    it("should reject negative protein", () => {
      expect(validateFoodItem({ ...validFood, protein: -10 })).toBe(false);
    });

    it("should reject missing fields", () => {
      expect(validateFoodItem({ name: "Test" })).toBe(false);
    });

    it("should accept zero values", () => {
      expect(
        validateFoodItem({
          name: "Water",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        })
      ).toBe(true);
    });
  });

  describe("calculateCaloriesFromMacros", () => {
    it("should calculate calories from macronutrients", () => {
      // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
      const calories = calculateCaloriesFromMacros(31, 0, 3.6);
      expect(calories).toBe(156.4); // 31*4 + 0*4 + 3.6*9
    });

    it("should handle balanced macros", () => {
      const calories = calculateCaloriesFromMacros(50, 50, 25);
      expect(calories).toBe(625); // 50*4 + 50*4 + 25*9
    });

    it("should handle zero macros", () => {
      const calories = calculateCaloriesFromMacros(0, 0, 0);
      expect(calories).toBe(0);
    });
  });

  describe("Default Nutrition Goals", () => {
    it("should have reasonable default goals", () => {
      expect(DEFAULT_NUTRITION_GOALS.dailyCalories).toBe(2000);
      expect(DEFAULT_NUTRITION_GOALS.dailyProtein).toBe(150);
      expect(DEFAULT_NUTRITION_GOALS.dailyCarbs).toBe(225);
      expect(DEFAULT_NUTRITION_GOALS.dailyFat).toBe(65);
    });
  });

  describe("Daily Nutrition Calculations", () => {
    it("should calculate totals for multiple foods", () => {
      const foods: FoodItem[] = [
        {
          id: "1",
          name: "Chicken",
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0,
          servingSize: "100g",
          confidence: 0.9,
          timestamp: Date.now(),
          mealType: "lunch",
        },
        {
          id: "2",
          name: "Rice",
          calories: 206,
          protein: 4.3,
          carbs: 45,
          fat: 0.3,
          fiber: 0.6,
          servingSize: "1 cup",
          confidence: 0.95,
          timestamp: Date.now(),
          mealType: "lunch",
        },
      ];

      const daily: DailyNutrition = {
        date: getTodayDate(),
        totalCalories: foods.reduce((sum, f) => sum + f.calories, 0),
        totalProtein: foods.reduce((sum, f) => sum + f.protein, 0),
        totalCarbs: foods.reduce((sum, f) => sum + f.carbs, 0),
        totalFat: foods.reduce((sum, f) => sum + f.fat, 0),
        totalFiber: foods.reduce((sum, f) => sum + f.fiber, 0),
        foods,
      };

      expect(daily.totalCalories).toBe(371);
      expect(daily.totalProtein).toBe(35.3);
      expect(daily.totalCarbs).toBe(45);
      expect(daily.totalFat).toBe(3.9);
      expect(daily.totalFiber).toBe(0.6);
    });
  });

  describe("Food Recognition Results", () => {
    it("should have valid confidence range", () => {
      const confidences = [0, 0.5, 0.75, 0.9, 1.0];
      confidences.forEach((conf) => {
        expect(conf).toBeGreaterThanOrEqual(0);
        expect(conf).toBeLessThanOrEqual(1);
      });
    });

    it("should validate AI recognition result structure", () => {
      const result = {
        foodName: "Grilled Chicken",
        confidence: 0.92,
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        servingSize: "100g",
      };

      expect(result.foodName).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.calories).toBeGreaterThan(0);
      expect(result.protein).toBeGreaterThanOrEqual(0);
    });
  });
});

  describe("Default Nutrition Goals", () => {
    it("should have reasonable default goals", () => {
      expect(DEFAULT_NUTRITION_GOALS.dailyCalories).toBe(2000);
      expect(DEFAULT_NUTRITION_GOALS.dailyProtein).toBe(150);
      expect(DEFAULT_NUTRITION_GOALS.dailyCarbs).toBe(225);
      expect(DEFAULT_NUTRITION_GOALS.dailyFat).toBe(65);
    });

    it("should have reasonable macro distribution", () => {
      const { dailyCalories, dailyProtein, dailyCarbs, dailyFat } =
        DEFAULT_NUTRITION_GOALS;
      const proteinCals = dailyProtein * 4;
      const carbsCals = dailyCarbs * 4;
      const fatCals = dailyFat * 9;

      const proteinPercent = Math.round((proteinCals / dailyCalories) * 100);
      const carbsPercent = Math.round((carbsCals / dailyCalories) * 100);
      const fatPercent = Math.round((fatCals / dailyCalories) * 100);

      expect(proteinPercent).toBeGreaterThanOrEqual(28);
      expect(proteinPercent).toBeLessThanOrEqual(32);
      expect(carbsPercent).toBeGreaterThanOrEqual(43);
      expect(carbsPercent).toBeLessThanOrEqual(47);
      expect(fatPercent).toBeGreaterThanOrEqual(23);
      expect(fatPercent).toBeLessThanOrEqual(30);
    });
  });
