import AsyncStorage from "@react-native-async-storage/async-storage";

export interface WorkoutAnalytics {
  date: string;
  totalReps: number;
  totalSets: number;
  avgFormScore: number;
  caloriesBurned: number;
  duration: number;
  exercises: string[];
}

export interface ProgressTrend {
  period: "week" | "month" | "year";
  data: Array<{ date: string; value: number }>;
  trend: "improving" | "stable" | "declining";
  percentChange: number;
}

export interface PersonalRecord {
  exerciseType: string;
  maxReps: number;
  date: string;
  formScore: number;
}

export interface AIRecommendation {
  type: "form" | "volume" | "frequency" | "nutrition" | "recovery";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  estimatedImpact: string;
}

export interface PerformanceInsight {
  title: string;
  description: string;
  metric: number;
  unit: string;
  trend: "up" | "down" | "stable";
}

const ANALYTICS_KEY = "@motionfit_analytics";
const RECORDS_KEY = "@motionfit_personal_records";
const RECOMMENDATIONS_KEY = "@motionfit_recommendations";

/**
 * Record workout analytics
 */
export async function recordWorkoutAnalytics(analytics: WorkoutAnalytics): Promise<void> {
  try {
    const existing = await getWorkoutAnalytics();
    existing.push(analytics);
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error("Failed to record workout analytics:", error);
  }
}

/**
 * Get workout analytics
 */
export async function getWorkoutAnalytics(): Promise<WorkoutAnalytics[]> {
  try {
    const data = await AsyncStorage.getItem(ANALYTICS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get workout analytics:", error);
    return [];
  }
}

/**
 * Get progress trend
 */
export async function getProgressTrend(period: "week" | "month" | "year"): Promise<ProgressTrend | null> {
  try {
    const analytics = await getWorkoutAnalytics();
    const now = new Date();
    const daysBack = period === "week" ? 7 : period === "month" ? 30 : 365;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const filtered = analytics.filter((a) => new Date(a.date) >= cutoffDate);

    if (filtered.length === 0) return null;

    const data = filtered.map((a) => ({
      date: a.date,
      value: a.totalReps,
    }));

    const firstValue = filtered[0].totalReps;
    const lastValue = filtered[filtered.length - 1].totalReps;
    const percentChange = ((lastValue - firstValue) / firstValue) * 100;

    let trend: "improving" | "stable" | "declining" = "stable";
    if (percentChange > 10) trend = "improving";
    if (percentChange < -10) trend = "declining";

    return {
      period,
      data,
      trend,
      percentChange,
    };
  } catch (error) {
    console.error("Failed to get progress trend:", error);
    return null;
  }
}

/**
 * Record personal record
 */
export async function recordPersonalRecord(
  exerciseType: string,
  maxReps: number,
  formScore: number
): Promise<void> {
  try {
    const existing = await getPersonalRecords();
    const record: PersonalRecord = {
      exerciseType,
      maxReps,
      date: new Date().toISOString().split("T")[0],
      formScore,
    };

    const existingRecord = existing.find((r) => r.exerciseType === exerciseType);
    if (!existingRecord || maxReps > existingRecord.maxReps) {
      if (existingRecord) {
        existing[existing.indexOf(existingRecord)] = record;
      } else {
        existing.push(record);
      }
      await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(existing));
    }
  } catch (error) {
    console.error("Failed to record personal record:", error);
  }
}

/**
 * Get personal records
 */
export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  try {
    const data = await AsyncStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get personal records:", error);
    return [];
  }
}

/**
 * Generate AI recommendations
 */
export async function generateAIRecommendations(): Promise<AIRecommendation[]> {
  try {
    const analytics = await getWorkoutAnalytics();
    const records = await getPersonalRecords();
    const recommendations: AIRecommendation[] = [];

    if (analytics.length === 0) {
      recommendations.push({
        type: "frequency",
        priority: "high",
        title: "Start Your Journey",
        description: "Begin with 3-4 workouts per week to build consistency",
        action: "Schedule your first workout",
        estimatedImpact: "Build sustainable habits",
      });
      return recommendations;
    }

    // Analyze recent activity
    const recentAnalytics = analytics.slice(-7);
    const avgReps = recentAnalytics.reduce((sum, a) => sum + a.totalReps, 0) / recentAnalytics.length;
    const avgFormScore = recentAnalytics.reduce((sum, a) => sum + a.avgFormScore, 0) / recentAnalytics.length;

    // Form recommendations
    if (avgFormScore < 70) {
      recommendations.push({
        type: "form",
        priority: "high",
        title: "Improve Your Form",
        description: "Your form score is below 70. Focus on controlled movements",
        action: "Review form feedback and slow down your reps",
        estimatedImpact: "Reduce injury risk by 40%",
      });
    }

    // Volume recommendations
    if (avgReps < 50) {
      recommendations.push({
        type: "volume",
        priority: "medium",
        title: "Increase Volume",
        description: "Try adding more reps to your workouts",
        action: "Aim for 20% more reps next week",
        estimatedImpact: "Faster strength gains",
      });
    }

    // Frequency recommendations
    if (recentAnalytics.length < 3) {
      recommendations.push({
        type: "frequency",
        priority: "high",
        title: "Increase Workout Frequency",
        description: "Aim for at least 3-4 workouts per week",
        action: "Schedule workouts on specific days",
        estimatedImpact: "2x faster progress",
      });
    }

    // Recovery recommendations
    if (recentAnalytics.length >= 7) {
      recommendations.push({
        type: "recovery",
        priority: "medium",
        title: "Focus on Recovery",
        description: "Ensure 48 hours between intense workouts",
        action: "Mix high and low intensity days",
        estimatedImpact: "Better performance and fewer injuries",
      });
    }

    // Nutrition recommendations
    recommendations.push({
      type: "nutrition",
      priority: "medium",
      title: "Optimize Your Nutrition",
      description: "Protein intake should be 0.8-1g per pound of body weight",
      action: "Log your meals in the nutrition tracker",
      estimatedImpact: "20% faster muscle growth",
    });

    return recommendations;
  } catch (error) {
    console.error("Failed to generate AI recommendations:", error);
    return [];
  }
}

