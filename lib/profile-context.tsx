import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  UserProfile,
  Achievement,
  loadProfile,
  saveProfile,
  checkNewAchievements,
  updateStreak,
  getLevelInfo,
  XP_PER_REP,
  XP_STREAK_BONUS,
  DEFAULT_PROFILE,
  type UserStats,
} from "./gamification";

interface ProfileContextValue {
  profile: UserProfile;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addXP: (amount: number) => Promise<{ newAchievements: Achievement[]; leveledUp: boolean }>;
  addRepsXP: (reps: number, exerciseType: string) => Promise<{ newAchievements: Achievement[]; leveledUp: boolean }>;
  completeChallenge: (challengeId: string, xpReward: number) => Promise<void>;
  updateQuestProgress: (exerciseType: string | undefined, reps: number) => Promise<void>;
  buildStats: () => UserStats;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const loaded = await loadProfile();
    setProfile(loaded);
  }, []);

  useEffect(() => {
    loadProfile().then((p) => {
      setProfile(p);
      setIsLoading(false);
    });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const buildStats = useCallback((): UserStats => {
    return {
      totalWorkouts: 0, // will be merged from workout store
      totalReps: 0,
      totalCalories: 0,
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      xp: profile.xp,
      exerciseTypes: new Set(),
    };
  }, [profile]);

  const addXP = useCallback(
    async (amount: number): Promise<{ newAchievements: Achievement[]; leveledUp: boolean }> => {
      return new Promise((resolve) => {
        setProfile((prev) => {
          const oldLevel = getLevelInfo(prev.xp).current.level;
          const newXP = prev.xp + amount;
          const newLevel = getLevelInfo(newXP).current.level;
          const leveledUp = newLevel > oldLevel;

          const stats: UserStats = {
            totalWorkouts: 0,
            totalReps: 0,
            totalCalories: 0,
            currentStreak: prev.currentStreak,
            longestStreak: prev.longestStreak,
            xp: newXP,
            exerciseTypes: new Set(),
          };

          const newAchievements = checkNewAchievements(prev, stats);
          const achievementXP = newAchievements.reduce((s, a) => s + a.xpReward, 0);
          const finalXP = newXP + achievementXP;

          const updated: UserProfile = {
            ...prev,
            xp: finalXP,
            unlockedAchievements: [
              ...prev.unlockedAchievements,
              ...newAchievements.map((a) => a.id),
            ],
          };

          saveProfile(updated);
          resolve({ newAchievements, leveledUp });
          return updated;
        });
      });
    },
    []
  );

  const addRepsXP = useCallback(
    async (reps: number, exerciseType: string) => {
      const streakMultiplier = profile.currentStreak >= 3 ? XP_STREAK_BONUS : 1;
      const xp = Math.round(reps * XP_PER_REP * streakMultiplier);
      return addXP(xp);
    },
    [profile.currentStreak, addXP]
  );

  const completeChallenge = useCallback(
    async (challengeId: string, xpReward: number) => {
      setProfile((prev) => {
        if (prev.completedChallenges.includes(challengeId)) return prev;
        const updated = {
          ...prev,
          completedChallenges: [...prev.completedChallenges, challengeId],
          xp: prev.xp + xpReward,
        };
        saveProfile(updated);
        return updated;
      });
    },
    []
  );

  const updateQuestProgress = useCallback(
    async (exerciseType: string | undefined, reps: number) => {
      setProfile((prev) => {
        const today = new Date().toISOString().split("T")[0];
        const questProgress =
          prev.lastQuestDate === today ? { ...prev.questProgress } : {};

        // Update progress for all matching quests
        Object.keys(questProgress).forEach((qId) => {
          questProgress[qId] = (questProgress[qId] ?? 0) + reps;
        });

        // Also track by exercise type key
        if (exerciseType) {
          const key = `ex_${exerciseType}`;
          questProgress[key] = (questProgress[key] ?? 0) + reps;
        }
        const totalKey = "ex_total";
        questProgress[totalKey] = (questProgress[totalKey] ?? 0) + reps;

        const updated = {
          ...prev,
          questProgress,
          lastQuestDate: today,
        };
        saveProfile(updated);
        return updated;
      });
    },
    []
  );

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        updateProfile,
        addXP,
        addRepsXP,
        completeChallenge,
        updateQuestProgress,
        buildStats,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
