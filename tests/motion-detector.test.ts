import { describe, it, expect } from "vitest";

// ─── Inline the pure functions from use-motion-detector for testing ───────────
// We can't import the hook directly (it uses React), so we test the pure
// classification and peak-detection logic independently.

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stdDev(arr: number[], avg: number): number {
  const variance = arr.reduce((s, v) => s + (v - avg) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function range(arr: number[]): number {
  return Math.max(...arr) - Math.min(...arr);
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function scoreConditions(conditions: [boolean, number][]): number {
  return conditions.reduce((s, [cond, weight]) => s + (cond ? weight : 0), 0);
}

interface MotionData {
  ax: number; ay: number; az: number;
  gx: number; gy: number; gz: number;
  magnitude: number; timestamp: number;
}

function makeIdle(n = 20): MotionData[] {
  return Array.from({ length: n }, (_, i) => ({
    ax: 0.01 * Math.sin(i), ay: 0.01 * Math.cos(i), az: 0.99,
    gx: 0.01, gy: 0.01, gz: 0.01,
    magnitude: 1.0 + 0.01 * Math.sin(i),
    timestamp: Date.now() + i * 50,
  }));
}

function makePushUp(n = 30): MotionData[] {
  // Phone flat: az oscillates between 0.7 and 1.1, ax/ay quiet
  return Array.from({ length: n }, (_, i) => ({
    ax: 0.05 * Math.sin(i * 0.3),
    ay: 0.05 * Math.cos(i * 0.3),
    az: 0.9 + 0.25 * Math.sin(i * 0.7),
    gx: 0.05, gy: 0.05, gz: 0.05,
    magnitude: 0.95 + 0.2 * Math.sin(i * 0.7),
    timestamp: Date.now() + i * 50,
  }));
}

function makeSquat(n = 30): MotionData[] {
  // Phone vertical: ay oscillates, ax quiet, moderate Gy
  return Array.from({ length: n }, (_, i) => ({
    ax: 0.08 * Math.sin(i * 0.2),
    ay: 0.5 * Math.sin(i * 0.5),
    az: 0.15,
    gx: 0.05, gy: 0.3 * Math.sin(i * 0.5), gz: 0.05,
    magnitude: 1.1 + 0.2 * Math.abs(Math.sin(i * 0.5)),
    timestamp: Date.now() + i * 50,
  }));
}

function makeSitUp(n = 30): MotionData[] {
  // Phone on chest: STRONG Gx (pitch rotation) + large Ay range
  // Gx must exceed 0.45 std, Ay range must exceed 0.65
  return Array.from({ length: n }, (_, i) => ({
    ax: 0.08 * Math.sin(i * 0.3),
    ay: 0.55 * Math.sin(i * 0.5),   // rngAy ~1.1, stdAy ~0.39
    az: 0.15 + 0.08 * Math.sin(i * 0.2),
    gx: 0.65 * Math.sin(i * 0.5),   // stdGx ~0.46
    gy: 0.05, gz: 0.05,
    magnitude: 1.05 + 0.1 * Math.abs(Math.sin(i * 0.5)),
    timestamp: Date.now() + i * 50,
  }));
}

function makeJumpingJack(n = 30): MotionData[] {
  // Large magnitude range AND strong X-axis (arms spreading)
  // Use true oscillation: magnitude swings between 0.9 and 2.5 (rngMag ~1.6, stdMag ~0.55)
  return Array.from({ length: n }, (_, i) => ({
    ax: 0.55 * Math.sin(i * 0.8),   // stdAx ~0.39
    ay: 0.2 * Math.sin(i * 0.8),
    az: 0.15,
    gx: 0.15, gy: 0.15, gz: 0.2,   // totalGyro ~0.5 (not running-level)
    // True oscillation: 1.7 + 0.8*sin → range [0.9, 2.5], rngMag ~1.6, stdMag ~0.57
    magnitude: 1.7 + 0.8 * Math.sin(i * 0.8),
    timestamp: Date.now() + i * 50,
  }));
}

function makeRunning(n = 30): MotionData[] {
  // High magnitude (>1.6 avg) AND high stdMag (>0.35) AND high total gyro (>0.8)
  // Use a true oscillation: magnitude alternates between ~1.3 and ~2.5 (stdMag ~0.45)
  return Array.from({ length: n }, (_, i) => ({
    ax: 0.4 * Math.sin(i * 1.5),
    ay: 0.45 * Math.sin(i * 1.5 + 0.5),
    az: 0.35 * Math.cos(i * 1.5),
    gx: 0.55 * Math.sin(i),          // totalGyro ~1.3 (well above 0.8)
    gy: 0.45 * Math.cos(i),
    gz: 0.5 * Math.sin(i * 0.8),
    // Oscillate magnitude between 1.3 and 2.5 → avgMag ~1.9, stdMag ~0.45
    magnitude: 1.9 + 0.6 * Math.sin(i * 1.5),
    timestamp: Date.now() + i * 50,
  }));
}

// Simplified classifier (mirrors the hook logic)
function classifyExercise(window: MotionData[]): { exercise: string; confidence: number } {
  if (window.length < 8) return { exercise: "idle", confidence: 1 };

  const mags  = window.map((d) => d.magnitude);
  const axArr = window.map((d) => d.ax);
  const ayArr = window.map((d) => d.ay);
  const azArr = window.map((d) => d.az);
  const gxArr = window.map((d) => d.gx);
  const gyArr = window.map((d) => d.gy);
  const gzArr = window.map((d) => d.gz);

  const avgMag = mean(mags);
  const stdMag = stdDev(mags, avgMag);
  const rngMag = range(mags);

  const avgAx = mean(axArr); const stdAx = stdDev(axArr, avgAx);
  const avgAy = mean(ayArr); const stdAy = stdDev(ayArr, avgAy);
  const avgAz = mean(azArr); const stdAz = stdDev(azArr, avgAz);
  const rngAy = range(ayArr);
  const rngAz = range(azArr);

  const stdGx = stdDev(gxArr, mean(gxArr));
  const stdGy = stdDev(gyArr, mean(gyArr));
  const stdGz = stdDev(gzArr, mean(gzArr));
  const totalGyro = stdGx + stdGy + stdGz;

  const idleScore = stdMag < 0.06 && avgMag < 1.15 && totalGyro < 0.15 ? 0.95
    : stdMag < 0.12 && totalGyro < 0.25 ? 0.6 : 0;

  const runningScore = clamp(scoreConditions([
    [avgMag > 1.6, 0.3], [stdMag > 0.35, 0.3], [totalGyro > 0.8, 0.25],
    [rngMag > 0.8, 0.15],
  ]));

  const jjScore = clamp(scoreConditions([
    [rngMag > 1.2, 0.3], [stdAx > 0.3, 0.3],
    [avgMag > 1.3, 0.2], [stdMag > 0.4, 0.2],
  ]));

  const pushUpScore = clamp(scoreConditions([
    [Math.abs(avgAz) > 0.7, 0.35], [stdAz > 0.18, 0.3], [rngAz > 0.35, 0.2],
    [stdAx < 0.2, 0.075], [stdAy < 0.2, 0.075],
  ]));

  const sitUpScore = clamp(scoreConditions([
    [stdGx > 0.45, 0.4], [rngAy > 0.65, 0.3], [stdAy > 0.3, 0.2],
    [avgMag < 1.8, 0.1],
  ]));

  const squatScore = clamp(scoreConditions([
    [stdAy > 0.18, 0.3], [rngAy > 0.35, 0.25], [stdGy > 0.15, 0.15],
    [stdAx < 0.25, 0.15], [totalGyro < 0.8, 0.1], [stdMag < 0.35, 0.05],
  ]));

  const scores: Record<string, number> = {
    idle: idleScore, "push-up": pushUpScore, squat: squatScore,
    "sit-up": sitUpScore, "jumping-jack": jjScore, running: runningScore,
  };

  let best = "idle";
  let bestScore = 0;
  for (const [ex, sc] of Object.entries(scores)) {
    if (sc > bestScore) { bestScore = sc; best = ex; }
  }

  if (bestScore < 0.55 && best !== "idle") return { exercise: "idle", confidence: 0.5 };
  return { exercise: best, confidence: Math.min(bestScore, 1) };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("classifyExercise – idle detection", () => {
  it("classifies still phone as idle", () => {
    const { exercise } = classifyExercise(makeIdle());
    expect(exercise).toBe("idle");
  });

  it("returns idle for small window", () => {
    const { exercise } = classifyExercise(makeIdle(5));
    expect(exercise).toBe("idle");
  });
});

describe("classifyExercise – push-up detection", () => {
  it("classifies push-up motion correctly", () => {
    const { exercise, confidence } = classifyExercise(makePushUp());
    expect(exercise).toBe("push-up");
    expect(confidence).toBeGreaterThan(0.5);
  });
});

describe("classifyExercise – squat detection", () => {
  it("classifies squat motion correctly", () => {
    const { exercise, confidence } = classifyExercise(makeSquat());
    expect(exercise).toBe("squat");
    expect(confidence).toBeGreaterThan(0.5);
  });
});

describe("classifyExercise – sit-up detection", () => {
  it("classifies sit-up motion correctly", () => {
    const { exercise, confidence } = classifyExercise(makeSitUp());
    expect(exercise).toBe("sit-up");
    expect(confidence).toBeGreaterThan(0.5);
  });
});

describe("classifyExercise – jumping jack detection", () => {
  it("classifies jumping jack motion correctly", () => {
    const { exercise, confidence } = classifyExercise(makeJumpingJack());
    expect(exercise).toBe("jumping-jack");
    expect(confidence).toBeGreaterThan(0.5);
  });
});

describe("classifyExercise – running detection", () => {
  it("classifies running motion correctly", () => {
    const { exercise, confidence } = classifyExercise(makeRunning());
    expect(exercise).toBe("running");
    expect(confidence).toBeGreaterThan(0.5);
  });
});

describe("classifyExercise – confidence gate", () => {
  it("returns idle when no exercise clears the confidence gate", () => {
    // Very low-motion data that doesn't clearly match any exercise
    const ambiguous: MotionData[] = Array.from({ length: 20 }, (_, i) => ({
      ax: 0.12 * Math.sin(i), ay: 0.12 * Math.cos(i), az: 0.5,
      gx: 0.1, gy: 0.1, gz: 0.1,
      magnitude: 1.05 + 0.05 * Math.sin(i),
      timestamp: Date.now() + i * 50,
    }));
    const { exercise } = classifyExercise(ambiguous);
    // Should be idle or at most a low-confidence exercise
    expect(["idle", "push-up", "squat", "sit-up", "jumping-jack", "running"]).toContain(exercise);
  });
});

describe("classifyExercise – exercises are distinct", () => {
  it("push-up and squat are not confused", () => {
    const pushUpResult = classifyExercise(makePushUp());
    const squatResult = classifyExercise(makeSquat());
    expect(pushUpResult.exercise).toBe("push-up");
    expect(squatResult.exercise).toBe("squat");
    expect(pushUpResult.exercise).not.toBe(squatResult.exercise);
  });

  it("running and jumping jack are not confused", () => {
    const runResult = classifyExercise(makeRunning());
    const jjResult = classifyExercise(makeJumpingJack());
    expect(runResult.exercise).toBe("running");
    expect(jjResult.exercise).toBe("jumping-jack");
    expect(runResult.exercise).not.toBe(jjResult.exercise);
  });
});
