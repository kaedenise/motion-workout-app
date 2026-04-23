import AsyncStorage from "@react-native-async-storage/async-storage";

export interface WorkoutStats {
  date: string;
  totalWorkouts: number;
  totalReps: number;
  totalDuration: number;
  totalCalories: number;
  avgRepsPerWorkout: number;
  avgDurationPerWorkout: number;
}

export interface PersonalRecord {
  exerciseType: string;
  maxReps: number;
  date: string;
  duration: number;
}

export interface ProgressInsight {
  type: "streak" | "improvement" | "milestone" | "consistency";
  title: string;
  description: string;
  value: number | string;
  emoji: string;
}

const ANALYTICS_KEY = "@motionfit_analytics";
const PERSONAL_RECORDS_KEY = "@motionfit_personal_records";

/**
 * Record workout stats
 */
export async function recordWorkoutStats(stats: WorkoutStats): Promise<void> {
  try {
    const existing = await getAnalyticsData();
    const updated = [...existing, stats];
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to record workout stats:", error);
  }
}

/**
 * Get analytics data
 */
export async function getAnalyticsData(): Promise<WorkoutStats[]> {
  try {
    const data = await AsyncStorage.getItem(ANALYTICS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get analytics data:", error);
    return [];
  }
}

/**
 * Get weekly stats
 */
export async function getWeeklyStats(): Promise<WorkoutStats | null> {
  try {
    const data = await getAnalyticsData();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyData = data.filter((stat) => new Date(stat.date) >= oneWeekAgo);

    if (weeklyData.length === 0) return null;

    return {
      date: `Last 7 days`,
      totalWorkouts: weeklyData.reduce((sum, s) => sum + s.totalWorkouts, 0),
      totalReps: weeklyData.reduce((sum, s) => sum + s.totalReps, 0),
      totalDuration: weeklyData.reduce((sum, s) => sum + s.totalDuration, 0),
      totalCalories: weeklyData.reduce((sum, s) => sum + s.totalCalories, 0),
      avgRepsPerWorkout: weeklyData.reduce((sum, s) => sum + s.avgRepsPerWorkout, 0) / weeklyData.length,
      avgDurationPerWorkout:
        weeklyData.reduce((sum, s) => sum + s.avgDurationPerWorkout, 0) / weeklyData.length,
    };
  } catch (error) {
    console.error("Failed to get weekly stats:", error);
    return null;
  }
}

/**
 * Get monthly stats
 */
export async function getMonthlyStats(): Promise<WorkoutStats | null> {
  try {
    const data = await getAnalyticsData();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const monthlyData = data.filter((stat) => new Date(stat.date) >= oneMonthAgo);

    if (monthlyData.length === 0) return null;

    return {
      date: `Last 30 days`,
      totalWorkouts: monthlyData.reduce((sum, s) => sum + s.totalWorkouts, 0),
      totalReps: monthlyData.reduce((sum, s) => sum + s.totalReps, 0),
      totalDuration: monthlyData.reduce((sum, s) => sum + s.totalDuration, 0),
      totalCalories: monthlyData.reduce((sum, s) => sum + s.totalCalories, 0),
      avgRepsPerWorkout: monthlyData.reduce((sum, s) => sum + s.avgRepsPerWorkout, 0) / monthlyData.length,
      avgDurationPerWorkout:
        monthlyData.reduce((sum, s) => sum + s.avgDurationPerWorkout, 0) / monthlyData.length,
    };
  } catch (error) {
    console.error("Failed to get monthly stats:", error);
    return null;
  }
}

/**
 * Update personal record
 */
export async function updatePersonalRecord(
  exerciseType: string,
  reps: number,
  duration: number
): Promise<void> {
  try {
    const existing = await getPersonalRecords();
    const existingRecord = existing.find((r) => r.exerciseType === exerciseType);

    if (!existingRecord || reps > existingRecord.maxReps) {
      const updated = existing.filter((r) => r.exerciseType !== exerciseType);
      updated.push({
        exerciseType,
        maxReps: Math.max(reps, existingRecord?.maxReps ?? 0),
        date: new Date().toISOString().split("T")[0],
        duration,
      });
      await AsyncStorage.setItem(PERSONAL_RECORDS_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error("Failed to update personal record:", error);
  }
}

/**
 * Get personal records
 */
export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  try {
    const data = await AsyncStorage.getItem(PERSONAL_RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get personal records:", error);
    return [];
  }
}

/**
 * Get workout streak
 */
export async function getWorkoutStreak(): Promise<number> {
  try {
    const data = await getAnalyticsData();
    if (data.length === 0) return 0;

    // Sort by date descending
    const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();

    for (const stat of sorted) {
      const statDate = new Date(stat.date);
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - streak);

      if (
        statDate.toISOString().split("T")[0] === expectedDate.toISOString().split("T")[0] ||
        statDate.toISOString().split("T")[0] === currentDate.toISOString().split("T")[0]
      ) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error("Failed to get workout streak:", error);
    return 0;
  }
}

/**
 * Get progress insights
 */
export async function getProgressInsights(): Promise<ProgressInsight[]> {
  try {
    const insights: ProgressInsight[] = [];

    // Streak insight
    const streak = await getWorkoutStreak();
    if (streak > 0) {
      insights.push({
        type: "streak",
        title: "Workout Streak",
        description: `You're on a ${streak} day streak! Keep it up!`,
        value: streak,
        emoji: "🔥",
      });
    }

    // Weekly improvement
    const weeklyStats = await getWeeklyStats();
    const monthlyStats = await getMonthlyStats();

    if (weeklyStats && monthlyStats) {
      const improvement = weeklyStats.totalReps - monthlyStats.totalReps / 4;
      if (improvement > 0) {
        insights.push({
          type: "improvement",
          title: "Weekly Improvement",
          description: `+${Math.round(improvement)} reps compared to monthly average`,
          value: improvement,
          emoji: "📈",
        });
      }
    }

    // Consistency insight
    const data = await getAnalyticsData();
    const consistencyScore = (data.length / 30) * 100; // Assuming 30 days
    if (consistencyScore > 50) {
      insights.push({
        type: "consistency",
        title: "Great Consistency",
        description: `${Math.round(consistencyScore)}% workout consistency this month`,
        value: consistencyScore,
        emoji: "💪",
      });
    }

    // Personal records
    const records = await getPersonalRecords();
    if (records.length > 0) {
      insights.push({
        type: "milestone",
        title: "Personal Records",
        description: `You have ${records.length} personal records`,
        value: records.length,
        emoji: "🏆",
      });
    }

    return insights;
  } catch (error) {
    console.error("Failed to get progress insights:", error);
    return [];
  }
}

/**
 * Export analytics data
 */
export async function exportAnalyticsData(): Promise<string> {
  try {
    const data = await getAnalyticsData();
    const records = await getPersonalRecords();
    const streak = await getWorkoutStreak();

    const exportData = {
      exportDate: new Date().toISOString(),
      workoutStats: data,
      personalRecords: records,
      currentStreak: streak,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error("Failed to export analytics data:", error);
    throw error;
  }
}

/**
 * Clear analytics data (use with caution)
 */
export async function clearAnalyticsData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ANALYTICS_KEY);
    await AsyncStorage.removeItem(PERSONAL_RECORDS_KEY);
  } catch (error) {
    console.error("Failed to clear analytics data:", error);
  }
}
