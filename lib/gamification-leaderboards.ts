import AsyncStorage from "@react-native-async-storage/async-storage";

export type LeaderboardTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";
export type SeasonStatus = "upcoming" | "active" | "ended";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  xp: number;
  totalReps: number;
  tier: LeaderboardTier;
  badge?: string;
  streak: number;
  weeklyScore: number;
}

export interface Season {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  status: SeasonStatus;
  rewards: SeasonReward[];
  leaderboard: LeaderboardEntry[];
}

export interface SeasonReward {
  tier: LeaderboardTier | "top-10" | "top-100";
  badge: string;
  xpBonus: number;
  title: string;
}

export interface TierThreshold {
  tier: LeaderboardTier;
  minXp: number;
  maxXp: number;
  badge: string;
  color: string;
}

const SEASONS_KEY = "@motionfit_seasons";
const TIER_THRESHOLDS: TierThreshold[] = [
  { tier: "bronze", minXp: 0, maxXp: 999, badge: "🥉", color: "#CD7F32" },
  { tier: "silver", minXp: 1000, maxXp: 4999, badge: "🥈", color: "#C0C0C0" },
  { tier: "gold", minXp: 5000, maxXp: 14999, badge: "🥇", color: "#FFD700" },
  { tier: "platinum", minXp: 15000, maxXp: 49999, badge: "💎", color: "#E5E4E2" },
  { tier: "diamond", minXp: 50000, maxXp: Infinity, badge: "💠", color: "#B9F2FF" },
];

/**
 * Get tier for XP amount
 */
export function getTierForXp(xp: number): LeaderboardTier {
  const threshold = TIER_THRESHOLDS.find((t) => xp >= t.minXp && xp <= t.maxXp);
  return threshold?.tier ?? "bronze";
}

/**
 * Get tier badge and color
 */
export function getTierInfo(tier: LeaderboardTier): { badge: string; color: string } {
  const threshold = TIER_THRESHOLDS.find((t) => t.tier === tier);
  return threshold ? { badge: threshold.badge, color: threshold.color } : { badge: "🥉", color: "#CD7F32" };
}

/**
 * Create new season
 */
export async function createSeason(name: string, durationDays: number = 7): Promise<Season> {
  try {
    const startDate = Date.now();
    const endDate = startDate + durationDays * 24 * 60 * 60 * 1000;
    const id = `season_${startDate}`;

    const season: Season = {
      id,
      name,
      startDate,
      endDate,
      status: "active",
      rewards: generateSeasonRewards(),
      leaderboard: [],
    };

    const existing = await getSeasons();
    const updated = [...existing, season];
    await AsyncStorage.setItem(SEASONS_KEY, JSON.stringify(updated));

    return season;
  } catch (error) {
    console.error("Failed to create season:", error);
    throw error;
  }
}

/**
 * Get all seasons
 */
