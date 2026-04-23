import AsyncStorage from "@react-native-async-storage/async-storage";

export interface MultiplayerSession {
  id: string;
  hostId: string;
  hostName: string;
  participants: MultiplayerParticipant[];
  exerciseType: string;
  targetReps: number;
  status: "waiting" | "active" | "completed";
  startTime: number;
  endTime?: number;
  results?: MultiplayerResult[];
}

export interface MultiplayerParticipant {
  userId: string;
  displayName: string;
  currentReps: number;
  formScore: number;
  status: "ready" | "working" | "finished";
  joinedAt: number;
}

export interface MultiplayerResult {
  userId: string;
  displayName: string;
  finalReps: number;
  avgFormScore: number;
  timeToComplete: number;
  rank: number;
}

export interface RealTimeUpdate {
  sessionId: string;
  userId: string;
  reps: number;
  formScore: number;
  timestamp: number;
}

export interface CompetitiveLeaderboard {
  sessionId: string;
  rankings: Array<{
    rank: number;
    userId: string;
    displayName: string;
    reps: number;
    formScore: number;
    status: string;
  }>;
}

const SESSIONS_KEY = "@motionfit_multiplayer_sessions";
const UPDATES_KEY = "@motionfit_realtime_updates";

/**
 * Create multiplayer session
 */
export async function createMultiplayerSession(
  hostId: string,
  hostName: string,
  exerciseType: string,
  targetReps: number
): Promise<MultiplayerSession> {
  try {
    const session: MultiplayerSession = {
      id: `session_${Date.now()}`,
      hostId,
      hostName,
      participants: [
        {
          userId: hostId,
          displayName: hostName,
          currentReps: 0,
          formScore: 0,
          status: "ready",
          joinedAt: Date.now(),
        },
      ],
      exerciseType,
      targetReps,
      status: "waiting",
      startTime: Date.now(),
    };

    const existing = await getMultiplayerSessions();
    existing.push(session);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(existing));

    return session;
  } catch (error) {
    console.error("Failed to create multiplayer session:", error);
    throw error;
  }
}

/**
 * Get multiplayer sessions
 */
export async function getMultiplayerSessions(): Promise<MultiplayerSession[]> {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get multiplayer sessions:", error);
    return [];
  }
}

/**
 * Join multiplayer session
 */
export async function joinMultiplayerSession(
  sessionId: string,
  userId: string,
  displayName: string
): Promise<MultiplayerSession | null> {
  try {
    const sessions = await getMultiplayerSessions();
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) return null;
    if (session.status !== "waiting") return null;

    const participant: MultiplayerParticipant = {
      userId,
      displayName,
      currentReps: 0,
      formScore: 0,
      status: "ready",
      joinedAt: Date.now(),
    };

    session.participants.push(participant);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

    return session;
  } catch (error) {
    console.error("Failed to join multiplayer session:", error);
    return null;
  }
}

/**
 * Start multiplayer session
 */
export async function startMultiplayerSession(sessionId: string): Promise<void> {
  try {
    const sessions = await getMultiplayerSessions();
    const session = sessions.find((s) => s.id === sessionId);

    if (session) {
      session.status = "active";
      session.participants.forEach((p) => {
        p.status = "working";
      });
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }
  } catch (error) {
    console.error("Failed to start multiplayer session:", error);
  }
}

/**
 * Update participant progress
 */
export async function updateParticipantProgress(
  sessionId: string,
  userId: string,
  reps: number,
  formScore: number
): Promise<void> {
  try {
    const sessions = await getMultiplayerSessions();
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) return;

    const participant = session.participants.find((p) => p.userId === userId);
    if (!participant) return;

    participant.currentReps = reps;
    participant.formScore = formScore;

    if (reps >= session.targetReps) {
      participant.status = "finished";
    }

    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

    // Record real-time update
    const update: RealTimeUpdate = {
      sessionId,
      userId,
      reps,
      formScore,
      timestamp: Date.now(),
    };

    const updates = await getRealTimeUpdates(sessionId);
    updates.push(update);
    await AsyncStorage.setItem(`${UPDATES_KEY}_${sessionId}`, JSON.stringify(updates));
  } catch (error) {
    console.error("Failed to update participant progress:", error);
  }
}

