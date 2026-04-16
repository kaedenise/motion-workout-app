import AsyncStorage from "@react-native-async-storage/async-storage";

export type ExerciseType =
  | "push-up"
  | "squat"
  | "jumping-jack"
  | "sit-up"
  | "running"
  | "idle";

export interface ExerciseSet {
  exercise: ExerciseType;
  reps: number;
  durationMs: number;
  startedAt: number;
}

export interface WorkoutSession {
  id: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  sets: ExerciseSet[];
  totalReps: number;
  caloriesBurned: number;
}

const STORAGE_KEY = "motionfit_sessions";

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  "push-up": "Push-Up",
  squat: "Squat",
  "jumping-jack": "Jumping Jack",
  "sit-up": "Sit-Up",
  running: "Running",
  idle: "Resting",
};

export const EXERCISE_ICONS: Record<ExerciseType, string> = {
  "push-up": "💪",
  squat: "🦵",
  "jumping-jack": "⚡",
  "sit-up": "🔥",
  running: "🏃",
  idle: "😴",
};

export const CALORIES_PER_REP: Record<ExerciseType, number> = {
  "push-up": 0.5,
  squat: 0.4,
  "jumping-jack": 0.3,
  "sit-up": 0.4,
  running: 0.1,
  idle: 0,
};

export function calculateCalories(sets: ExerciseSet[]): number {
  return sets.reduce((total, set) => {
    return total + set.reps * (CALORIES_PER_REP[set.exercise] ?? 0);
  }, 0);
}

export async function saveSessions(sessions: WorkoutSession[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export async function loadSessions(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WorkoutSession[];
  } catch {
    return [];
  }
}

export function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
