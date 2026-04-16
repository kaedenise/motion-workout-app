import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── XP & Leveling ────────────────────────────────────────────────────────────

export const XP_PER_REP = 2;
export const XP_STREAK_BONUS = 1.5; // multiplier for active streak
export const XP_CHALLENGE_BONUS = 50;
export const XP_QUEST_BONUS = 100;

export const LEVELS = [
  { level: 1, title: "Rookie", minXP: 0, color: "#9CA3AF" },
  { level: 2, title: "Trainee", minXP: 100, color: "#60A5FA" },
  { level: 3, title: "Athlete", minXP: 300, color: "#34D399" },
  { level: 4, title: "Warrior", minXP: 600, color: "#FBBF24" },
  { level: 5, title: "Champion", minXP: 1000, color: "#F97316" },
  { level: 6, title: "Legend", minXP: 1800, color: "#A78BFA" },
  { level: 7, title: "Elite", minXP: 3000, color: "#F43F5E" },
  { level: 8, title: "Master", minXP: 5000, color: "#FF6B35" },
  { level: 9, title: "Grand Master", minXP: 8000, color: "#EC4899" },
  { level: 10, title: "God Mode", minXP: 12000, color: "#FFD700" },
];

export function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? LEVELS[i];
      break;
    }
  }
  const progress =
    next.minXP === current.minXP
      ? 1
      : (xp - current.minXP) / (next.minXP - current.minXP);
  return { current, next, progress: Math.min(progress, 1) };
}

// ─── Avatars ──────────────────────────────────────────────────────────────────

export interface Avatar {
  id: string;
  emoji: string;
  name: string;
  unlockLevel: number;
  color: string;
}

export const AVATARS: Avatar[] = [
  { id: "warrior", emoji: "⚔️", name: "Warrior", unlockLevel: 1, color: "#EF4444" },
  { id: "ninja", emoji: "🥷", name: "Ninja", unlockLevel: 1, color: "#1A1A2E" },
  { id: "robot", emoji: "🤖", name: "Cyborg", unlockLevel: 1, color: "#60A5FA" },
  { id: "lion", emoji: "🦁", name: "Lion", unlockLevel: 1, color: "#F59E0B" },
  { id: "wolf", emoji: "🐺", name: "Wolf", unlockLevel: 2, color: "#9CA3AF" },
  { id: "dragon", emoji: "🐲", name: "Dragon", unlockLevel: 3, color: "#34D399" },
  { id: "phoenix", emoji: "🦅", name: "Phoenix", unlockLevel: 4, color: "#FF6B35" },
  { id: "samurai", emoji: "🗡️", name: "Samurai", unlockLevel: 5, color: "#A78BFA" },
  { id: "wizard", emoji: "🧙", name: "Wizard", unlockLevel: 6, color: "#8B5CF6" },
  { id: "titan", emoji: "💪", name: "Titan", unlockLevel: 7, color: "#F43F5E" },
  { id: "ghost", emoji: "👻", name: "Ghost", unlockLevel: 8, color: "#E0E7FF" },
  { id: "god", emoji: "⚡", name: "Zeus", unlockLevel: 10, color: "#FFD700" },
];

// ─── Achievements ─────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xpReward: number;
  check: (stats: UserStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_workout",
    title: "First Step",
    description: "Complete your first workout",
    emoji: "🎯",
    xpReward: 50,
    check: (s) => s.totalWorkouts >= 1,
  },
  {
    id: "rep_100",
    title: "Century Club",
    description: "Reach 100 total reps",
    emoji: "💯",
    xpReward: 75,
    check: (s) => s.totalReps >= 100,
  },
  {
    id: "rep_500",
    title: "Rep Machine",
    description: "Reach 500 total reps",
    emoji: "🔥",
    xpReward: 150,
    check: (s) => s.totalReps >= 500,
  },
  {
    id: "rep_1000",
    title: "Thousand Reps",
    description: "Reach 1,000 total reps",
    emoji: "🏆",
    xpReward: 300,
    check: (s) => s.totalReps >= 1000,
  },
  {
    id: "streak_3",
    title: "On Fire",
    description: "Maintain a 3-day streak",
    emoji: "🔥",
    xpReward: 100,
    check: (s) => s.currentStreak >= 3,
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    emoji: "📅",
    xpReward: 250,
    check: (s) => s.currentStreak >= 7,
  },
  {
    id: "streak_30",
    title: "Iron Discipline",
    description: "Maintain a 30-day streak",
    emoji: "🛡️",
    xpReward: 1000,
    check: (s) => s.currentStreak >= 30,
  },
  {
    id: "workout_10",
    title: "Dedicated",
    description: "Complete 10 workouts",
    emoji: "⭐",
    xpReward: 200,
    check: (s) => s.totalWorkouts >= 10,
  },
  {
    id: "workout_50",
    title: "Gym Rat",
    description: "Complete 50 workouts",
    emoji: "🐀",
    xpReward: 500,
    check: (s) => s.totalWorkouts >= 50,
  },
  {
    id: "calorie_1000",
    title: "Calorie Crusher",
    description: "Burn 1,000 calories total",
    emoji: "🌡️",
    xpReward: 200,
    check: (s) => s.totalCalories >= 1000,
  },
  {
    id: "level_5",
    title: "Champion",
    description: "Reach Level 5",
    emoji: "🥇",
    xpReward: 0,
    check: (s) => getLevelInfo(s.xp).current.level >= 5,
  },
  {
    id: "all_exercises",
    title: "All-Rounder",
    description: "Try all 5 exercise types",
    emoji: "🎭",
    xpReward: 150,
    check: (s) => s.exerciseTypes.size >= 5,
  },
];

