import AsyncStorage from "@react-native-async-storage/async-storage";

export type ChallengeScope = "global" | "regional" | "friends";
export type ChallengeType = "team" | "individual" | "squad";

export interface CommunityChallenge {
  id: string;
  name: string;
  description: string;
  scope: ChallengeScope;
  type: ChallengeType;
  startDate: number;
  endDate: number;
  exerciseType: string;
  targetReps: number;
  participants: ChallengeParticipant[];
  teams: ChallengeTeam[];
  rewards: ChallengeReward[];
  status: "upcoming" | "active" | "ended";
}

export interface ChallengeParticipant {
  userId: string;
  displayName: string;
  repsCompleted: number;
  progressPercent: number;
  joinedDate: number;
  teamId?: string;
}

export interface ChallengeTeam {
  id: string;
  name: string;
  members: ChallengeParticipant[];
  totalReps: number;
  rank: number;
  color: string;
}

export interface ChallengeReward {
  rank: number;
  title: string;
  badge: string;
  xpBonus: number;
}

const CHALLENGES_KEY = "@motionfit_community_challenges";
const PARTICIPANT_CHALLENGES_KEY = "@motionfit_participant_challenges";

/**
 * Create community challenge
 */
export async function createCommunityChallenge(
  name: string,
  description: string,
  scope: ChallengeScope,
  type: ChallengeType,
  exerciseType: string,
  targetReps: number,
  durationDays: number = 7
): Promise<CommunityChallenge> {
  try {
    const startDate = Date.now();
    const endDate = startDate + durationDays * 24 * 60 * 60 * 1000;
    const id = `challenge_${startDate}`;

    const challenge: CommunityChallenge = {
      id,
      name,
      description,
      scope,
      type,
      startDate,
      endDate,
      exerciseType,
      targetReps,
      participants: [],
      teams: [],
      rewards: generateChallengeRewards(),
      status: "active",
    };

    const existing = await getCommunityChallenge();
    const updated = [...existing, challenge];
    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(updated));

    return challenge;
  } catch (error) {
    console.error("Failed to create community challenge:", error);
    throw error;
  }
}

/**
 * Get all community challenges
 */
export async function getCommunityChallenge(): Promise<CommunityChallenge[]> {
  try {
    const data = await AsyncStorage.getItem(CHALLENGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get community challenges:", error);
    return [];
  }
}

/**
 * Get active challenges
 */
export async function getActiveChallenges(): Promise<CommunityChallenge[]> {
  try {
    const challenges = await getCommunityChallenge();
    const now = Date.now();
    return challenges.filter((c) => c.startDate <= now && now <= c.endDate && c.status === "active");
  } catch (error) {
    console.error("Failed to get active challenges:", error);
    return [];
  }
}

/**
 * Get challenge by scope
 */
export async function getChallengesByScope(scope: ChallengeScope): Promise<CommunityChallenge[]> {
  try {
    const challenges = await getActiveChallenges();
    return challenges.filter((c) => c.scope === scope);
  } catch (error) {
    console.error("Failed to get challenges by scope:", error);
    return [];
  }
}

/**
 * Join challenge
 */
export async function joinChallenge(
  challengeId: string,
  userId: string,
  displayName: string,
  teamId?: string
): Promise<void> {
  try {
    const challenges = await getCommunityChallenge();
    const challenge = challenges.find((c) => c.id === challengeId);

    if (!challenge) return;

    const participant: ChallengeParticipant = {
      userId,
      displayName,
      repsCompleted: 0,
      progressPercent: 0,
      joinedDate: Date.now(),
      teamId,
    };

    challenge.participants.push(participant);

    if (teamId) {
      const team = challenge.teams.find((t) => t.id === teamId);
      if (team) {
        team.members.push(participant);
      }
    }

    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));

    // Track participant challenges
    const participantChallenges = await getParticipantChallenges(userId);
    await AsyncStorage.setItem(
      PARTICIPANT_CHALLENGES_KEY,
      JSON.stringify([...participantChallenges, challengeId])
    );
  } catch (error) {
    console.error("Failed to join challenge:", error);
  }
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  challengeId: string,
  userId: string,
  repsCompleted: number
): Promise<void> {
  try {
    const challenges = await getCommunityChallenge();
    const challenge = challenges.find((c) => c.id === challengeId);

    if (!challenge) return;

    const participant = challenge.participants.find((p) => p.userId === userId);
    if (!participant) return;

    participant.repsCompleted = repsCompleted;
    participant.progressPercent = Math.min(100, (repsCompleted / challenge.targetReps) * 100);

    // Update team progress
    if (participant.teamId) {
      const team = challenge.teams.find((t) => t.id === participant.teamId);
      if (team) {
        team.totalReps = team.members.reduce((sum, m) => sum + m.repsCompleted, 0);
      }
    }

    // Update rankings
    updateChallengeRankings(challenge);

    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
  } catch (error) {
    console.error("Failed to update challenge progress:", error);
  }
}

