import { useEffect, useRef, useState, useCallback } from "react";
import type { ExerciseType } from "@/lib/workout-store";

const IDLE_THRESHOLD_MS = 20000; // 20 seconds of idle before triggering recovery
const CHECK_INTERVAL_MS = 1000; // Check every 1 second

export interface RecoveryState {
  isResting: boolean;
  restDurationMs: number;
  shouldPrompt: boolean;
}

/**
 * Detects when user is resting (idle) during a workout
 * Returns rest timer and prompt flag
 */
export function useRecoveryDetector(
  active: boolean,
  currentExercise: ExerciseType
): RecoveryState {
  const [state, setState] = useState<RecoveryState>({
    isResting: false,
    restDurationMs: 0,
    shouldPrompt: false,
  });

  const lastActivityTimeRef = useRef(Date.now());
  const lastPromptTimeRef = useRef(0);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update last activity time when exercise changes (user is active)
  useEffect(() => {
    if (active && currentExercise !== "idle") {
      lastActivityTimeRef.current = Date.now();
      setState({
        isResting: false,
        restDurationMs: 0,
        shouldPrompt: false,
      });
    }
  }, [active, currentExercise]);

  // Monitor for idle/rest periods
  useEffect(() => {
    if (!active) return;

    checkIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTimeRef.current;

      if (currentExercise === "idle" && timeSinceActivity > IDLE_THRESHOLD_MS) {
        // User is resting
        const shouldPrompt =
          timeSinceActivity > IDLE_THRESHOLD_MS && now - lastPromptTimeRef.current > 30000; // Prompt every 30s max

        setState({
          isResting: true,
          restDurationMs: timeSinceActivity,
          shouldPrompt,
        });

        if (shouldPrompt) {
          lastPromptTimeRef.current = now;
        }
      } else if (currentExercise !== "idle") {
        // User resumed activity
        lastActivityTimeRef.current = now;
        setState({
          isResting: false,
          restDurationMs: 0,
          shouldPrompt: false,
        });
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [active, currentExercise]);

  return state;
}