// ─── Daily Quests ─────────────────────────────────────────────────────────────

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  emoji: string;
  targetReps: number;
  exerciseType?: string;
  xpReward: number;
  difficulty: "easy" | "medium" | "hard";
}

export const QUEST_POOL: DailyQuest[] = [
  { id: "q_pushup_10", title: "Push-Up Starter", description: "Do 10 push-ups", emoji: "💪", targetReps: 10, exerciseType: "push-up", xpReward: 50, difficulty: "easy" },
  { id: "q_pushup_25", title: "Push-Up Pro", description: "Do 25 push-ups", emoji: "💪", targetReps: 25, exerciseType: "push-up", xpReward: 100, difficulty: "medium" },
  { id: "q_squat_15", title: "Squat Squad", description: "Do 15 squats", emoji: "🦵", targetReps: 15, exerciseType: "squat", xpReward: 60, difficulty: "easy" },
  { id: "q_squat_30", title: "Squat Master", description: "Do 30 squats", emoji: "🦵", targetReps: 30, exerciseType: "squat", xpReward: 120, difficulty: "medium" },
  { id: "q_jj_20", title: "Jump Around", description: "Do 20 jumping jacks", emoji: "⚡", targetReps: 20, exerciseType: "jumping-jack", xpReward: 60, difficulty: "easy" },
  { id: "q_jj_50", title: "Jack Attack", description: "Do 50 jumping jacks", emoji: "⚡", targetReps: 50, exerciseType: "jumping-jack", xpReward: 150, difficulty: "hard" },
  { id: "q_situp_15", title: "Core Crusher", description: "Do 15 sit-ups", emoji: "🔥", targetReps: 15, exerciseType: "sit-up", xpReward: 60, difficulty: "easy" },
  { id: "q_run_100", title: "Sprint Session", description: "Log 100 running steps", emoji: "🏃", targetReps: 100, exerciseType: "running", xpReward: 80, difficulty: "medium" },
  { id: "q_total_50", title: "Fifty Rep Day", description: "Complete 50 total reps", emoji: "🎯", targetReps: 50, xpReward: 100, difficulty: "medium" },
  { id: "q_total_100", title: "Century Challenge", description: "Complete 100 total reps", emoji: "💯", targetReps: 100, xpReward: 200, difficulty: "hard" },
];

export function getDailyQuests(seed: number): DailyQuest[] {
  // Deterministic daily quest selection based on date seed
  const shuffled = [...QUEST_POOL].sort((a, b) => {
    const ha = hashCode(a.id + seed);
    const hb = hashCode(b.id + seed);
    return ha - hb;
  });
  return shuffled.slice(0, 3);
}

function hashCode(str: string | number): number {
  const s = String(str);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// ─── Game Challenges ──────────────────────────────────────────────────────────

export interface GameChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  mode: "boss" | "speedrun" | "endurance" | "combo";
  targetReps: number;
  timeLimitSeconds?: number;
  exerciseType?: string;
  xpReward: number;
  color: string;
  difficulty: "easy" | "medium" | "hard" | "extreme";
}