/**
 * Get real-time updates
 */
export async function getRealTimeUpdates(sessionId: string): Promise<RealTimeUpdate[]> {
  try {
    const data = await AsyncStorage.getItem(`${UPDATES_KEY}_${sessionId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get real-time updates:", error);
    return [];
  }
}

/**
 * Get competitive leaderboard
 */
export async function getCompetitiveLeaderboard(sessionId: string): Promise<CompetitiveLeaderboard | null> {
  try {
    const sessions = await getMultiplayerSessions();
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) return null;

    const rankings = session.participants
      .sort((a, b) => b.currentReps - a.currentReps)
      .map((p, index) => ({
        rank: index + 1,
        userId: p.userId,
        displayName: p.displayName,
        reps: p.currentReps,
        formScore: p.formScore,
        status: p.status,
      }));

    return {
      sessionId,
      rankings,
    };
  } catch (error) {
    console.error("Failed to get competitive leaderboard:", error);
    return null;
  }
}

/**
 * End multiplayer session
 */
export async function endMultiplayerSession(sessionId: string): Promise<MultiplayerResult[] | null> {
  try {
    const sessions = await getMultiplayerSessions();
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) return null;

    session.status = "completed";
    session.endTime = Date.now();

    const results: MultiplayerResult[] = session.participants
      .sort((a, b) => b.currentReps - a.currentReps)
      .map((p, index) => ({
        userId: p.userId,
        displayName: p.displayName,
        finalReps: p.currentReps,
        avgFormScore: p.formScore,
        timeToComplete: (session.endTime || Date.now()) - p.joinedAt,
        rank: index + 1,
      }));

    session.results = results;
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

    return results;
  } catch (error) {
    console.error("Failed to end multiplayer session:", error);
    return null;
  }
}

/**
 * Get active sessions
 */
export async function getActiveSessions(): Promise<MultiplayerSession[]> {
  try {
    const sessions = await getMultiplayerSessions();
    return sessions.filter((s) => s.status !== "completed");
  } catch (error) {
    console.error("Failed to get active sessions:", error);
    return [];
  }
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId: string): Promise<MultiplayerSession | null> {
  try {
    const sessions = await getMultiplayerSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  } catch (error) {
    console.error("Failed to get session by ID:", error);
    return null;
  }
}

/**
 * Get user's active sessions
 */
export async function getUserActiveSessions(userId: string): Promise<MultiplayerSession[]> {
  try {
    const sessions = await getActiveSessions();
    return sessions.filter((s) => s.participants.some((p) => p.userId === userId));
  } catch (error) {
    console.error("Failed to get user active sessions:", error);
    return [];
  }
}

/**
 * Generate session invite code
 */
export function generateInviteCode(sessionId: string): string {
  return `MOTION_${sessionId.substring(0, 8).toUpperCase()}`;
}

/**
 * Validate invite code
 */
export async function validateInviteCode(code: string): Promise<string | null> {
  try {
    const sessionId = code.replace("MOTION_", "").toLowerCase();
    const session = await getSessionById(`session_${sessionId}`);
    return session ? session.id : null;
  } catch (error) {
    console.error("Failed to validate invite code:", error);
    return null;
  }
}

/**
 * Get session statistics
 */
export async function getSessionStatistics(sessionId: string): Promise<{
  totalParticipants: number;
  averageReps: number;
  averageFormScore: number;
  maxReps: number;
  minReps: number;
} | null> {
  try {
    const session = await getSessionById(sessionId);
    if (!session) return null;

    const reps = session.participants.map((p) => p.currentReps);
    const formScores = session.participants.map((p) => p.formScore);

    return {
      totalParticipants: session.participants.length,
      averageReps: reps.reduce((a, b) => a + b, 0) / reps.length,
      averageFormScore: formScores.reduce((a, b) => a + b, 0) / formScores.length,
      maxReps: Math.max(...reps),
      minReps: Math.min(...reps),
    };
  } catch (error) {
    console.error("Failed to get session statistics:", error);
    return null;
  }
}