export async function getSeasons(): Promise<Season[]> {
  try {
    const data = await AsyncStorage.getItem(SEASONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get seasons:", error);
    return [];
  }
}

/**
 * Get current active season
 */
export async function getCurrentSeason(): Promise<Season | null> {
  try {
    const seasons = await getSeasons();
    const now = Date.now();
    return seasons.find((s) => s.startDate <= now && now <= s.endDate) ?? null;
  } catch (error) {
    console.error("Failed to get current season:", error);
    return null;
  }
}

/**
 * Update season status
 */
export async function updateSeasonStatus(seasonId: string, status: SeasonStatus): Promise<void> {
  try {
    const seasons = await getSeasons();
    const updated = seasons.map((s) => (s.id === seasonId ? { ...s, status } : s));
    await AsyncStorage.setItem(SEASONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to update season status:", error);
  }
}

/**
 * Add entry to season leaderboard
 */
export async function addSeasonLeaderboardEntry(
  seasonId: string,
  entry: Omit<LeaderboardEntry, "rank">
): Promise<void> {
  try {
    const seasons = await getSeasons();
    const season = seasons.find((s) => s.id === seasonId);

    if (!season) return;

    const newEntry: LeaderboardEntry = {
      ...entry,
      rank: season.leaderboard.length + 1,
    };

    season.leaderboard.push(newEntry);
    season.leaderboard.sort((a, b) => b.xp - a.xp);
    season.leaderboard = season.leaderboard.map((e, i) => ({ ...e, rank: i + 1 }));

    await AsyncStorage.setItem(SEASONS_KEY, JSON.stringify(seasons));
  } catch (error) {
    console.error("Failed to add leaderboard entry:", error);
  }
}

/**
 * Get season leaderboard
 */
export async function getSeasonLeaderboard(seasonId: string): Promise<LeaderboardEntry[]> {
  try {
    const seasons = await getSeasons();
    const season = seasons.find((s) => s.id === seasonId);
    return season?.leaderboard ?? [];
  } catch (error) {
    console.error("Failed to get season leaderboard:", error);
    return [];
  }
}

/**
 * Get top 10 players
 */
export async function getTop10(seasonId: string): Promise<LeaderboardEntry[]> {
  try {
    const leaderboard = await getSeasonLeaderboard(seasonId);
    return leaderboard.slice(0, 10);
  } catch (error) {
    console.error("Failed to get top 10:", error);
    return [];
  }
}

/**
 * Get top 100 players
 */
export async function getTop100(seasonId: string): Promise<LeaderboardEntry[]> {
  try {
    const leaderboard = await getSeasonLeaderboard(seasonId);
    return leaderboard.slice(0, 100);
  } catch (error) {
    console.error("Failed to get top 100:", error);
    return [];
  }
}

/**
 * Get player rank in season
 */
export async function getPlayerRank(seasonId: string, userId: string): Promise<number | null> {
  try {
    const leaderboard = await getSeasonLeaderboard(seasonId);
    const entry = leaderboard.find((e) => e.userId === userId);
    return entry?.rank ?? null;
  } catch (error) {
    console.error("Failed to get player rank:", error);
    return null;
  }
}

/**
 * Generate season rewards
 */
function generateSeasonRewards(): SeasonReward[] {
  return [
    { tier: "top-10", badge: "🏆", xpBonus: 500, title: "Top 10 Finisher" },
    { tier: "top-100", badge: "⭐", xpBonus: 250, title: "Top 100 Finisher" },
    { tier: "diamond", badge: "💠", xpBonus: 1000, title: "Diamond Tier" },
    { tier: "platinum", badge: "💎", xpBonus: 500, title: "Platinum Tier" },
    { tier: "gold", badge: "🥇", xpBonus: 250, title: "Gold Tier" },
    { tier: "silver", badge: "🥈", xpBonus: 100, title: "Silver Tier" },
    { tier: "bronze", badge: "🥉", xpBonus: 50, title: "Bronze Tier" },
  ];
}

/**
 * Get season rewards for player
 */
export async function getPlayerSeasonRewards(
  seasonId: string,
  userId: string
): Promise<SeasonReward[]> {
  try {
    const season = (await getSeasons()).find((s) => s.id === seasonId);
    if (!season) return [];

    const entry = season.leaderboard.find((e) => e.userId === userId);
    if (!entry) return [];

    const rewards: SeasonReward[] = [];

    // Add tier reward
    const tierReward = season.rewards.find((r) => r.tier === entry.tier);
    if (tierReward) rewards.push(tierReward);

    // Add top 10/100 reward
    if (entry.rank <= 10) {
      const top10Reward = season.rewards.find((r) => r.tier === "top-10");
      if (top10Reward) rewards.push(top10Reward);
    } else if (entry.rank <= 100) {
      const top100Reward = season.rewards.find((r) => r.tier === "top-100");
      if (top100Reward) rewards.push(top100Reward);
    }

    return rewards;
  } catch (error) {
    console.error("Failed to get player season rewards:", error);
    return [];
  }
}

/**
 * Get tier progression
 */
export function getTierProgression(currentXp: number): {
  currentTier: LeaderboardTier;
  nextTier: LeaderboardTier | null;
  xpInTier: number;
  xpToNextTier: number;
  progressPercent: number;
} {
  const currentThreshold = TIER_THRESHOLDS.find((t) => currentXp >= t.minXp && currentXp <= t.maxXp);
  const currentTier = currentThreshold?.tier ?? "bronze";
  const nextThreshold = TIER_THRESHOLDS.find((t) => t.minXp > currentThreshold!.minXp);

  const xpInTier = currentXp - currentThreshold!.minXp;
  const tierRange = currentThreshold!.maxXp - currentThreshold!.minXp;
  const progressPercent = Math.min(100, (xpInTier / tierRange) * 100);

  return {
    currentTier,
    nextTier: nextThreshold?.tier ?? null,
    xpInTier,
    xpToNextTier: nextThreshold ? nextThreshold.minXp - currentXp : 0,
    progressPercent,
  };
}

/**
 * Check if season has ended
 */
export function isSeasonEnded(season: Season): boolean {
  return Date.now() > season.endDate;
}

/**
 * Get time remaining in season
 */
export function getTimeRemaining(season: Season): number {
  const remaining = season.endDate - Date.now();
  return Math.max(0, remaining);
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
