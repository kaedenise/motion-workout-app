/**
 * Video Workout Library Service
 * Pre-built workout videos with AI form coaching and progress tracking
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type WorkoutDifficulty = "beginner" | "intermediate" | "advanced" | "elite";
export type WorkoutCategory = "HIIT" | "Strength" | "Cardio" | "Yoga" | "Flexibility" | "Core" | "Full Body";

export interface Exercise {
  name: string;
  duration: number; // seconds
  reps?: number;
  sets?: number;
  formTips: string[];
  commonMistakes: string[];
  videoClip?: string;
}

export interface VideoWorkout {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  difficulty: WorkoutDifficulty;
  category: WorkoutCategory;
  videoUrl: string;
  thumbnailUrl: string;
  instructor: string;
  exercises: Exercise[];
  aiFormCoaching: boolean;
  equipment?: string[];
  musicUrl?: string;
  completions: number;
  rating: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
  premium: boolean;
}

export interface WorkoutCompletion {
  userId: string;
  workoutId: string;
  completedAt: Date;
  duration: number; // actual time taken
  caloriesBurned: number;
  formScore?: number; // 0-100 based on AI analysis
  difficulty: WorkoutDifficulty;
}

export interface UserWorkoutProgress {
  userId: string;
  workoutId: string;
  totalCompletions: number;
  bestFormScore?: number;
  averageDuration?: number;
  lastCompletedAt?: Date;
  favorited: boolean;
}

const VIDEO_WORKOUTS_KEY = "@motionfit_video_workouts";
const WORKOUT_COMPLETIONS_KEY = "@motionfit_workout_completions";
const USER_PROGRESS_KEY = "@motionfit_user_workout_progress";

/**
 * Create video workout
 */
