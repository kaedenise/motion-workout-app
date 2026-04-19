import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ExerciseType } from "./workout-store";

const CALIBRATION_KEY = "@motionfit:calibration";

export interface CalibrationProfile {
  exerciseId: ExerciseType;
  minPeakHeight: number;
  minPeakProminence: number;
  minIntervalMs: number;
  calibratedAt: number;
}

export interface CalibrationState {
  profiles: Record<ExerciseType, CalibrationProfile | null>;
  isCalibrating: boolean;
  currentExercise: ExerciseType | null;
}

interface CalibrationContextValue extends CalibrationState {
  startCalibration: (exercise: ExerciseType) => void;
  completeCalibration: (exercise: ExerciseType, profile: CalibrationProfile) => Promise<void>;
  resetCalibration: (exercise: ExerciseType) => Promise<void>;
  getProfile: (exercise: ExerciseType) => CalibrationProfile | null;
}

const CalibrationContext = createContext<CalibrationContextValue | null>(null);

export function useCalibration(): CalibrationContextValue {
  const ctx = useContext(CalibrationContext);
  if (!ctx) throw new Error("useCalibration must be used within CalibrationProvider");
  return ctx;
}

// Default profiles (used if user hasn't calibrated)
const DEFAULT_PROFILES: Record<ExerciseType, CalibrationProfile> = {
  "push-up": {
    exerciseId: "push-up",
    minPeakHeight: 0.4,
    minPeakProminence: 0.1,
    minIntervalMs: 600,
    calibratedAt: 0,
  },
  squat: {
    exerciseId: "squat",
    minPeakHeight: 0.2,
    minPeakProminence: 0.12,
    minIntervalMs: 700,
    calibratedAt: 0,
  },
  "sit-up": {
    exerciseId: "sit-up",
    minPeakHeight: 0.2,
    minPeakProminence: 0.15,
    minIntervalMs: 700,
    calibratedAt: 0,
  },
  "jumping-jack": {
    exerciseId: "jumping-jack",
    minPeakHeight: 1.2,
    minPeakProminence: 0.2,
    minIntervalMs: 400,
    calibratedAt: 0,
  },
  running: {
    exerciseId: "running",
    minPeakHeight: 1.2,
    minPeakProminence: 0.15,
    minIntervalMs: 250,
    calibratedAt: 0,
  },
  idle: {
    exerciseId: "idle",
    minPeakHeight: 99,
    minPeakProminence: 99,
    minIntervalMs: 99999,
    calibratedAt: 0,
  },
};

export function CalibrationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CalibrationState>({
    profiles: {
      "push-up": null,
      squat: null,
      "sit-up": null,
      "jumping-jack": null,
      running: null,
      idle: null,
    },
    isCalibrating: false,
    currentExercise: null,
  });

  // Load calibration profiles from storage
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(CALIBRATION_KEY);
        if (stored) {
          const profiles = JSON.parse(stored) as Record<ExerciseType, CalibrationProfile | null>;
          setState((prev) => ({ ...prev, profiles }));
        }
      } catch (err) {
        console.error("Failed to load calibration profiles:", err);
      }
    };
    load();
  }, []);

  const startCalibration = useCallback((exercise: ExerciseType) => {
    setState((prev) => ({
      ...prev,
      isCalibrating: true,
      currentExercise: exercise,
    }));
  }, []);

  const completeCalibration = useCallback(
    async (exercise: ExerciseType, profile: CalibrationProfile) => {
      const updated = {
        ...state.profiles,
        [exercise]: { ...profile, calibratedAt: Date.now() },
      };
      setState((prev) => ({
        ...prev,
        profiles: updated,
        isCalibrating: false,
        currentExercise: null,
      }));
      await AsyncStorage.setItem(CALIBRATION_KEY, JSON.stringify(updated));
    },
    [state.profiles]
  );

  const resetCalibration = useCallback(async (exercise: ExerciseType) => {
    const updated = {
      ...state.profiles,
      [exercise]: null,
    };
    setState((prev) => ({
      ...prev,
      profiles: updated,
    }));
    await AsyncStorage.setItem(CALIBRATION_KEY, JSON.stringify(updated));
  }, [state.profiles]);

  const getProfile = useCallback(
    (exercise: ExerciseType) => {
      return state.profiles[exercise] || DEFAULT_PROFILES[exercise];
    },
    [state.profiles]
  );

  return (
    <CalibrationContext.Provider
      value={{
        ...state,
        startCalibration,
        completeCalibration,
        resetCalibration,
        getProfile,
      }}
    >
      {children}
    </CalibrationContext.Provider>
  );
}
