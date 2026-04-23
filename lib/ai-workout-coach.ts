import AsyncStorage from "@react-native-async-storage/async-storage";

export interface WorkoutFeedback {
  id: string;
  exerciseType: string;
  reps: number;
  duration: number;
  formScore: number; // 0-100
  feedback: string;
  suggestions: string[];
  timestamp: number;
}

export interface CoachRecommendation {
  type: "form" | "progression" | "recovery" | "variety";
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
}

export interface ExerciseProfile {
  exerciseType: string;
  totalReps: number;
  totalWorkouts: number;
  averageFormScore: number;
  personalBest: number;
  lastPerformed: number;
  progressTrend: "improving" | "stable" | "declining";
}

const FEEDBACK_KEY = "@motionfit_workout_feedback";
const PROFILES_KEY = "@motionfit_exercise_profiles";

/**
 * Generate AI form feedback for workout
 */
export async function generateFormFeedback(
  exerciseType: string,
  reps: number,
  duration: number,
  motionData: any
): Promise<WorkoutFeedback> {
  try {
    const formScore = calculateFormScore(exerciseType, reps, duration, motionData);
    const feedback = generateFeedbackText(exerciseType, formScore, reps);
    const suggestions = generateSuggestions(exerciseType, formScore, reps);

    const workoutFeedback: WorkoutFeedback = {
      id: `feedback_${Date.now()}`,
      exerciseType,
      reps,
      duration,
      formScore,
      feedback,
      suggestions,
      timestamp: Date.now(),
    };

    // Store feedback
    const existing = await getFeedbackHistory();
    await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify([...existing, workoutFeedback]));

    // Update exercise profile
    await updateExerciseProfile(exerciseType, reps, formScore);

    return workoutFeedback;
  } catch (error) {
    console.error("Failed to generate form feedback:", error);
    throw error;
  }
}

/**
 * Calculate form score based on motion data
 */