export const GAME_CHALLENGES: GameChallenge[] = [
  {
    id: "boss_pushup",
    title: "Push-Up Boss",
    description: "Defeat the Boss: 30 push-ups before time runs out!",
    emoji: "👹",
    mode: "boss",
    targetReps: 30,
    timeLimitSeconds: 120,
    exerciseType: "push-up",
    xpReward: 150,
    color: "#EF4444",
    difficulty: "medium",
  },
  {
    id: "speedrun_squat",
    title: "Squat Speed Run",
    description: "20 squats as fast as possible. Beat your record!",
    emoji: "⚡",
    mode: "speedrun",
    targetReps: 20,
    timeLimitSeconds: 60,
    exerciseType: "squat",
    xpReward: 120,
    color: "#F59E0B",
    difficulty: "medium",
  },
  {
    id: "endurance_jj",
    title: "Jumping Jack Marathon",
    description: "100 jumping jacks. No time limit. Pure endurance.",
    emoji: "🏃",
    mode: "endurance",
    targetReps: 100,
    exerciseType: "jumping-jack",
    xpReward: 300,
    color: "#00D4AA",
    difficulty: "hard",
  },
  {
    id: "combo_warrior",
    title: "Warrior Combo",
    description: "50 total reps mixing any exercises. Combo multiplier!",
    emoji: "⚔️",
    mode: "combo",
    targetReps: 50,
    timeLimitSeconds: 180,
    xpReward: 200,
    color: "#8B5CF6",
    difficulty: "hard",
  },
  {
    id: "boss_situp",
    title: "Sit-Up Showdown",
    description: "25 sit-ups in 90 seconds. The core boss awaits!",
    emoji: "💀",
    mode: "boss",
    targetReps: 25,
    timeLimitSeconds: 90,
    exerciseType: "sit-up",
    xpReward: 130,
    color: "#F43F5E",
    difficulty: "medium",
  },
  {
    id: "extreme_century",
    title: "Century Gauntlet",
    description: "100 push-ups. No mercy. Legends only.",
    emoji: "🔱",
    mode: "endurance",
    targetReps: 100,
    exerciseType: "push-up",
    xpReward: 500,
    color: "#FFD700",
    difficulty: "extreme",
  },
];

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserStats {
  totalWorkouts: number;
  totalReps: number;
  totalCalories: number;
  currentStreak: number;
  longestStreak: number;
  xp: number;
  exerciseTypes: Set<string>;
}

export interface UserProfile {
  name: string;
  avatarId: string;
  xp: number;
  unlockedAchievements: string[];
  completedChallenges: string[];
  questProgress: Record<string, number>; // questId -> reps done today
  lastQuestDate: string; // YYYY-MM-DD
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string;
  voicePersona: VoicePersona;
  voiceEnabled: boolean;
}

export type VoicePersona = "drill" | "coach" | "zen";

export const VOICE_PERSONAS: Record<VoicePersona, { name: string; emoji: string; description: string; pitch: number; rate: number }> = {
  drill: {
    name: "Drill Sergeant",
    emoji: "🪖",
    description: "No excuses. Push harder. Pain is weakness leaving the body.",
    pitch: 0.85,
    rate: 1.1,
  },
  coach: {
    name: "Friendly Coach",
    emoji: "🏅",
    description: "Encouraging, positive, and motivating. You've got this!",
    pitch: 1.1,
    rate: 0.95,
  },
  zen: {
    name: "Zen Master",
    emoji: "🧘",
    description: "Calm, focused, mindful. Every rep is a meditation.",
    pitch: 0.9,
    rate: 0.85,
  },
};

const PROFILE_KEY = "motionfit_profile_v2";

export const DEFAULT_PROFILE: UserProfile = {
  name: "Athlete",
  avatarId: "warrior",
  xp: 0,
  unlockedAchievements: [],
  completedChallenges: [],
  questProgress: {},
  lastQuestDate: "",
  currentStreak: 0,
  longestStreak: 0,
  lastWorkoutDate: "",
  voicePersona: "coach",
  voiceEnabled: true,
};

export async function loadProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function checkNewAchievements(
  profile: UserProfile,
  stats: UserStats
): Achievement[] {
  return ACHIEVEMENTS.filter(
    (a) => !profile.unlockedAchievements.includes(a.id) && a.check(stats)
  );
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function updateStreak(profile: UserProfile): UserProfile {
  const today = getTodayDateString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (profile.lastWorkoutDate === today) {
    return profile; // already worked out today
  }

  let newStreak = 1;
  if (profile.lastWorkoutDate === yesterday) {
    newStreak = profile.currentStreak + 1;
  }

  return {
    ...profile,
    currentStreak: newStreak,
    longestStreak: Math.max(profile.longestStreak, newStreak),
    lastWorkoutDate: today,
  };
}
