import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LiveBroadcast {
  id: string;
  userId: string;
  displayName: string;
  currentRank: number;
  previousRank: number;
  xpGained: number;
  tier: string;
  timestamp: number;
  viewers: number;
  type: "rank-up" | "top-10-entry" | "personal-best" | "streak-milestone";
}

export interface RankUpNotification {
  id: string;
  userId: string;
  displayName: string;
  newRank: number;
  oldRank: number;
  newTier: string;
  xpGained: number;
  timestamp: number;
  read: boolean;
}

export interface LeaderboardUpdate {
  timestamp: number;
  topPlayers: Array<{
    rank: number;
    userId: string;
    displayName: string;
    xp: number;
    tier: string;
  }>;
  changes: Array<{
    userId: string;
    oldRank: number;
    newRank: number;
    type: "promoted" | "demoted" | "new";
  }>;
}

const BROADCASTS_KEY = "@motionfit_live_broadcasts";
const NOTIFICATIONS_KEY = "@motionfit_rankup_notifications";
const UPDATES_KEY = "@motionfit_leaderboard_updates";

/**
 * Create live broadcast
 */
export async function createLiveBroadcast(
  userId: string,
  displayName: string,
  currentRank: number,
  previousRank: number,
  xpGained: number,
  tier: string,
  type: LiveBroadcast["type"]
): Promise<LiveBroadcast> {
  try {
    const broadcast: LiveBroadcast = {
      id: `broadcast_${Date.now()}`,
      userId,
      displayName,
      currentRank,
      previousRank,
      xpGained,
      tier,
      timestamp: Date.now(),
      viewers: 0,
      type,
    };

    const existing = await getLiveBroadcasts();
    const updated = [...existing, broadcast];
    await AsyncStorage.setItem(BROADCASTS_KEY, JSON.stringify(updated));

    return broadcast;
  } catch (error) {
    console.error("Failed to create live broadcast:", error);
    throw error;
  }
}

/**
 * Get live broadcasts
 */
export async function getLiveBroadcasts(): Promise<LiveBroadcast[]> {
  try {
    const data = await AsyncStorage.getItem(BROADCASTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get live broadcasts:", error);
    return [];
  }
}

/**
 * Get active broadcasts (last 5 minutes)
 */
export async function getActiveBroadcasts(): Promise<LiveBroadcast[]> {
  try {
    const broadcasts = await getLiveBroadcasts();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return broadcasts.filter((b) => b.timestamp > fiveMinutesAgo).sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to get active broadcasts:", error);
    return [];
  }
}

/**
 * Increment viewer count
 */
export async function incrementViewers(broadcastId: string): Promise<void> {
  try {
    const broadcasts = await getLiveBroadcasts();
    const broadcast = broadcasts.find((b) => b.id === broadcastId);
    if (broadcast) {
      broadcast.viewers += 1;
      await AsyncStorage.setItem(BROADCASTS_KEY, JSON.stringify(broadcasts));
    }
  } catch (error) {
    console.error("Failed to increment viewers:", error);
  }
}

/**
 * Create rank-up notification
 */
export async function createRankUpNotification(
  userId: string,
  displayName: string,
  newRank: number,
  oldRank: number,
  newTier: string,
  xpGained: number
): Promise<RankUpNotification> {
  try {
    const notification: RankUpNotification = {
      id: `notification_${Date.now()}`,
      userId,
      displayName,
      newRank,
      oldRank,
      newTier,
      xpGained,
      timestamp: Date.now(),
      read: false,
    };

    const existing = await getRankUpNotifications();
    const updated = [...existing, notification];
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

    // Also create a broadcast
    await createLiveBroadcast(
      userId,
      displayName,
      newRank,
      oldRank,
      xpGained,
      newTier,
      newRank <= 10 ? "top-10-entry" : "rank-up"
    );

    return notification;
  } catch (error) {
    console.error("Failed to create rank-up notification:", error);
    throw error;
  }
}

/**
 * Get rank-up notifications
 */
export async function getRankUpNotifications(): Promise<RankUpNotification[]> {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get rank-up notifications:", error);
    return [];
  }
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(): Promise<RankUpNotification[]> {
  try {
    const notifications = await getRankUpNotifications();
    return notifications.filter((n) => !n.read);
  } catch (error) {
    console.error("Failed to get unread notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notifications = await getRankUpNotifications();
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

/**
 * Record leaderboard update
 */
export async function recordLeaderboardUpdate(
  topPlayers: Array<{ rank: number; userId: string; displayName: string; xp: number; tier: string }>,
  changes: Array<{ userId: string; oldRank: number; newRank: number; type: "promoted" | "demoted" | "new" }>
): Promise<void> {
  try {
    const update: LeaderboardUpdate = {
      timestamp: Date.now(),
      topPlayers,
      changes,
    };

    const existing = await AsyncStorage.getItem(UPDATES_KEY);
    const updates = existing ? JSON.parse(existing) : [];
    updates.push(update);

    // Keep only last 100 updates
    if (updates.length > 100) {
      updates.shift();
    }

    await AsyncStorage.setItem(UPDATES_KEY, JSON.stringify(updates));

    // Create notifications for promoted players
    for (const change of changes) {
      if (change.type === "promoted" && change.newRank <= 10) {
        const player = topPlayers.find((p) => p.userId === change.userId);
        if (player) {
          await createRankUpNotification(
            change.userId,
            player.displayName,
            change.newRank,
            change.oldRank,
            player.tier,
            0
          );
        }
      }
    }
  } catch (error) {
    console.error("Failed to record leaderboard update:", error);
  }
}

/**
 * Get leaderboard update history
 */
export async function getLeaderboardUpdateHistory(): Promise<LeaderboardUpdate[]> {
  try {
    const data = await AsyncStorage.getItem(UPDATES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get leaderboard update history:", error);
    return [];
  }
}

/**
 * Get broadcast statistics
 */
export async function getBroadcastStats(): Promise<{
  totalBroadcasts: number;
  activeBroadcasts: number;
  totalViewers: number;
  topBroadcast: LiveBroadcast | null;
}> {
  try {
    const broadcasts = await getLiveBroadcasts();
    const active = await getActiveBroadcasts();
    const totalViewers = broadcasts.reduce((sum, b) => sum + b.viewers, 0);
    const topBroadcast = broadcasts.sort((a, b) => b.viewers - a.viewers)[0] || null;

    return {
      totalBroadcasts: broadcasts.length,
      activeBroadcasts: active.length,
      totalViewers,
      topBroadcast,
    };
  } catch (error) {
    console.error("Failed to get broadcast stats:", error);
    return {
      totalBroadcasts: 0,
      activeBroadcasts: 0,
      totalViewers: 0,
      topBroadcast: null,
    };
  }
}

/**
 * Get trending broadcasts
 */
export async function getTrendingBroadcasts(limit: number = 5): Promise<LiveBroadcast[]> {
  try {
    const broadcasts = await getActiveBroadcasts();
    return broadcasts.sort((a, b) => b.viewers - a.viewers).slice(0, limit);
  } catch (error) {
    console.error("Failed to get trending broadcasts:", error);
    return [];
  }
}

/**
 * Clear old broadcasts (older than 1 hour)
 */
export async function clearOldBroadcasts(): Promise<void> {
  try {
    const broadcasts = await getLiveBroadcasts();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const filtered = broadcasts.filter((b) => b.timestamp > oneHourAgo);
    await AsyncStorage.setItem(BROADCASTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to clear old broadcasts:", error);
  }
}
