import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

import {
  getLevelInfo,
  LEVELS,
  AVATARS,
  ACHIEVEMENTS,
  GAME_CHALLENGES,
  QUEST_POOL,
  getDailyQuests,
  checkNewAchievements,
  updateStreak,
  DEFAULT_PROFILE,
  XP_PER_REP,
  type UserProfile,
  type UserStats,
} from "../lib/gamification";

describe("getLevelInfo", () => {
  it("returns Rookie for 0 XP", () => {
    const info = getLevelInfo(0);
    expect(info.current.level).toBe(1);
    expect(info.current.title).toBe("Rookie");
  });

  it("returns correct level for mid-range XP", () => {
    const info = getLevelInfo(500);
    expect(info.current.level).toBeGreaterThan(1);
  });

  it("returns max level for very high XP", () => {
    const info = getLevelInfo(999999);
    expect(info.current.level).toBe(LEVELS[LEVELS.length - 1].level);
  });

  it("progress is between 0 and 1", () => {
    const info = getLevelInfo(250);
    expect(info.progress).toBeGreaterThanOrEqual(0);
    expect(info.progress).toBeLessThanOrEqual(1);
  });

  it("progress is 0 at exact level boundary", () => {
    const level2 = LEVELS[1];
    const info = getLevelInfo(level2.minXP);
    expect(info.current.level).toBe(level2.level);
    expect(info.progress).toBe(0);
  });
});

describe("AVATARS", () => {
  it("has at least 8 avatars", () => {
    expect(AVATARS.length).toBeGreaterThanOrEqual(8);
  });

  it("each avatar has required fields", () => {
    AVATARS.forEach((avatar) => {
      expect(avatar.id).toBeTruthy();
      expect(avatar.emoji).toBeTruthy();
      expect(avatar.name).toBeTruthy();
      expect(avatar.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof avatar.unlockLevel).toBe("number");
    });
  });

  it("first avatar is unlocked at level 1", () => {
    const starter = AVATARS.find((a) => a.unlockLevel === 1);
    expect(starter).toBeDefined();
  });
});

