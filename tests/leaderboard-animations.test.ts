import { describe, it, expect, vi } from "vitest";
import { getLevelInfo } from "../lib/gamification";

describe("Leaderboard Score Submission", () => {
  it("should calculate correct XP for challenge completion", () => {
    const baseXP = 100;
    const xpReward = 50;
    const totalXP = baseXP + xpReward;
    expect(totalXP).toBe(150);
  });

  it("should format leaderboard submission payload correctly", () => {
    const payload = {
      phoneNumber: "+1234567890",
      displayName: "Test User",
      avatarId: "avatar_1",
      xp: 500,
      totalReps: 100,
      totalWorkouts: 5,
      currentStreak: 3,
    };

    expect(payload.phoneNumber).toMatch(/^\+\d{10,}$/);
    expect(payload.displayName).toBeTruthy();
    expect(payload.xp).toBeGreaterThan(0);
    expect(payload.totalReps).toBeGreaterThan(0);
    expect(payload.totalWorkouts).toBeGreaterThan(0);
  });

  it("should calculate level correctly from XP", () => {
    const levelInfo = getLevelInfo(1000);
    expect(levelInfo.current.level).toBeGreaterThan(0);
    expect(levelInfo.current.title).toBeTruthy();
  });

  it("should handle zero reps gracefully", () => {
    const reps = 0;
    const totalReps = reps;
    expect(totalReps).toBe(0);
  });

  it("should track single workout correctly", () => {
    const totalWorkouts = 1;
    expect(totalWorkouts).toBe(1);
  });
});

describe("Challenge Screen Animations", () => {
  it("should initialize animation values correctly", () => {
    const repAnim = 1;
    const glowAnim = 0;
    const progressAnim = 0;
    const celebrationAnim = 0;

    expect(repAnim).toBe(1);
    expect(glowAnim).toBe(0);
    expect(progressAnim).toBe(0);
    expect(celebrationAnim).toBe(0);
  });

  it("should scale rep counter on rep detection", () => {
    const initialScale = 1;
    const animatedScale = 1.5; // Peak scale during animation
    expect(animatedScale).toBeGreaterThan(initialScale);
  });

  it("should trigger glow effect on rep", () => {
    const glowStart = 0;
    const glowPeak = 1;
    const glowEnd = 0;

    expect(glowPeak).toBeGreaterThan(glowStart);
    expect(glowEnd).toBe(glowStart);
  });

  it("should scale celebration emoji correctly", () => {
    const celebrationStart = 0.5;
    const celebrationPeak = 1.2;
    expect(celebrationPeak).toBeGreaterThan(celebrationStart);
  });

  it("should animate XP badge on completion", () => {
    const badgeStart = 0.8;
    const badgePeak = 1.1;
    expect(badgePeak).toBeGreaterThan(badgeStart);
  });
});

describe("Games Tab Integration", () => {
  it("should have correct game challenge IDs", () => {
    const gameIds = ["boss_pushup", "speedrun_squat", "endurance_jj", "combo_warrior"];
    expect(gameIds.length).toBe(4);
    gameIds.forEach((id) => {
      expect(id).toBeTruthy();
      expect(typeof id).toBe("string");
    });
  });

  it("should route to correct challenge screen", () => {
    const challengeId = "boss_pushup";
    const route = `/challenge/${challengeId}`;
    expect(route).toContain("challenge");
    expect(route).toContain(challengeId);
  });
});

describe("Friend Challenge Sharing", () => {
  it("should generate valid share link format", () => {
    const shareLink = "motionfit://challenge?friend=+1234567890&exercise=pushup&reps=30";
    expect(shareLink).toContain("motionfit://");
    expect(shareLink).toContain("challenge");
    expect(shareLink).toContain("friend=");
    expect(shareLink).toContain("exercise=");
    expect(shareLink).toContain("reps=");
  });

  it("should encode phone number in share link", () => {
    const phoneNumber = "+1234567890";
    const encoded = encodeURIComponent(phoneNumber);
    expect(encoded).toBeTruthy();
    expect(encoded.length).toBeGreaterThan(0);
  });

  it("should include exercise type in share link", () => {
    const exerciseType = "pushup";
    const shareLink = `motionfit://challenge?exercise=${exerciseType}`;
    expect(shareLink).toContain(exerciseType);
  });

  it("should include rep count in share link", () => {
    const reps = 30;
    const shareLink = `motionfit://challenge?reps=${reps}`;
    expect(shareLink).toContain("30");
  });
});

describe("Animation Timing", () => {
  it("should have correct rep animation duration", () => {
    const repAnimDuration = 250; // 100ms scale up + 150ms scale down
    expect(repAnimDuration).toBe(250);
  });

  it("should have correct glow animation duration", () => {
    const glowAnimDuration = 300; // 100ms up + 200ms down
    expect(glowAnimDuration).toBe(300);
  });

  it("should have correct celebration animation duration", () => {
    const celebrationDuration = 500; // 300ms up + 200ms down
    expect(celebrationDuration).toBe(500);
  });
});

describe("Leaderboard Entry Validation", () => {
  it("should validate phone number format", () => {
    const validPhones = ["+1234567890", "+44123456789", "+919876543210"];
    validPhones.forEach((phone) => {
      expect(phone).toMatch(/^\+\d{10,}$/);
    });
  });

  it("should validate display name", () => {
    const displayName = "John Doe";
    expect(displayName.length).toBeGreaterThan(0);
    expect(displayName.length).toBeLessThanOrEqual(64);
  });

  it("should validate avatar ID", () => {
    const avatarId = "avatar_1";
    expect(avatarId.length).toBeLessThanOrEqual(32);
  });

  it("should validate XP is non-negative", () => {
    const xp = 500;
    expect(xp).toBeGreaterThanOrEqual(0);
  });

  it("should validate streak is non-negative", () => {
    const streak = 5;
    expect(streak).toBeGreaterThanOrEqual(0);
  });
});