function calculateFormScore(
  exerciseType: string,
  reps: number,
  duration: number,
  motionData: any
): number {
  let score = 100;

  // Penalize for inconsistent timing
  const avgDurationPerRep = duration / reps;
  if (avgDurationPerRep < 1 || avgDurationPerRep > 5) {
    score -= 20;
  }

  // Penalize for high acceleration variance (indicates jerky movements)
  if (motionData?.accelerationVariance > 0.5) {
    score -= 15;
  }

  // Penalize for incomplete range of motion
  if (motionData?.rangeOfMotion < 0.8) {
    score -= 25;
  }

  // Bonus for consistent rhythm
  if (motionData?.rhythmConsistency > 0.9) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate feedback text based on form score
 */
function generateFeedbackText(exerciseType: string, formScore: number, reps: number): string {
  if (formScore >= 90) {
    return `Excellent form on your ${exerciseType}! Your ${reps} reps were executed with great control and consistency.`;
  } else if (formScore >= 75) {
    return `Good form on your ${exerciseType}. You completed ${reps} reps with decent control. Focus on consistency.`;
  } else if (formScore >= 60) {
    return `Your ${exerciseType} form needs improvement. You completed ${reps} reps but with some jerky movements.`;
  } else {
    return `Your ${exerciseType} form needs significant work. Focus on controlled, smooth movements for your next set.`;
  }
}

/**
 * Generate suggestions for improvement
 */
function generateSuggestions(exerciseType: string, formScore: number, reps: number): string[] {
  const suggestions: string[] = [];

  if (formScore < 90) {
    suggestions.push("Slow down your movements for better control");
  }

  if (formScore < 75) {
    suggestions.push("Focus on full range of motion");
    suggestions.push("Try reducing weight to improve form");
  }

  if (reps < 10) {
    suggestions.push("Aim for 10-15 reps per set for better endurance");
  }

  if (reps > 50) {
    suggestions.push("Consider increasing weight for more challenge");
  }

  // Exercise-specific suggestions
  if (exerciseType === "Push-ups") {
    suggestions.push("Keep your body in a straight line from head to heels");
  } else if (exerciseType === "Squats") {
    suggestions.push("Keep your knees aligned with your toes");
  } else if (exerciseType === "Jumping Jacks") {
    suggestions.push("Land softly with your whole foot");
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
}

/**
 * Get feedback history
 */
export async function getFeedbackHistory(): Promise<WorkoutFeedback[]> {
  try {
    const data = await AsyncStorage.getItem(FEEDBACK_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get feedback history:", error);
    return [];
  }
}

/**
 * Get recent feedback
 */
export async function getRecentFeedback(limit: number = 10): Promise<WorkoutFeedback[]> {
  try {
    const history = await getFeedbackHistory();
    return history.slice(-limit).reverse();
  } catch (error) {
    console.error("Failed to get recent feedback:", error);
    return [];
  }
}

/**
 * Update exercise profile
 */
async function updateExerciseProfile(
  exerciseType: string,
  reps: number,
  formScore: number
): Promise<void> {
  try {
    const profiles = await getExerciseProfiles();
    const existing = profiles.find((p) => p.exerciseType === exerciseType);

    if (!existing) {
      const newProfile: ExerciseProfile = {
        exerciseType,
        totalReps: reps,
        totalWorkouts: 1,
        averageFormScore: formScore,
        personalBest: reps,
        lastPerformed: Date.now(),
        progressTrend: "stable",
      };
      profiles.push(newProfile);
    } else {
      const oldAverage = existing.averageFormScore;
      const newAverage = (oldAverage * existing.totalWorkouts + formScore) / (existing.totalWorkouts + 1);

      existing.totalReps += reps;
      existing.totalWorkouts += 1;
      existing.averageFormScore = newAverage;
      existing.personalBest = Math.max(existing.personalBest, reps);
      existing.lastPerformed = Date.now();

      // Determine progress trend
      if (newAverage > oldAverage + 5) {
        existing.progressTrend = "improving";
      } else if (newAverage < oldAverage - 5) {
        existing.progressTrend = "declining";
      } else {
        existing.progressTrend = "stable";
      }
    }

    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error("Failed to update exercise profile:", error);
  }
}

/**
 * Get exercise profiles
 */
export async function getExerciseProfiles(): Promise<ExerciseProfile[]> {
  try {
    const data = await AsyncStorage.getItem(PROFILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get exercise profiles:", error);
    return [];
  }
}

/**
 * Get profile for specific exercise
 */
export async function getExerciseProfile(exerciseType: string): Promise<ExerciseProfile | null> {
  try {
    const profiles = await getExerciseProfiles();
    return profiles.find((p) => p.exerciseType === exerciseType) ?? null;
  } catch (error) {
    console.error("Failed to get exercise profile:", error);
    return null;
  }
}

/**
 * Generate personalized recommendations
 */
export async function generateRecommendations(): Promise<CoachRecommendation[]> {
  try {
    const recommendations: CoachRecommendation[] = [];
    const profiles = await getExerciseProfiles();
    const feedback = await getRecentFeedback(20);

    // Form improvement recommendation
    const avgFormScore =
      feedback.reduce((sum, f) => sum + f.formScore, 0) / Math.max(1, feedback.length);
    if (avgFormScore < 75) {
      recommendations.push({
        type: "form",
        title: "Improve Your Form",
        description: "Your average form score is below 75. Focus on controlled movements.",
        action: "Review form tips for your exercises",
        priority: "high",
      });
    }

    // Progression recommendation
    const improvingExercises = profiles.filter((p) => p.progressTrend === "improving");
    if (improvingExercises.length > 0) {
      recommendations.push({
        type: "progression",
        title: "Time to Progress",
        description: `You're improving on ${improvingExercises[0].exerciseType}. Try increasing difficulty.`,
        action: "Increase weight or reps",
        priority: "medium",
      });
    }

    // Variety recommendation
    if (profiles.length < 5) {
      recommendations.push({
        type: "variety",
        title: "Add Exercise Variety",
        description: "Try new exercises to work different muscle groups.",
        action: "Explore new exercises",
        priority: "medium",
      });
    }

    // Recovery recommendation
    const recentWorkouts = feedback.filter((f) => Date.now() - f.timestamp < 24 * 60 * 60 * 1000);
    if (recentWorkouts.length > 5) {
      recommendations.push({
        type: "recovery",
        title: "Take a Rest Day",
        description: "You've done many workouts recently. Consider taking a rest day.",
        action: "Schedule recovery time",
        priority: "high",
      });
    }

    return recommendations;
  } catch (error) {
    console.error("Failed to generate recommendations:", error);
    return [];
  }
}

/**
 * Get adaptive difficulty for exercise
 */
export async function getAdaptiveDifficulty(exerciseType: string): Promise<{
  suggestedReps: number;
  suggestedSets: number;
  difficulty: "easy" | "moderate" | "hard";
}> {
  try {
    const profile = await getExerciseProfile(exerciseType);

    if (!profile) {
      return { suggestedReps: 10, suggestedSets: 3, difficulty: "easy" };
    }

    const avgReps = profile.totalReps / profile.totalWorkouts;
    let difficulty: "easy" | "moderate" | "hard" = "moderate";
    let suggestedReps = Math.round(avgReps * 1.1); // 10% increase
    let suggestedSets = 3;

    if (profile.progressTrend === "improving" && profile.averageFormScore > 85) {
      difficulty = "hard";
      suggestedReps = Math.round(avgReps * 1.2);
      suggestedSets = 4;
    } else if (profile.averageFormScore < 70) {
      difficulty = "easy";
      suggestedReps = Math.round(avgReps * 0.9);
      suggestedSets = 3;
    }

    return { suggestedReps, suggestedSets, difficulty };
  } catch (error) {
    console.error("Failed to get adaptive difficulty:", error);
    return { suggestedReps: 10, suggestedSets: 3, difficulty: "moderate" };
  }
}