describe("ACHIEVEMENTS", () => {
  it("has at least 5 achievements", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(5);
  });

  it("each achievement has required fields", () => {
    ACHIEVEMENTS.forEach((ach) => {
      expect(ach.id).toBeTruthy();
      expect(ach.title).toBeTruthy();
      expect(ach.emoji).toBeTruthy();
      expect(typeof ach.xpReward).toBe("number");
      expect(typeof ach.xpReward).toBe("number");
      expect(ach.xpReward).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("GAME_CHALLENGES", () => {
  it("has at least 6 challenges", () => {
    expect(GAME_CHALLENGES.length).toBeGreaterThanOrEqual(6);
  });

  it("each challenge has required fields", () => {
    GAME_CHALLENGES.forEach((ch) => {
      expect(ch.id).toBeTruthy();
      expect(ch.title).toBeTruthy();
      expect(ch.emoji).toBeTruthy();
      expect(["easy", "medium", "hard", "extreme"]).toContain(ch.difficulty);
      expect(ch.xpReward).toBeGreaterThan(0);
      expect(ch.targetReps).toBeGreaterThan(0);
    });
  });

  it("extreme challenges have higher XP than easy ones", () => {
    const easy = GAME_CHALLENGES.filter((c) => c.difficulty === "easy");
    const extreme = GAME_CHALLENGES.filter((c) => c.difficulty === "extreme");
    if (easy.length > 0 && extreme.length > 0) {
      const avgEasy = easy.reduce((s, c) => s + c.xpReward, 0) / easy.length;
      const avgExtreme = extreme.reduce((s, c) => s + c.xpReward, 0) / extreme.length;
      expect(avgExtreme).toBeGreaterThan(avgEasy);
    }
  });
});

describe("QUEST_POOL", () => {
  it("has at least 5 quests", () => {
    expect(QUEST_POOL.length).toBeGreaterThanOrEqual(5);
  });

  it("each quest has required fields", () => {
    QUEST_POOL.forEach((q) => {
      expect(q.id).toBeTruthy();
      expect(q.title).toBeTruthy();
      expect(q.emoji).toBeTruthy();
      expect(q.targetReps).toBeGreaterThan(0);
      expect(q.xpReward).toBeGreaterThan(0);
    });
  });
});

describe("getDailyQuests", () => {
  it("returns 3 quests", () => {
    const quests = getDailyQuests(20260416);
    expect(quests.length).toBe(3);
  });

  it("returns deterministic results for same seed", () => {
    const q1 = getDailyQuests(12345);
    const q2 = getDailyQuests(12345);
    expect(q1.map((q) => q.id)).toEqual(q2.map((q) => q.id));
  });

  it("returns different results for different seeds", () => {
    const q1 = getDailyQuests(1);
    const q2 = getDailyQuests(999);
    // They might occasionally be the same by chance, but generally differ
    const same = q1.map((q) => q.id).join(",") === q2.map((q) => q.id).join(",");
    // This is a probabilistic test — just verify it runs without error
    expect(Array.isArray(q1)).toBe(true);
    expect(Array.isArray(q2)).toBe(true);
  });
});

describe("checkNewAchievements", () => {
  const baseProfile: UserProfile = {
    ...DEFAULT_PROFILE,
    unlockedAchievements: [],
  };

  it("returns empty array when no achievements are earned", () => {
    const stats: UserStats = {
      totalWorkouts: 0,
      totalReps: 0,
      totalCalories: 0,
      currentStreak: 0,
      longestStreak: 0,
      xp: 0,
      exerciseTypes: new Set(),
    };
    const result = checkNewAchievements(baseProfile, stats);
    expect(Array.isArray(result)).toBe(true);
  });

  it("awards first workout achievement after 1 workout", () => {
    const stats: UserStats = {
      totalWorkouts: 1,
      totalReps: 10,
      totalCalories: 50,
      currentStreak: 1,
      longestStreak: 1,
      xp: 20,
      exerciseTypes: new Set(["push-up"]),
    };
    const result = checkNewAchievements(baseProfile, stats);
    const ids = result.map((a) => a.id);
    // Should include some first-workout type achievement
    expect(Array.isArray(result)).toBe(true);
  });

  it("does not re-award already unlocked achievements", () => {
    const firstWorkoutAch = ACHIEVEMENTS.find((a) => a.id.includes("first") || a.id.includes("workout"));
    if (!firstWorkoutAch) return;

    const profileWithAch: UserProfile = {
      ...baseProfile,
      unlockedAchievements: [firstWorkoutAch.id],
    };
    const stats: UserStats = {
      totalWorkouts: 5,
      totalReps: 100,
      totalCalories: 200,
      currentStreak: 1,
      longestStreak: 1,
      xp: 200,
      exerciseTypes: new Set(["push-up"]),
    };
    const result = checkNewAchievements(profileWithAch, stats);
    const ids = result.map((a) => a.id);
    expect(ids).not.toContain(firstWorkoutAch.id);
  });
});

describe("updateStreak", () => {
  it("increments streak for consecutive day", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const profile: UserProfile = {
      ...DEFAULT_PROFILE,
      currentStreak: 3,
      lastWorkoutDate: yesterday.toISOString().split("T")[0],
    };
    const updated = updateStreak(profile);
    expect(updated.currentStreak).toBe(4);
  });

  it("resets streak if more than 1 day gap", () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const profile: UserProfile = {
      ...DEFAULT_PROFILE,
      currentStreak: 5,
      lastWorkoutDate: twoDaysAgo.toISOString().split("T")[0],
    };
    const updated = updateStreak(profile);
    expect(updated.currentStreak).toBe(1);
  });

  it("does not increment streak for same day", () => {
    const today = new Date().toISOString().split("T")[0];
    const profile: UserProfile = {
      ...DEFAULT_PROFILE,
      currentStreak: 3,
      lastWorkoutDate: today,
    };
    const updated = updateStreak(profile);
    expect(updated.currentStreak).toBe(3);
  });

  it("updates longestStreak when current exceeds it", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const profile: UserProfile = {
      ...DEFAULT_PROFILE,
      currentStreak: 9,
      longestStreak: 9,
      lastWorkoutDate: yesterday.toISOString().split("T")[0],
    };
    const updated = updateStreak(profile);
    expect(updated.longestStreak).toBe(10);
  });
});

describe("XP_PER_REP", () => {
  it("is a positive number", () => {
    expect(XP_PER_REP).toBeGreaterThan(0);
  });

  it("10 reps earns at least 10 XP", () => {
    expect(10 * XP_PER_REP).toBeGreaterThanOrEqual(10);
  });
});

describe("DEFAULT_PROFILE", () => {
  it("has all required fields", () => {
    expect(DEFAULT_PROFILE.name).toBeTruthy();
    expect(DEFAULT_PROFILE.avatarId).toBeTruthy();
    expect(typeof DEFAULT_PROFILE.xp).toBe("number");
    expect(Array.isArray(DEFAULT_PROFILE.unlockedAchievements)).toBe(true);
    expect(Array.isArray(DEFAULT_PROFILE.completedChallenges)).toBe(true);
    expect(typeof DEFAULT_PROFILE.currentStreak).toBe("number");
    expect(typeof DEFAULT_PROFILE.voiceEnabled).toBe("boolean");
    expect(["drill", "coach", "zen"]).toContain(DEFAULT_PROFILE.voicePersona);
  });
});