/**
 * Get performance insights
 */
export async function getPerformanceInsights(): Promise<PerformanceInsight[]> {
  try {
    const analytics = await getWorkoutAnalytics();
    const records = await getPersonalRecords();
    const insights: PerformanceInsight[] = [];

    if (analytics.length === 0) return insights;

    const recentAnalytics = analytics.slice(-7);
    const previousAnalytics = analytics.slice(-14, -7);

    // Total reps insight
    const recentTotal = recentAnalytics.reduce((sum, a) => sum + a.totalReps, 0);
    const previousTotal = previousAnalytics.reduce((sum, a) => sum + a.totalReps, 0);
    const repsTrend = recentTotal > previousTotal ? "up" : recentTotal < previousTotal ? "down" : "stable";

    insights.push({
      title: "Total Reps",
      description: "Reps completed this week",
      metric: recentTotal,
      unit: "reps",
      trend: repsTrend,
    });

    // Average form score insight
    const recentFormScore = recentAnalytics.reduce((sum, a) => sum + a.avgFormScore, 0) / recentAnalytics.length;
    const previousFormScore = previousAnalytics.reduce((sum, a) => sum + a.avgFormScore, 0) / previousAnalytics.length;
    const formTrend = recentFormScore > previousFormScore ? "up" : recentFormScore < previousFormScore ? "down" : "stable";

    insights.push({
      title: "Form Score",
      description: "Average form quality",
      metric: Math.round(recentFormScore),
      unit: "%",
      trend: formTrend,
    });

    // Workout frequency insight
    insights.push({
      title: "Workouts This Week",
      description: "Number of workouts completed",
      metric: recentAnalytics.length,
      unit: "workouts",
      trend: "stable",
    });

    // Calories burned insight
    const recentCalories = recentAnalytics.reduce((sum, a) => sum + a.caloriesBurned, 0);
    insights.push({
      title: "Calories Burned",
      description: "Total calories burned this week",
      metric: Math.round(recentCalories),
      unit: "kcal",
      trend: "stable",
    });

    return insights;
  } catch (error) {
    console.error("Failed to get performance insights:", error);
    return [];
  }
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(): Promise<{
  totalWorkouts: number;
  totalReps: number;
  avgFormScore: number;
  totalCalories: number;
  bestDay: string;
}> {
  try {
    const analytics = await getWorkoutAnalytics();
    const recentAnalytics = analytics.slice(-7);

    if (recentAnalytics.length === 0) {
      return {
        totalWorkouts: 0,
        totalReps: 0,
        avgFormScore: 0,
        totalCalories: 0,
        bestDay: "N/A",
      };
    }

    const totalWorkouts = recentAnalytics.length;
    const totalReps = recentAnalytics.reduce((sum, a) => sum + a.totalReps, 0);
    const avgFormScore = recentAnalytics.reduce((sum, a) => sum + a.avgFormScore, 0) / totalWorkouts;
    const totalCalories = recentAnalytics.reduce((sum, a) => sum + a.caloriesBurned, 0);

    const bestDay = recentAnalytics.reduce((best, current) =>
      current.totalReps > best.totalReps ? current : best
    ).date;

    return {
      totalWorkouts,
      totalReps,
      avgFormScore: Math.round(avgFormScore),
      totalCalories: Math.round(totalCalories),
      bestDay,
    };
  } catch (error) {
    console.error("Failed to get weekly summary:", error);
    return {
      totalWorkouts: 0,
      totalReps: 0,
      avgFormScore: 0,
      totalCalories: 0,
      bestDay: "N/A",
    };
  }
}

/**
 * Export workout data as CSV
 */
export async function exportWorkoutData(): Promise<string> {
  try {
    const analytics = await getWorkoutAnalytics();

    let csv = "Date,Total Reps,Total Sets,Avg Form Score,Calories Burned,Duration (min),Exercises\n";

    analytics.forEach((a) => {
      csv += `${a.date},${a.totalReps},${a.totalSets},${a.avgFormScore},${a.caloriesBurned},${a.duration},"${a.exercises.join("; ")}"\n`;
    });

    return csv;
  } catch (error) {
    console.error("Failed to export workout data:", error);
    return "";
  }
}
