import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useCalories } from "@/lib/calorie-context";
import {
  calculateRemainingCalories,
  getNutrientProgress,
  calculateMacroPercentages,
  getMealTypeEmoji,
  formatCalories,
  formatMacro,
} from "@/lib/calorie-tracker";

export default function NutritionScreen() {
  const colors = useColors();
  const router = useRouter();
  const { dailyNutrition, goals, isLoading, removeFoodItem, refreshNutrition } =
    useCalories();

  useEffect(() => {
    refreshNutrition();
  }, []);

  const remaining = calculateRemainingCalories(dailyNutrition, goals);
  const macroPercentages = calculateMacroPercentages(dailyNutrition);
  const calorieProgress = getNutrientProgress(
    dailyNutrition.totalCalories,
    goals.dailyCalories
  );
  const proteinProgress = getNutrientProgress(
    dailyNutrition.totalProtein,
    goals.dailyProtein
  );
  const carbsProgress = getNutrientProgress(
    dailyNutrition.totalCarbs,
    goals.dailyCarbs
  );
  const fatProgress = getNutrientProgress(
    dailyNutrition.totalFat,
    goals.dailyFat
  );

  const handleDeleteFood = (foodId: string) => {
    removeFoodItem(foodId);
  };

  return (
    <LinearGradient colors={["#0F0C29", "#1A1A2E"]} style={{ flex: 1 }}>
      <ScreenContainer containerClassName="bg-transparent">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🍽️ Nutrition Tracker</Text>
            <Pressable
              onPress={() => router.push("/camera-food")}
              style={({ pressed }) => [
                styles.addBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <LinearGradient
                colors={["#FF6B35", "#FF8C42"]}
                style={styles.addBtnGrad}
              >
                <Text style={styles.addBtnText}>+ Add Food</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Daily Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={styles.calorieValue}>
                  {Math.round(dailyNutrition.totalCalories)}
                </Text>
                <Text style={styles.calorieLabel}>Calories Consumed</Text>
              </View>
              <View style={styles.divider} />
              <View>
                <Text style={styles.calorieValue}>{Math.round(remaining)}</Text>
                <Text style={styles.calorieLabel}>Remaining</Text>
              </View>
            </View>

            {/* Calorie Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(calorieProgress, 100)}%`,
                      backgroundColor:
                        calorieProgress > 100 ? "#EF4444" : "#FF6B35",
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {calorieProgress}% of {goals.dailyCalories} cal goal
              </Text>
            </View>
          </View>

          {/* Macronutrient Breakdown */}
          <View style={styles.macroSection}>
            <Text style={styles.sectionTitle}>Macronutrients</Text>

            <View style={styles.macroGrid}>
              {/* Protein */}
              <View style={styles.macroCard}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroPercentage}>
                    {macroPercentages.protein}%
                  </Text>
                </View>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        width: `${Math.min(proteinProgress, 100)}%`,
                        backgroundColor: "#34D399",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.macroValue}>
                  {formatMacro(dailyNutrition.totalProtein, "g")} / {goals.dailyProtein}g
                </Text>
              </View>

              {/* Carbs */}
              <View style={styles.macroCard}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroPercentage}>
                    {macroPercentages.carbs}%
                  </Text>
                </View>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        width: `${Math.min(carbsProgress, 100)}%`,
                        backgroundColor: "#F59E0B",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.macroValue}>
                  {formatMacro(dailyNutrition.totalCarbs, "g")} / {goals.dailyCarbs}g
                </Text>
              </View>

              {/* Fat */}
              <View style={styles.macroCard}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroPercentage}>
                    {macroPercentages.fat}%
                  </Text>
                </View>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        width: `${Math.min(fatProgress, 100)}%`,
                        backgroundColor: "#EC4899",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.macroValue}>
                  {formatMacro(dailyNutrition.totalFat, "g")} / {goals.dailyFat}g
                </Text>
              </View>
            </View>
          </View>

          {/* Food Log */}
          {dailyNutrition.foods.length > 0 ? (
            <View style={styles.foodLogSection}>
              <Text style={styles.sectionTitle}>Today's Foods</Text>

              <FlatList
                scrollEnabled={false}
                data={dailyNutrition.foods}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.foodItem}>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodEmoji}>
                        {getMealTypeEmoji(item.mealType)}
                      </Text>
                      <View style={styles.foodDetails}>
                        <Text style={styles.foodName}>{item.name}</Text>
                        <Text style={styles.foodMeta}>
                          {formatCalories(item.calories)} • {formatMacro(item.protein, "P")} •{" "}
                          {formatMacro(item.carbs, "C")} • {formatMacro(item.fat, "F")}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteFood(item.id)}
                      style={({ pressed }) => [
                        styles.deleteBtn,
                        pressed && { opacity: 0.5 },
                      ]}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </Pressable>
                  </View>
                )}
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📸</Text>
              <Text style={styles.emptyTitle}>No foods logged yet</Text>
              <Text style={styles.emptySubtitle}>
                Take a photo of your meal to get started
              </Text>
            </View>
          )}
        </ScrollView>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  addBtn: {
    borderRadius: 8,
    overflow: "hidden",
  },
  addBtnGrad: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: "rgba(255,107,53,0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.3)",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FF6B35",
  },
  calorieLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  macroSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  macroGrid: {
    gap: 12,
  },
  macroCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  macroPercentage: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  macroBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginBottom: 8,
  },
  macroBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  macroValue: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  foodLogSection: {
    marginBottom: 24,
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  foodInfo: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  foodEmoji: {
    fontSize: 24,
  },
  foodDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  foodMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});
