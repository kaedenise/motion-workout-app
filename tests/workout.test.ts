import { describe, it, expect } from "vitest";
import {
  calculateCalories,
  formatDuration,
  formatDate,
  generateId,
  CALORIES_PER_REP,
  EXERCISE_LABELS,
  EXERCISE_ICONS,
  type ExerciseSet,
} from "../lib/workout-store";

describe("workout-store utilities", () => {
  it("calculateCalories returns 0 for empty sets", () => {
    expect(calculateCalories([])).toBe(0);
  });

  it("calculateCalories sums calories correctly", () => {
    const sets: ExerciseSet[] = [
      { exercise: "push-up", reps: 10, durationMs: 30000, startedAt: Date.now() },
      { exercise: "squat", reps: 20, durationMs: 40000, startedAt: Date.now() },
    ];
    const expected = 10 * CALORIES_PER_REP["push-up"] + 20 * CALORIES_PER_REP["squat"];
    expect(calculateCalories(sets)).toBeCloseTo(expected);
  });

  it("formatDuration formats seconds correctly", () => {
    expect(formatDuration(5000)).toBe("5s");
    expect(formatDuration(65000)).toBe("1m 5s");
    expect(formatDuration(3665000)).toBe("1h 1m 5s");
  });

  it("formatDate returns a non-empty string", () => {
    const result = formatDate(Date.now());
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("generateId returns unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1.startsWith("session_")).toBe(true);
  });

  it("EXERCISE_LABELS has entries for all exercise types", () => {
    const types = ["push-up", "squat", "jumping-jack", "sit-up", "running", "idle"];
    types.forEach((t) => {
      expect(EXERCISE_LABELS[t as keyof typeof EXERCISE_LABELS]).toBeTruthy();
    });
  });

  it("EXERCISE_ICONS has emoji for all exercise types", () => {
    const types = ["push-up", "squat", "jumping-jack", "sit-up", "running", "idle"];
    types.forEach((t) => {
      expect(EXERCISE_ICONS[t as keyof typeof EXERCISE_ICONS]).toBeTruthy();
    });
  });

  it("idle exercise has 0 calories per rep", () => {
    expect(CALORIES_PER_REP["idle"]).toBe(0);
  });
});