export async function createVideoWorkout(workout: Omit<VideoWorkout, "id" | "createdAt" | "updatedAt">): Promise<VideoWorkout> {
  try {
    const id = `workout_${Date.now()}`;
    const fullWorkout: VideoWorkout = {
      ...workout,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const workouts = await getAllVideoWorkouts();
    workouts.push(fullWorkout);
    await AsyncStorage.setItem(VIDEO_WORKOUTS_KEY, JSON.stringify(workouts));

    return fullWorkout;
  } catch (error) {
    console.error("Failed to create video workout:", error);
    throw error;
  }
}

/**
 * Get all video workouts
 */
export async function getAllVideoWorkouts(): Promise<VideoWorkout[]> {
  try {
    const data = await AsyncStorage.getItem(VIDEO_WORKOUTS_KEY);
    if (!data) {
      return getDefaultWorkouts();
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to get video workouts:", error);
    return getDefaultWorkouts();
  }
}

/**
 * Get workouts by category
 */
export async function getWorkoutsByCategory(category: WorkoutCategory): Promise<VideoWorkout[]> {
  try {
    const workouts = await getAllVideoWorkouts();
    return workouts.filter((w) => w.category === category);
  } catch (error) {
    console.error("Failed to get workouts by category:", error);
    return [];
  }
}

/**
 * Get workouts by difficulty
 */
export async function getWorkoutsByDifficulty(difficulty: WorkoutDifficulty): Promise<VideoWorkout[]> {
  try {
    const workouts = await getAllVideoWorkouts();
    return workouts.filter((w) => w.difficulty === difficulty);
  } catch (error) {
    console.error("Failed to get workouts by difficulty:", error);
    return [];
  }
}

/**
 * Get top-rated workouts
 */
export async function getTopRatedWorkouts(limit: number = 10): Promise<VideoWorkout[]> {
  try {
    const workouts = await getAllVideoWorkouts();
    return workouts.sort((a, b) => b.rating - a.rating).slice(0, limit);
  } catch (error) {
    console.error("Failed to get top-rated workouts:", error);
    return [];
  }
}

/**
 * Get trending workouts
 */
export async function getTrendingWorkouts(limit: number = 10): Promise<VideoWorkout[]> {
  try {
    const workouts = await getAllVideoWorkouts();
    return workouts.sort((a, b) => b.completions - a.completions).slice(0, limit);
  } catch (error) {
    console.error("Failed to get trending workouts:", error);
    return [];
  }
}

/**
 * Record workout completion
 */
export async function recordWorkoutCompletion(
  userId: string,
  workoutId: string,
  duration: number,
  caloriesBurned: number,
  formScore?: number
): Promise<WorkoutCompletion> {
  try {
    const workout = await getVideoWorkout(workoutId);
    if (!workout) {
      throw new Error("Workout not found");
    }

    const completion: WorkoutCompletion = {
      userId,
      workoutId,
      completedAt: new Date(),
      duration,
      caloriesBurned,
      formScore,
      difficulty: workout.difficulty,
    };

    const completions = await getWorkoutCompletions(userId);
    completions.push(completion);
    await AsyncStorage.setItem(`${WORKOUT_COMPLETIONS_KEY}_${userId}`, JSON.stringify(completions));

    // Update user progress
    await updateUserWorkoutProgress(userId, workoutId, duration, formScore);

    // Update workout stats
    workout.completions += 1;
    const workouts = await getAllVideoWorkouts();
    const index = workouts.findIndex((w) => w.id === workoutId);
    if (index >= 0) {
      workouts[index] = workout;
      await AsyncStorage.setItem(VIDEO_WORKOUTS_KEY, JSON.stringify(workouts));
    }

    return completion;
  } catch (error) {
    console.error("Failed to record workout completion:", error);
    throw error;
  }
}

/**
 * Get workout completions for user
 */
export async function getWorkoutCompletions(userId: string): Promise<WorkoutCompletion[]> {
  try {
    const data = await AsyncStorage.getItem(`${WORKOUT_COMPLETIONS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get workout completions:", error);
    return [];
  }
}

/**
 * Get user's workout progress
 */
export async function getUserWorkoutProgress(userId: string, workoutId: string): Promise<UserWorkoutProgress | null> {
  try {
    const data = await AsyncStorage.getItem(`${USER_PROGRESS_KEY}_${userId}`);
    const progressList: UserWorkoutProgress[] = data ? JSON.parse(data) : [];
    return progressList.find((p) => p.workoutId === workoutId) || null;
  } catch (error) {
    console.error("Failed to get user workout progress:", error);
    return null;
  }
}

/**
 * Update user workout progress
 */
async function updateUserWorkoutProgress(
  userId: string,
  workoutId: string,
  duration: number,
  formScore?: number
): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(`${USER_PROGRESS_KEY}_${userId}`);
    const progressList: UserWorkoutProgress[] = data ? JSON.parse(data) : [];

    let progress = progressList.find((p) => p.workoutId === workoutId);

    if (!progress) {
      progress = {
        userId,
        workoutId,
        totalCompletions: 1,
        bestFormScore: formScore,
        averageDuration: duration,
        lastCompletedAt: new Date(),
        favorited: false,
      };
      progressList.push(progress);
    } else {
      progress.totalCompletions += 1;
      progress.lastCompletedAt = new Date();
      if (formScore && (!progress.bestFormScore || formScore > progress.bestFormScore)) {
        progress.bestFormScore = formScore;
      }
      if (progress.averageDuration) {
        progress.averageDuration = (progress.averageDuration + duration) / 2;
      } else {
        progress.averageDuration = duration;
      }
    }

    await AsyncStorage.setItem(`${USER_PROGRESS_KEY}_${userId}`, JSON.stringify(progressList));
  } catch (error) {
    console.error("Failed to update user workout progress:", error);
  }
}

/**
 * Toggle favorite workout
 */
export async function toggleFavoriteWorkout(userId: string, workoutId: string): Promise<void> {
  try {
    const progress = await getUserWorkoutProgress(userId, workoutId);

    const data = await AsyncStorage.getItem(`${USER_PROGRESS_KEY}_${userId}`);
    const progressList: UserWorkoutProgress[] = data ? JSON.parse(data) : [];

    let userProgress = progressList.find((p) => p.workoutId === workoutId);

    if (!userProgress) {
      userProgress = {
        userId,
        workoutId,
        totalCompletions: 0,
        favorited: true,
      };
      progressList.push(userProgress);
    } else {
      userProgress.favorited = !userProgress.favorited;
    }

    await AsyncStorage.setItem(`${USER_PROGRESS_KEY}_${userId}`, JSON.stringify(progressList));
  } catch (error) {
    console.error("Failed to toggle favorite workout:", error);
  }
}

/**
 * Get user's favorite workouts
 */
export async function getUserFavoriteWorkouts(userId: string): Promise<VideoWorkout[]> {
  try {
    const data = await AsyncStorage.getItem(`${USER_PROGRESS_KEY}_${userId}`);
    const progressList: UserWorkoutProgress[] = data ? JSON.parse(data) : [];
    const favoriteIds = progressList.filter((p) => p.favorited).map((p) => p.workoutId);

    const allWorkouts = await getAllVideoWorkouts();
    return allWorkouts.filter((w) => favoriteIds.includes(w.id));
  } catch (error) {
    console.error("Failed to get favorite workouts:", error);
    return [];
  }
}

/**
 * Get single video workout
 */
async function getVideoWorkout(workoutId: string): Promise<VideoWorkout | null> {
  try {
    const workouts = await getAllVideoWorkouts();
    return workouts.find((w) => w.id === workoutId) || null;
  } catch (error) {
    console.error("Failed to get video workout:", error);
    return null;
  }
}

/**
 * Get default workouts
 */
function getDefaultWorkouts(): VideoWorkout[] {
  return [
    {
      id: "workout_1",
      title: "30-Min Full Body HIIT",
      description: "High-intensity interval training for maximum calorie burn",
      duration: 1800,
      difficulty: "intermediate",
      category: "HIIT",
      videoUrl: "https://example.com/video1.mp4",
      thumbnailUrl: "https://example.com/thumb1.jpg",
      instructor: "Coach Alex",
      exercises: [
        {
          name: "Burpees",
          duration: 30,
          reps: 10,
          formTips: ["Keep back straight", "Full extension"],
          commonMistakes: ["Incomplete push-up", "Knees caving in"],
        },
        {
          name: "Mountain Climbers",
          duration: 30,
          reps: 20,
          formTips: ["Fast pace", "Core engaged"],
          commonMistakes: ["Hips too high", "Slow pace"],
        },
      ],
      aiFormCoaching: true,
      equipment: ["None"],
      completions: 5234,
      rating: 4.8,
      reviews: 342,
      createdAt: new Date(),
      updatedAt: new Date(),
      premium: false,
    },
    {
      id: "workout_2",
      title: "20-Min Strength Training",
      description: "Build muscle with compound movements",
      duration: 1200,
      difficulty: "intermediate",
      category: "Strength",
      videoUrl: "https://example.com/video2.mp4",
      thumbnailUrl: "https://example.com/thumb2.jpg",
      instructor: "Coach Mike",
      exercises: [
        {
          name: "Squats",
          duration: 60,
          sets: 3,
          reps: 12,
          formTips: ["Knees over toes", "Back straight"],
          commonMistakes: ["Knees caving in", "Leaning forward"],
        },
      ],
      aiFormCoaching: true,
      equipment: ["Dumbbells"],
      completions: 3421,
      rating: 4.7,
      reviews: 287,
      createdAt: new Date(),
      updatedAt: new Date(),
      premium: false,
    },
  ];
}

/**
 * Get workout categories
 */
export function getWorkoutCategories(): WorkoutCategory[] {
  return ["HIIT", "Strength", "Cardio", "Yoga", "Flexibility", "Core", "Full Body"];
}

/**
 * Get difficulty levels
 */
export function getDifficultyLevels(): WorkoutDifficulty[] {
  return ["beginner", "intermediate", "advanced", "elite"];
}
