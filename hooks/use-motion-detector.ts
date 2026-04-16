import { useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";
import { Accelerometer, Gyroscope } from "expo-sensors";
import type { ExerciseType } from "@/lib/workout-store";

// ─── Sampling config ──────────────────────────────────────────────────────────
// 20 Hz gives better resolution than 10 Hz without draining battery
const UPDATE_INTERVAL_MS = 50; // 20 Hz
const WINDOW_SIZE = 30;        // 1.5 seconds of history
const CLASSIFY_EVERY_N = 3;    // Re-classify every 3 samples (~150ms)

// Minimum confidence required before we switch away from current exercise.
// This prevents rapid flapping between labels.
const SWITCH_CONFIDENCE_GATE = 0.55;

// How many consecutive frames a new label must win before we switch
const SWITCH_FRAMES_REQUIRED = 4;

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

// ─── Math helpers ─────────────────────────────────────────────────────────────
function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function variance(arr: number[], avg: number): number {
  return arr.reduce((s, v) => s + (v - avg) ** 2, 0) / arr.length;
}

function stdDev(arr: number[], avg: number): number {
  return Math.sqrt(variance(arr, avg));
}

function range(arr: number[]): number {
  return Math.max(...arr) - Math.min(...arr);
}

// ─── Exercise classifier ──────────────────────────────────────────────────────
//
// Phone orientation assumptions (how user holds phone):
//   push-up   → phone flat on floor face-down. Z-axis bobs up/down.
//   squat     → phone held vertically in hand or pocket. Y-axis rises/dips.
//   sit-up    → phone on chest/belly. Y-axis tilts forward/back strongly.
//   jumping-jack → phone in hand/pocket. High magnitude spikes, symmetric.
//   running   → phone in pocket. Rapid high-freq magnitude oscillation.
//   idle      → phone still.
//
// We score each exercise 0–1 and pick the winner if it clears the gate.

interface Scores {
  idle: number;
  "push-up": number;
  squat: number;
  "sit-up": number;
  "jumping-jack": number;
  running: number;
}

function classifyExercise(
  window: MotionData[]
): { exercise: ExerciseType; confidence: number } {
  if (window.length < 8) return { exercise: "idle", confidence: 1 };

  const mags  = window.map((d) => d.magnitude);
  const axArr = window.map((d) => d.ax);
  const ayArr = window.map((d) => d.ay);
  const azArr = window.map((d) => d.az);
  const gxArr = window.map((d) => d.gx);
  const gyArr = window.map((d) => d.gy);
  const gzArr = window.map((d) => d.gz);

  const avgMag  = mean(mags);
  const stdMag  = stdDev(mags, avgMag);
  const rngMag  = range(mags);

  const avgAx = mean(axArr);
  const avgAy = mean(ayArr);
  const avgAz = mean(azArr);
  const stdAx = stdDev(axArr, avgAx);
  const stdAy = stdDev(ayArr, avgAy);
  const stdAz = stdDev(azArr, avgAz);
  const rngAy = range(ayArr);
  const rngAz = range(azArr);

  const stdGx = stdDev(gxArr, mean(gxArr));
  const stdGy = stdDev(gyArr, mean(gyArr));
  const stdGz = stdDev(gzArr, mean(gzArr));
  const totalGyro = stdGx + stdGy + stdGz;

  // ── Idle ──────────────────────────────────────────────────────────────────
  // Very little movement on all axes
  const idleScore = stdMag < 0.06 && avgMag < 1.15 && totalGyro < 0.15
    ? 0.95
    : stdMag < 0.12 && totalGyro < 0.25
    ? 0.6
    : 0;

  // ── Running ───────────────────────────────────────────────────────────────
  // High-frequency full-body oscillation: high avg magnitude AND high std.
  // ALL three axes oscillate strongly. Gyro is very active.
  // Key differentiator: HIGH avgMag + HIGH stdMag + HIGH totalGyro all together.
  const runningScore = clamp(
    score([
      [avgMag > 1.6,    0.3],
      [stdMag > 0.35,   0.3],   // running has high stdMag (rapid oscillation)
      [totalGyro > 0.8, 0.25],  // strong gyro = whole-body movement
      [rngMag > 0.8,    0.15],
    ])
  );

  // ── Jumping Jack ──────────────────────────────────────────────────────────
  // Large, rhythmic magnitude spikes (arms going up/down).
  // Key differentiator: very large magnitude RANGE and strong X-axis swing.
  const jjScore = clamp(
    score([
      [rngMag > 1.2,    0.3],   // large magnitude swings
      [stdAx > 0.3,     0.3],   // arms spreading = strong X-axis
      [avgMag > 1.3,    0.2],
      [stdMag > 0.4,    0.2],
    ])
  );

  // ── Push-Up ───────────────────────────────────────────────────────────────
  // Phone flat on floor. Z-axis is gravity (~1g) and oscillates as body dips.
  // Key differentiator: avgAz is HIGH (gravity on Z) AND X/Y are QUIET.
  const pushUpScore = clamp(
    score([
      [Math.abs(avgAz) > 0.7,  0.35],  // gravity mostly on Z (phone flat)
      [stdAz > 0.18,           0.3],   // Z oscillates
      [rngAz > 0.35,           0.2],
      [stdAx < 0.2,            0.075], // X stays quiet
      [stdAy < 0.2,            0.075], // Y stays quiet
    ])
  );

  // ── Sit-Up ────────────────────────────────────────────────────────────────
  // Phone on chest/belly. Strong Y-axis tilt as torso curls forward.
  // Key differentiator: strong Gx (pitch rotation) + large Ay range.
  const sitUpScore = clamp(
    score([
      [stdGx > 0.45,   0.4],   // pitch rotation is the primary signal
      [rngAy > 0.65,   0.3],   // large Y range as torso curls
      [stdAy > 0.3,    0.2],
      [avgMag < 1.8,   0.1],   // not as violent as running
    ])
  );

  // ── Squat ─────────────────────────────────────────────────────────────────
  // Phone held vertically in hand or pocket. Y-axis dips then rises.
  // Moderate magnitude, low X, moderate Gy (body tilts slightly forward).
  // Must NOT have high gyro (that's running) or high X (that's JJ).
  // Must NOT have high stdMag (that's running).
  const squatScore = clamp(
    score([
      [stdAy > 0.18,    0.3],
      [rngAy > 0.35,    0.25],
      [stdGy > 0.15,    0.15],  // slight forward lean = Gy
      [stdAx < 0.25,    0.15],  // X stays quiet
      [totalGyro < 0.8, 0.1],   // not as much gyro as running
      [stdMag < 0.35,   0.05],  // squat has lower stdMag than running
    ])
  );

  const scores: Scores = {
    idle: idleScore,
    "push-up": pushUpScore,
    squat: squatScore,
    "sit-up": sitUpScore,
    "jumping-jack": jjScore,
    running: runningScore,
  };

  // Pick the highest-scoring exercise
  let best: ExerciseType = "idle";
  let bestScore = 0;
  for (const [ex, sc] of Object.entries(scores) as [ExerciseType, number][]) {
    if (sc > bestScore) {
      bestScore = sc;
      best = ex;
    }
  }

  // If nothing is clearly winning, call it idle
  if (bestScore < SWITCH_CONFIDENCE_GATE && best !== "idle") {
    return { exercise: "idle", confidence: 0.5 };
  }

  return { exercise: best, confidence: Math.min(bestScore, 1) };
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────
function score(conditions: [boolean, number][]): number {
  return conditions.reduce((s, [cond, weight]) => s + (cond ? weight : 0), 0);
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ─── Per-exercise rep counting config ────────────────────────────────────────
interface RepConfig {
  axis: "ax" | "ay" | "az" | "magnitude";
  minPeakHeight: number;   // minimum value at peak
  minPeakProminence: number; // how much above the mean
  minIntervalMs: number;   // minimum ms between reps
}

const REP_CONFIG: Record<ExerciseType, RepConfig> = {
  "push-up": {
    axis: "az",
    minPeakHeight: 0.6,
    minPeakProminence: 0.15,
    minIntervalMs: 700,
  },
  squat: {
    axis: "ay",
    minPeakHeight: 0.3,
    minPeakProminence: 0.18,
    minIntervalMs: 900,
  },
  "sit-up": {
    axis: "ay",
    minPeakHeight: 0.3,
    minPeakProminence: 0.2,
    minIntervalMs: 900,
  },
  "jumping-jack": {
    axis: "magnitude",
    minPeakHeight: 1.4,
    minPeakProminence: 0.3,
    minIntervalMs: 500,
  },
  running: {
    axis: "magnitude",
    minPeakHeight: 1.5,
    minPeakProminence: 0.25,
    minIntervalMs: 300,
  },
  idle: {
    axis: "magnitude",
    minPeakHeight: 99,
    minPeakProminence: 99,
    minIntervalMs: 99999,
  },
};

function detectPeak(window: MotionData[], exercise: ExerciseType): boolean {
  if (window.length < 5) return false;
  const cfg = REP_CONFIG[exercise];

  const values = window.map((d) => d[cfg.axis]);
  const n = values.length;

  // We look at the 3rd-from-last sample as the candidate peak
  // (gives one sample on each side for comparison)
  const prev2 = values[n - 5];
  const prev1 = values[n - 4];
  const mid   = values[n - 3];
  const next1 = values[n - 2];
  const next2 = values[n - 1];

  const avg = mean(values);

  // Must be a local maximum over a 5-sample window
  const isLocalMax = mid > prev1 && mid > prev2 && mid > next1 && mid > next2;
  // Must exceed minimum height
  const isHighEnough = mid > cfg.minPeakHeight;
  // Must be prominent above the window mean
  const isProminent = mid - avg > cfg.minPeakProminence;

  return isLocalMax && isHighEnough && isProminent;
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

  const windowRef         = useRef<MotionData[]>([]);
  const accelRef          = useRef({ x: 0, y: 0, z: 0 });
  const gyroRef           = useRef({ x: 0, y: 0, z: 0 });
  const repsRef           = useRef(0);
  const lastPeakTimeRef   = useRef(0);
  const sampleCountRef    = useRef(0);

  // Hysteresis: track candidate label + consecutive frame count
  const candidateRef      = useRef<ExerciseType>("idle");
  const candidateFrames   = useRef(0);
  const currentLabelRef   = useRef<ExerciseType>("idle");

  const resetReps = useCallback(() => {
    repsRef.current = 0;
    setResult((prev) => ({ ...prev, reps: 0 }));
  }, []);

  useEffect(() => {
    if (!active) return;

    let accelSub: ReturnType<typeof Accelerometer.addListener> | null = null;
    let gyroSub:  ReturnType<typeof Gyroscope.addListener>  | null = null;
    let processingInterval: ReturnType<typeof setInterval>  | null = null;

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

      accelSub = Accelerometer.addListener((data) => {
        accelRef.current = data;
      });

      gyroSub = Gyroscope.addListener((data) => {
        gyroRef.current = data;
      });

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

        sampleCountRef.current += 1;

        // Only re-classify every N samples to reduce noise
        let exercise = currentLabelRef.current;
        let confidence = 0.5;

        if (sampleCountRef.current % CLASSIFY_EVERY_N === 0) {
          const classified = classifyExercise(windowRef.current);

          // Hysteresis: only switch label after SWITCH_FRAMES_REQUIRED consecutive wins
          if (classified.exercise === candidateRef.current) {
            candidateFrames.current += 1;
          } else {
            candidateRef.current = classified.exercise;
            candidateFrames.current = 1;
          }

          if (
            candidateFrames.current >= SWITCH_FRAMES_REQUIRED &&
            classified.confidence >= SWITCH_CONFIDENCE_GATE
          ) {
            currentLabelRef.current = classified.exercise;
          }

          exercise = currentLabelRef.current;
          confidence = classified.confidence;
        }

        // Rep counting — use the stable current label
        if (exercise !== "idle" && windowRef.current.length >= 5) {
          const cfg = REP_CONFIG[exercise];
          const isPeak = detectPeak(windowRef.current, exercise);
          if (isPeak && now - lastPeakTimeRef.current > cfg.minIntervalMs) {
            lastPeakTimeRef.current = now;
            repsRef.current += 1;
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
      windowRef.current = [];
      sampleCountRef.current = 0;
      candidateRef.current = "idle";
      candidateFrames.current = 0;
      currentLabelRef.current = "idle";
    };
  }, [active]);

  return { ...result, resetReps };
}