/**
 * Create team for challenge
 */
export async function createTeam(
  challengeId: string,
  teamName: string,
  color: string
): Promise<ChallengeTeam> {
  try {
    const challenges = await getCommunityChallenge();
    const challenge = challenges.find((c) => c.id === challengeId);

    if (!challenge) throw new Error("Challenge not found");

    const team: ChallengeTeam = {
      id: `team_${Date.now()}`,
      name: teamName,
      members: [],
      totalReps: 0,
      rank: challenge.teams.length + 1,
      color,
    };

    challenge.teams.push(team);
    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));

    return team;
  } catch (error) {
    console.error("Failed to create team:", error);
    throw error;
  }
}

/**
 * Get challenge leaderboard
 */
export async function getChallengeLeaderboard(
  challengeId: string
): Promise<ChallengeParticipant[]> {
  try {
    const challenges = await getCommunityChallenge();
    const challenge = challenges.find((c) => c.id === challengeId);

    if (!challenge) return [];

    return challenge.participants.sort((a, b) => b.repsCompleted - a.repsCompleted);
  } catch (error) {
    console.error("Failed to get challenge leaderboard:", error);
    return [];
  }
}

/**
 * Get team leaderboard
 */
export async function getTeamLeaderboard(challengeId: string): Promise<ChallengeTeam[]> {
  try {
    const challenges = await getCommunityChallenge();
    const challenge = challenges.find((c) => c.id === challengeId);

    if (!challenge) return [];

    return challenge.teams.sort((a, b) => b.totalReps - a.totalReps);
  } catch (error) {
    console.error("Failed to get team leaderboard:", error);
    return [];
  }
}

/**
 * Get participant challenges
 */
export async function getParticipantChallenges(userId: string): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(`${PARTICIPANT_CHALLENGES_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get participant challenges:", error);
    return [];
  }
}

/**
 * Get challenge details
 */
export async function getChallengeDetails(challengeId: string): Promise<CommunityChallenge | null> {
  try {
    const challenges = await getCommunityChallenge();
    return challenges.find((c) => c.id === challengeId) ?? null;
  } catch (error) {
    console.error("Failed to get challenge details:", error);
    return null;
  }
}

/**
 * Get challenge progress for user
 */
export async function getUserChallengeProgress(
  challengeId: string,
  userId: string
): Promise<ChallengeParticipant | null> {
  try {
    const challenge = await getChallengeDetails(challengeId);
    if (!challenge) return null;

    return challenge.participants.find((p) => p.userId === userId) ?? null;
  } catch (error) {
    console.error("Failed to get user challenge progress:", error);
    return null;
  }
}

/**
 * Generate challenge rewards
 */
function generateChallengeRewards(): ChallengeReward[] {
  return [
    { rank: 1, title: "🥇 Champion", badge: "🏆", xpBonus: 1000 },
    { rank: 2, title: "🥈 Runner-up", badge: "⭐", xpBonus: 500 },
    { rank: 3, title: "🥉 Third Place", badge: "✨", xpBonus: 250 },
    { rank: 4, title: "Top 10", badge: "🎯", xpBonus: 100 },
    { rank: 5, title: "Top 10", badge: "🎯", xpBonus: 100 },
  ];
}

/**
 * Update challenge rankings
 */
function updateChallengeRankings(challenge: CommunityChallenge): void {
  // Update individual rankings
  const sortedParticipants = challenge.participants.sort((a, b) => b.repsCompleted - a.repsCompleted);
  sortedParticipants.forEach((p, i) => {
    // Rank is implicit in array position
  });

  // Update team rankings
  const sortedTeams = challenge.teams.sort((a, b) => b.totalReps - a.totalReps);
  sortedTeams.forEach((t, i) => {
    t.rank = i + 1;
  });
}

/**
 * End challenge and distribute rewards
 */
export async function endChallenge(challengeId: string): Promise<ChallengeReward[]> {
  try {
    const challenges = await getCommunityChallenge();
    const challenge = challenges.find((c) => c.id === challengeId);

    if (!challenge) return [];

    challenge.status = "ended";
    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));

    return challenge.rewards;
  } catch (error) {
    console.error("Failed to end challenge:", error);
    return [];
  }
}

/**
 * Get challenge progress percentage
 */
export function getChallengeProgressPercent(challenge: CommunityChallenge): number {
  const totalDuration = challenge.endDate - challenge.startDate;
  const elapsed = Date.now() - challenge.startDate;
  return Math.min(100, (elapsed / totalDuration) * 100);
}

/**
 * Get time remaining in challenge
 */
export function getTimeRemaining(challenge: CommunityChallenge): number {
  const remaining = challenge.endDate - Date.now();
  return Math.max(0, remaining);
}
