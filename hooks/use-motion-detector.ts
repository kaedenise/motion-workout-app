import { useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";
import { Accelerometer, Gyroscope } from "expo-sensors";
import type { ExerciseType } from "@/lib/workout-store";

const UPDATE_INTERVAL_MS = 100; // 10 Hz

export interface MotionData {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  magnitude: number;
  timestamp: number;
}

export interface DetectionResult {
  exercise: ExerciseType;
  confidence: number; // 0–1
  reps: number;
  motionData: MotionData | null;
  isAvailable: boolean;
}

// ─── Sliding window for peak detection ───────────────────────────────────────
const WINDOW_SIZE = 20; // 2 seconds at 10 Hz

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stdDev(arr: number[], avg: number): number {
  const variance = arr.reduce((s, v) => s + (v - avg) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// ─── Exercise classifier ──────────────────────────────────────────────────────
function classifyExercise(
  window: MotionData[]
): { exercise: ExerciseType; confidence: number } {
  if (window.length < 5) return { exercise: "idle", confidence: 1 };

  const magnitudes = window.map((d) => d.magnitude);
  const axValues = window.map((d) => d.ax);
  const ayValues = window.map((d) => d.ay);
  const azValues = window.map((d) => d.az);
  const gzValues = window.map((d) => d.gz);

  const avgMag = mean(magnitudes);
  const stdMag = stdDev(magnitudes, avgMag);
  const avgAy = mean(ayValues);
  const stdAy = stdDev(ayValues, avgAy);
  const stdAz = stdDev(azValues, mean(azValues));
  const stdGz = stdDev(gzValues, mean(gzValues));
  const avgAx = mean(axValues);

  // Idle: very low motion variance
  if (stdMag < 0.08 && avgMag < 1.2) {
    return { exercise: "idle", confidence: 0.9 };
  }

  // Running: high frequency, high magnitude oscillation
  if (avgMag > 1.5 && stdMag > 0.4) {
    return { exercise: "running", confidence: Math.min(stdMag / 0.8, 1) };
  }

  // Jumping Jack: large magnitude spikes with high variance
  if (stdMag > 0.5 && avgMag > 1.3) {
    return { exercise: "jumping-jack", confidence: Math.min(stdMag / 0.7, 1) };
  }

  // Push-Up: Z-axis oscillation (phone lying flat on floor)
  if (stdAz > 0.25 && stdMag > 0.15 && Math.abs(avgAy) < 0.4) {
    return { exercise: "push-up", confidence: Math.min(stdAz / 0.5, 1) };
  }

  // Sit-Up: Y-axis forward tilt oscillation (phone on chest)
  if (stdAy > 0.3 && stdGz > 0.2 && Math.abs(avgAx) < 0.5) {
    return { exercise: "sit-up", confidence: Math.min(stdAy / 0.6, 1) };
  }

  // Squat: Y-axis dip/rise (phone in pocket or hand, vertical)
  if (stdAy > 0.2 && stdMag > 0.15) {
    return { exercise: "squat", confidence: Math.min(stdAy / 0.5, 1) };
  }

  return { exercise: "idle", confidence: 0.5 };
}

// ─── Peak (rep) counter ───────────────────────────────────────────────────────
const MIN_PEAK_INTERVAL_MS = 600; // minimum 600ms between reps

function detectPeak(
  window: MotionData[],
  exercise: ExerciseType
): boolean {
  if (window.length < 3) return false;

  const values = (() => {
    switch (exercise) {
      case "push-up":
        return window.map((d) => d.az);
      case "squat":
      case "sit-up":
        return window.map((d) => d.ay);
      case "jumping-jack":
      case "running":
        return window.map((d) => d.magnitude);
      default:
        return window.map((d) => d.magnitude);
    }
  })();

  const n = values.length;
  const mid = values[n - 2];
  const prev = values[n - 3];
  const last = values[n - 1];
  const avg = mean(values);
  const std = stdDev(values, avg);

  // A peak: mid value is higher than its neighbors AND above mean+0.5*std
  return mid > prev && mid > last && mid > avg + 0.5 * std && std > 0.08;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMotionDetector(active: boolean): DetectionResult & {
  resetReps: () => void;
} {
  const [result, setResult] = useState<DetectionResult>({
    exercise: "idle",
    confidence: 0,
    reps: 0,
    motionData: null,
    isAvailable: true,
  });

  const windowRef = useRef<MotionData[]>([]);
  const accelRef = useRef({ x: 0, y: 0, z: 0 });
  const gyroRef = useRef({ x: 0, y: 0, z: 0 });
  const repsRef = useRef(0);
  const lastPeakTimeRef = useRef(0);
  const currentExerciseRef = useRef<ExerciseType>("idle");

  const resetReps = useCallback(() => {
    repsRef.current = 0;
    setResult((prev) => ({ ...prev, reps: 0 }));
  }, []);

  useEffect(() => {
    if (!active) return;

    let accelSub: ReturnType<typeof Accelerometer.addListener> | null = null;
    let gyroSub: ReturnType<typeof Gyroscope.addListener> | null = null;
    let processingInterval: ReturnType<typeof setInterval> | null = null;

    const setup = async () => {
      const accelAvailable = await Accelerometer.isAvailableAsync();
      if (!accelAvailable) {
        setResult((prev) => ({ ...prev, isAvailable: false }));
        return;
      }

      if (Platform.OS === "web") {
        const { status } = await Accelerometer.requestPermissionsAsync();
        if (status !== "granted") {
          setResult((prev) => ({ ...prev, isAvailable: false }));
          return;
        }
      }

      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
      Gyroscope.setUpdateInterval(UPDATE_INTERVAL_MS);

      accelSub = Accelerometer.addListener((data: { x: number; y: number; z: number }) => {
        accelRef.current = data;
      });

      gyroSub = Gyroscope.addListener((data: { x: number; y: number; z: number }) => {
        gyroRef.current = data;
      });

      // Process at 10 Hz
      processingInterval = setInterval(() => {
        const { x: ax, y: ay, z: az } = accelRef.current;
        const { x: gx, y: gy, z: gz } = gyroRef.current;
        const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
        const now = Date.now();

        const sample: MotionData = { ax, ay, az, gx, gy, gz, magnitude, timestamp: now };

        windowRef.current.push(sample);
        if (windowRef.current.length > WINDOW_SIZE) {
          windowRef.current.shift();
        }

        const { exercise, confidence } = classifyExercise(windowRef.current);
        currentExerciseRef.current = exercise;

        // Count reps via peak detection
        let newRep = false;
        if (exercise !== "idle" && windowRef.current.length >= 3) {
          const isPeak = detectPeak(windowRef.current, exercise);
          if (isPeak && now - lastPeakTimeRef.current > MIN_PEAK_INTERVAL_MS) {
            lastPeakTimeRef.current = now;
            repsRef.current += 1;
            newRep = true;
          }
        }

        setResult({
          exercise,
          confidence,
          reps: repsRef.current,
          motionData: sample,
          isAvailable: true,
        });
      }, UPDATE_INTERVAL_MS);
    };

    setup();

    return () => {
      accelSub?.remove();
      gyroSub?.remove();
      if (processingInterval) clearInterval(processingInterval);
    };
  }, [active]);

  return { ...result, resetReps };
}
