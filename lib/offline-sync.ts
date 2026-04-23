import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export interface PendingAction {
  id: string;
  type: "workout" | "nutrition" | "challenge" | "leaderboard";
  data: any;
  timestamp: number;
  retries: number;
}

const PENDING_ACTIONS_KEY = "@motionfit_pending_actions";
const MAX_RETRIES = 3;

/**
 * Add action to sync queue
 */
export async function addPendingAction(
  type: PendingAction["type"],
  data: any
): Promise<string> {
  try {
    const id = `${type}_${Date.now()}_${Math.random()}`;
    const action: PendingAction = {
      id,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    const existing = await getPendingActions();
    const updated = [...existing, action];
    await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(updated));

    return id;
  } catch (error) {
    console.error("Failed to add pending action:", error);
    throw error;
  }
}

/**
 * Get all pending actions
 */
export async function getPendingActions(): Promise<PendingAction[]> {
  try {
    const data = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get pending actions:", error);
    return [];
  }
}

/**
 * Remove pending action after successful sync
 */
export async function removePendingAction(id: string): Promise<void> {
  try {
    const existing = await getPendingActions();
    const updated = existing.filter((action) => action.id !== id);
    await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to remove pending action:", error);
  }
}

/**
 * Update retry count for pending action
 */
export async function incrementRetry(id: string): Promise<void> {
  try {
    const existing = await getPendingActions();
    const updated = existing.map((action) =>
      action.id === id ? { ...action, retries: action.retries + 1 } : action
    );
    await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to increment retry:", error);
  }
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    console.error("Failed to check network state:", error);
    return false;
  }
}

/**
 * Get pending action count
 */
export async function getPendingActionCount(): Promise<number> {
  try {
    const actions = await getPendingActions();
    return actions.length;
  } catch (error) {
    console.error("Failed to get pending action count:", error);
    return 0;
  }
}

/**
 * Clear all pending actions (use with caution)
 */
export async function clearPendingActions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_ACTIONS_KEY);
  } catch (error) {
    console.error("Failed to clear pending actions:", error);
  }
}

/**
 * Get actions by type
 */
export async function getPendingActionsByType(
  type: PendingAction["type"]
): Promise<PendingAction[]> {
  try {
    const actions = await getPendingActions();
    return actions.filter((action) => action.type === type);
  } catch (error) {
    console.error("Failed to get pending actions by type:", error);
    return [];
  }
}

/**
 * Sync pending actions (call this when device comes online)
 */
export async function syncPendingActions(
  syncFn: (action: PendingAction) => Promise<boolean>
): Promise<{ synced: number; failed: number }> {
  const online = await isOnline();
  if (!online) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  try {
    const actions = await getPendingActions();

    for (const action of actions) {
      if (action.retries >= MAX_RETRIES) {
        // Skip actions that have exceeded max retries
        failed++;
        continue;
      }

      try {
        const success = await syncFn(action);
        if (success) {
          await removePendingAction(action.id);
          synced++;
        } else {
          await incrementRetry(action.id);
          failed++;
        }
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        await incrementRetry(action.id);
        failed++;
      }
    }
  } catch (error) {
    console.error("Failed to sync pending actions:", error);
  }

  return { synced, failed };
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{
  isOnline: boolean;
  pendingCount: number;
  lastSync: number | null;
}> {
  try {
    const isOnlineStatus = await isOnline();
    const pendingCount = await getPendingActionCount();
    const lastSyncStr = await AsyncStorage.getItem("@motionfit_last_sync");
    const lastSync = lastSyncStr ? parseInt(lastSyncStr) : null;

    return {
      isOnline: isOnlineStatus,
      pendingCount,
      lastSync,
    };
  } catch (error) {
    console.error("Failed to get sync status:", error);
    return {
      isOnline: false,
      pendingCount: 0,
      lastSync: null,
    };
  }
}

/**
 * Update last sync timestamp
 */
export async function updateLastSync(): Promise<void> {
  try {
    await AsyncStorage.setItem("@motionfit_last_sync", Date.now().toString());
  } catch (error) {
    console.error("Failed to update last sync:", error);
  }
}
