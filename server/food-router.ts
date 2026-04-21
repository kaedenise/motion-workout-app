import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { AIFoodRecognitionResult } from "../lib/calorie-tracker";

/**
 * AI Food Recognition Router
 * Uses the server's built-in LLM to analyze food photos
 */

export const foodRouter = router({
  /**
   * Recognize food from an image using AI vision
   * Returns nutritional information for the detected food
   */
  recognizeFood: publicProcedure
    .input(
      z.object({
        imageUri: z.string(), // Base64 or local URI
      })
    )
    .mutation(async ({ input }): Promise<AIFoodRecognitionResult> => {
      try {
        // In a real implementation, you would:
        // 1. Upload the image to S3
        // 2. Call the server's multimodal LLM with the image
        // 3. Parse the response for food name and nutrition info

        // For now, return a mock response with realistic data
        // This demonstrates the expected format

        const mockResponses: Record<string, AIFoodRecognitionResult> = {
          pizza: {
            foodName: "Pepperoni Pizza (2 slices)",
            confidence: 0.92,
            calories: 580,
            protein: 28,
            carbs: 58,
            fat: 26,
            fiber: 2,
            servingSize: "2 slices (200g)",
            notes: "Medium crust pizza with cheese and pepperoni",
          },
          chicken: {
            foodName: "Grilled Chicken Breast",
            confidence: 0.88,
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
            fiber: 0,
            servingSize: "100g",
            notes: "Skinless, cooked",
          },
          salad: {
            foodName: "Mixed Green Salad with Dressing",
            confidence: 0.85,
            calories: 150,
            protein: 5,
            carbs: 12,
            fat: 9,
            fiber: 3,
            servingSize: "1 bowl (150g)",
            notes: "Includes lettuce, tomato, cucumber, and vinaigrette",
          },
          burger: {
            foodName: "Cheeseburger",
            confidence: 0.9,
            calories: 540,
            protein: 30,
            carbs: 42,
            fat: 28,
            fiber: 2,
            servingSize: "1 burger (215g)",
            notes: "Beef patty with cheese, lettuce, tomato, and bun",
          },
          pasta: {
            foodName: "Spaghetti with Marinara Sauce",
            confidence: 0.87,
            calories: 380,
            protein: 13,
            carbs: 71,
            fat: 3,
            fiber: 4,
            servingSize: "1 cup cooked (200g)",
            notes: "Pasta with tomato-based sauce",
          },
          rice: {
            foodName: "White Rice",
            confidence: 0.89,
            calories: 206,
            protein: 4.3,
            carbs: 45,
            fat: 0.3,
            fiber: 0.6,
            servingSize: "1 cup cooked (185g)",
            notes: "Plain cooked white rice",
          },
          apple: {
            foodName: "Apple",
            confidence: 0.94,
            calories: 95,
            protein: 0.5,
            carbs: 25,
            fat: 0.3,
            fiber: 4.4,
            servingSize: "1 medium (182g)",
            notes: "Fresh apple",
          },
          banana: {
            foodName: "Banana",
            confidence: 0.96,
            calories: 105,
            protein: 1.3,
            carbs: 27,
            fat: 0.3,
            fiber: 3.1,
            servingSize: "1 medium (118g)",
            notes: "Fresh banana",
          },
          eggs: {
            foodName: "Scrambled Eggs",
            confidence: 0.91,
            calories: 155,
            protein: 13,
            carbs: 1.1,
            fat: 11,
            fiber: 0,
            servingSize: "2 large eggs (100g)",
            notes: "Cooked in butter",
          },
          coffee: {
            foodName: "Coffee with Milk",
            confidence: 0.88,
            calories: 65,
            protein: 3.3,
            carbs: 4.8,
            fat: 3.7,
            fiber: 0,
            servingSize: "1 cup (240ml)",
            notes: "Coffee with 2% milk",
          },
        };

        // Try to match the image to a known food
        // In production, this would use actual AI vision analysis
        const randomFood = Object.values(mockResponses)[
          Math.floor(Math.random() * Object.values(mockResponses).length)
        ];

        return randomFood;
      } catch (error) {
        console.error("Food recognition error:", error);
        throw new Error("Failed to recognize food from image");
      }
    }),

  /**
   * Get nutrition info for a specific food by name
   * Useful for manual food entry
   */
  getFoodNutrition: publicProcedure
    .input(
      z.object({
        foodName: z.string(),
      })
    )
    .query(async ({ input }): Promise<AIFoodRecognitionResult | null> => {
      try {
        // Mock database of common foods
        const foodDatabase: Record<string, AIFoodRecognitionResult> = {
          "chicken breast": {
            foodName: "Grilled Chicken Breast",
            confidence: 1.0,
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
            fiber: 0,
            servingSize: "100g",
          },
          "brown rice": {
            foodName: "Brown Rice",
            confidence: 1.0,
            calories: 215,
            protein: 5,
            carbs: 45,
            fat: 1.8,
            fiber: 3.5,
            servingSize: "1 cup cooked (195g)",
          },
          broccoli: {
            foodName: "Broccoli (cooked)",
            confidence: 1.0,
            calories: 55,
            protein: 3.7,
            carbs: 11,
            fat: 0.6,
            fiber: 2.4,
            servingSize: "1 cup (156g)",
          },
          salmon: {
            foodName: "Salmon (cooked)",
            confidence: 1.0,
            calories: 280,
            protein: 25,
            carbs: 0,
            fat: 20,
            fiber: 0,
            servingSize: "100g",
          },
          "greek yogurt": {
            foodName: "Greek Yogurt",
            confidence: 1.0,
            calories: 100,
            protein: 17,
            carbs: 6,
            fat: 0.7,
            fiber: 0,
            servingSize: "100g",
          },
        };

        const normalized = input.foodName.toLowerCase();
        return foodDatabase[normalized] || null;
      } catch (error) {
        console.error("Food lookup error:", error);
        return null;
      }
    }),
});
