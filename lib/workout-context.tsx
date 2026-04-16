import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  WorkoutSession,
  ExerciseSet,
  ExerciseType,
  generateId,
  saveSessions,
  loadSessions,
  calculateCalories,
} from "./workout-store";

interface ActiveWorkout {
  id: string;
  startedAt: number;
  sets: ExerciseSet[];
  currentExercise: ExerciseType;
  currentSetStart: number;
  currentReps: number;
}

interface WorkoutContextValue {
  sessions: WorkoutSession[];
  activeWorkout: ActiveWorkout | null;
  startWorkout: () => void;
  updateCurrentExercise: (exercise: ExerciseType, reps: number) => void;
  finishWorkout: () => Promise<WorkoutSession | null>;
  isLoading: boolean;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions().then((loaded) => {
      setSessions(loaded);
      setIsLoading(false);
    });
  }, []);

  const startWorkout = useCallback(() => {
    const now = Date.now();
    setActiveWorkout({
      id: generateId(),
      startedAt: now,
      sets: [],
      currentExercise: "idle",
      currentSetStart: now,
      currentReps: 0,
    });
  }, []);

  const updateCurrentExercise = useCallback(
    (exercise: ExerciseType, reps: number) => {
      setActiveWorkout((prev) => {
        if (!prev) return prev;

        // If exercise changed, finalize the previous set
        if (exercise !== prev.currentExercise && prev.currentExercise !== "idle") {
          const completedSet: ExerciseSet = {
            exercise: prev.currentExercise,
            reps: prev.currentReps,
            durationMs: Date.now() - prev.currentSetStart,
            startedAt: prev.currentSetStart,
          };
          return {
            ...prev,
            sets: [...prev.sets, completedSet],
            currentExercise: exercise,
            currentSetStart: Date.now(),
            currentReps: reps,
          };
        }

        return { ...prev, currentExercise: exercise, currentReps: reps };
      });
    },
    []
  );

  const finishWorkout = useCallback(async (): Promise<WorkoutSession | null> => {
    if (!activeWorkout) return null;

    const now = Date.now();
    const finalSets = [...activeWorkout.sets];

    // Add the current set if it has reps
    if (activeWorkout.currentExercise !== "idle" && activeWorkout.currentReps > 0) {
      finalSets.push({
        exercise: activeWorkout.currentExercise,
        reps: activeWorkout.currentReps,
        durationMs: now - activeWorkout.currentSetStart,
        startedAt: activeWorkout.currentSetStart,
      });
    }

    const totalReps = finalSets.reduce((sum, s) => sum + s.reps, 0);
    const session: WorkoutSession = {
      id: activeWorkout.id,
      startedAt: activeWorkout.startedAt,
      endedAt: now,
      durationMs: now - activeWorkout.startedAt,
      sets: finalSets,
      totalReps,
      caloriesBurned: Math.round(calculateCalories(finalSets)),
    };

    const updated = [session, ...sessions];
    setSessions(updated);
    await saveSessions(updated);
    setActiveWorkout(null);
    return session;
  }, [activeWorkout, sessions]);

  return (
    <WorkoutContext.Provider
      value={{
        sessions,
        activeWorkout,
        startWorkout,
        updateCurrentExercise,
        finishWorkout,
        isLoading,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error("useWorkout must be used within WorkoutProvider");
  return ctx;
}
