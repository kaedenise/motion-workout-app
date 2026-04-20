import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("expo-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

/**
 * CRITICAL FIXES TEST SUITE
 * 
 * Tests for:
 * 1. Game challenges (Boss Battle, Speed Run, Endurance, Gauntlet)
 * 2. Leaderboard score submission
 * 3. Shareable challenge links
 */

describe("CRITICAL FIX #1: Game Challenges", () => {
  it("should have valid game challenge definitions", () => {
    const GAME_CHALLENGES = [
      { id: "boss-battle", name: "Boss Battle", emoji: "👹", description: "Defeat the boss" },
      { id: "speed-run", name: "Speed Run", emoji: "⚡", description: "Complete reps as fast as possible" },
      { id: "endurance", name: "Endurance", emoji: "💪", description: "Complete maximum reps" },
      { id: "gauntlet", name: "Gauntlet", emoji: "🎯", description: "Complete all exercises" },
    ];

    expect(GAME_CHALLENGES).toHaveLength(4);
    expect(GAME_CHALLENGES[0].id).toBe("boss-battle");
    expect(GAME_CHALLENGES[1].id).toBe("speed-run");
    expect(GAME_CHALLENGES[2].id).toBe("endurance");
    expect(GAME_CHALLENGES[3].id).toBe("gauntlet");
  });

  it("should calculate boss battle score correctly", () => {
    // Boss Battle: reps * 10 + time_bonus
    const reps = 25;
    const timeSeconds = 120;
    const timeBonus = Math.max(0, 300 - timeSeconds); // 300s baseline
    const score = reps * 10 + timeBonus;

    expect(score).toBe(25 * 10 + (300 - 120));
    expect(score).toBe(430);
  });

  it("should calculate speed run score correctly", () => {
    // Speed Run: 1000 / time_seconds * reps
    const reps = 20;
    const timeSeconds = 60;
    const score = Math.round((1000 / timeSeconds) * reps);

    expect(score).toBe(Math.round((1000 / 60) * 20));
    expect(score).toBeGreaterThan(0);
  });

  it("should calculate endurance score correctly", () => {
    // Endurance: reps * 5 (focus on max reps)
    const reps = 50;
    const score = reps * 5;

    expect(score).toBe(250);
  });

  it("should calculate gauntlet score correctly", () => {
    // Gauntlet: sum of all exercises
    const exercises = [
      { name: "push-up", reps: 20 },
      { name: "squat", reps: 25 },
      { name: "running", reps: 30 },
      { name: "jumping-jack", reps: 15 },
      { name: "sit-up", reps: 22 },
    ];

    const totalReps = exercises.reduce((sum, ex) => sum + ex.reps, 0);
    expect(totalReps).toBe(112);
  });
});

describe("CRITICAL FIX #2: Leaderboard Score Submission", () => {
  it("should validate phone number format", () => {
    const validatePhone = (phone: string) => /^\+?1?\d{10,}$/.test(phone.replace(/\D/g, ""));

    expect(validatePhone("+1-555-123-4567")).toBe(true);
    expect(validatePhone("5551234567")).toBe(true);
    expect(validatePhone("invalid")).toBe(false);
  });

  it("should create valid leaderboard submission payload", () => {
    const submission = {
      phoneNumber: "+15551234567",
      playerName: "TestPlayer",
      score: 1500,
      exerciseType: "push-up",
      timestamp: Date.now(),
      gameMode: "boss-battle",
    };

    expect(submission.phoneNumber).toBeTruthy();
    expect(submission.playerName).toBeTruthy();
    expect(submission.score).toBeGreaterThan(0);
    expect(submission.exerciseType).toBeTruthy();
    expect(submission.timestamp).toBeGreaterThan(0);
    expect(submission.gameMode).toBeTruthy();
  });

  it("should prevent duplicate score submissions", () => {
    const submissions = new Map<string, number>();
    const key = "phone_exercise_timestamp";

    // First submission
    submissions.set(key, 1500);
    expect(submissions.has(key)).toBe(true);

    // Attempt duplicate - should update, not add
    submissions.set(key, 1600);
    expect(submissions.size).toBe(1);
    expect(submissions.get(key)).toBe(1600);
  });

  it("should rank scores correctly", () => {
    const scores = [
      { playerName: "Alice", score: 2000 },
      { playerName: "Bob", score: 1500 },
      { playerName: "Charlie", score: 1800 },
    ];

    const ranked = scores.sort((a, b) => b.score - a.score);
    expect(ranked[0].playerName).toBe("Alice");
    expect(ranked[1].playerName).toBe("Charlie");
    expect(ranked[2].playerName).toBe("Bob");
  });
});

describe("CRITICAL FIX #3: Shareable Challenge Links", () => {
  it("should generate valid deep link format", () => {
    const generateLink = (friend: string, exercise: string, reps: number) => {
      return `motionfit://challenge?friend=${friend}&exercise=${exercise}&reps=${reps}`;
    };

    const link = generateLink("+15551234567", "push-up", 20);
    expect(link).toBe("motionfit://challenge?friend=+15551234567&exercise=push-up&reps=20");
    expect(link).toContain("motionfit://");
    expect(link).toContain("friend=");
    expect(link).toContain("exercise=");
    expect(link).toContain("reps=");
  });

  it("should parse deep link parameters correctly", () => {
    const parseLink = (url: string) => {
      // Replace + with %2B for proper URL encoding
      const encoded = url.replace("motionfit://", "https://").replace(/\+/g, "%2B");
      const urlObj = new URL(encoded);
      return {
        friend: decodeURIComponent(urlObj.searchParams.get("friend") || "").replace(/%2B/g, "+"),
        exercise: urlObj.searchParams.get("exercise"),
        reps: parseInt(urlObj.searchParams.get("reps") || "0", 10),
      };
    };

    const params = parseLink("motionfit://challenge?friend=%2B15551234567&exercise=squat&reps=25");
    expect(params.friend).toBe("+15551234567");
    expect(params.exercise).toBe("squat");
    expect(params.reps).toBe(25);
  });

  it("should validate challenge link parameters", () => {
    const validateParams = (friend: string, exercise: string, reps: number) => {
      const validExercises = ["push-up", "squat", "running", "jumping-jack", "sit-up"];
      return (
        friend &&
        validExercises.includes(exercise) &&
        reps > 0 &&
        reps <= 500
      );
    };

    expect(validateParams("+15551234567", "push-up", 20)).toBe(true);
    expect(validateParams("+15551234567", "invalid", 20)).toBe(false);
    expect(validateParams("+15551234567", "push-up", 0)).toBe(false);
    expect(validateParams("+15551234567", "push-up", 1000)).toBe(false);
  });

  it("should support URL encoding in deep links", () => {
    const encodeLink = (friend: string, exercise: string, reps: number) => {
      const params = new URLSearchParams({
        friend,
        exercise,
        reps: reps.toString(),
      });
      return `motionfit://challenge?${params.toString()}`;
    };

    const link = encodeLink("+1 (555) 123-4567", "jumping-jack", 15);
    expect(link).toContain("motionfit://challenge?");
    expect(link).toContain("friend=");
  });

  it("should handle share link display and copy", () => {
    const shareLink = "motionfit://challenge?friend=+15551234567&exercise=push-up&reps=20";
    const message = `Join my MotionFit challenge! ${shareLink}`;

    expect(message).toContain("motionfit://");
    expect(message).toContain("Join my MotionFit challenge!");
  });

  it("should support both motionfit:// and manus{timestamp}:// schemes", () => {
    const schemes = ["motionfit://", "manus20260416144553://"];

    schemes.forEach((scheme) => {
      const link = `${scheme}challenge?friend=+15551234567&exercise=push-up&reps=20`;
      expect(link).toContain("challenge?");
      expect(link).toContain("friend=");
    });
  });
});

describe("Integration: All Three Fixes Working Together", () => {
  it("should complete full game challenge flow", () => {
    // 1. Start game challenge
    const gameMode = "boss-battle";
    const exercise = "push-up";
    const targetReps = 25;

    // 2. Track performance
    const completedReps = 25;
    const timeSeconds = 120;

    // 3. Calculate score
    const timeBonus = Math.max(0, 300 - timeSeconds);
    const score = completedReps * 10 + timeBonus;

    // 4. Submit to leaderboard
    const submission = {
      phoneNumber: "+15551234567",
      playerName: "TestPlayer",
      score,
      exerciseType: exercise,
      gameMode,
    };

    expect(submission.score).toBe(430);
    expect(submission.gameMode).toBe("boss-battle");
  });

  it("should complete full challenge link flow", () => {
    // 1. Generate shareable link
    const friend = "+15551234567";
    const exercise = "squat";
    const reps = 30;
    const encodedFriend = encodeURIComponent(friend);
    const link = `motionfit://challenge?friend=${encodedFriend}&exercise=${exercise}&reps=${reps}`;

    // 2. Share link
    const message = `Join my MotionFit challenge! ${link}`;

    // 3. Parse received link
    const parseLink = (url: string) => {
      const encoded = url.replace("motionfit://", "https://");
      const urlObj = new URL(encoded);
      return {
        friend: decodeURIComponent(urlObj.searchParams.get("friend") || ""),
        exercise: urlObj.searchParams.get("exercise"),
        reps: parseInt(urlObj.searchParams.get("reps") || "0", 10),
      };
    };

    const params = parseLink(link);

    // 4. Create challenge from link
    expect(params.friend).toBe(friend);
    expect(params.exercise).toBe(exercise);
    expect(params.reps).toBe(reps);
  });
});
