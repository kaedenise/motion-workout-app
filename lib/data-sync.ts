/**
 * Data Sync & Persistence Service
 * Handles offline data caching, sync queuing, and cloud synchronization
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";
export type DataType = "workout" | "nutrition" | "challenge" | "leaderboard" | "profile" | "settings";

export interface SyncItem {
  id: string;
  type: DataType;
  action: "create" | "update" | "delete";
  data: any;
  timestamp: Date;
  status: SyncStatus;
  retries: number;
  lastError?: string;
}

export interface SyncQueue {
  items: SyncItem[];
  lastSyncTime?: Date;
  isSyncing: boolean;
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: Date;
  ttl?: number; // milliseconds
}

const SYNC_QUEUE_KEY = "@motionfit_sync_queue";
const CACHE_PREFIX = "@motionfit_cache_";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let syncQueue: SyncQueue = { items: [], isSyncing: false };

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(
  type: DataType,
  action: "create" | "update" | "delete",
  data: any
): Promise<SyncItem> {
  try {
    const item: SyncItem = {
      id: `sync_${Date.now()}`,
      type,
      action,
      data,
      timestamp: new Date(),
      status: "pending",
      retries: 0,
    };

    syncQueue.items.push(item);
    await persistSyncQueue();

    return item;
  } catch (error) {
    console.error("Failed to add to sync queue:", error);
    throw error;
  }
}

/**
 * Get sync queue
 */
export async function getSyncQueue(): Promise<SyncQueue> {
  try {
    const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (data) {
      syncQueue = JSON.parse(data);
    }
    return syncQueue;
  } catch (error) {
    console.error("Failed to get sync queue:", error);
    return syncQueue;
  }
}

/**
 * Persist sync queue to storage
 */
async function persistSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncQueue));
  } catch (error) {
    console.error("Failed to persist sync queue:", error);
  }
}

/**
 * Process sync queue
 */
export async function processSyncQueue(
  syncFn: (item: SyncItem) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  try {
    syncQueue.isSyncing = true;
    let synced = 0;
    let failed = 0;

    for (const item of syncQueue.items) {
      if (item.status === "pending" || item.status === "failed") {
        try {
          await syncFn(item);
          item.status = "synced";
          item.retries = 0;
          synced += 1;
        } catch (error) {
          item.status = "failed";
          item.retries += 1;
          item.lastError = (error as Error).message;
          failed += 1;

          // Remove after 5 failed attempts
          if (item.retries >= 5) {
            syncQueue.items = syncQueue.items.filter((i) => i.id !== item.id);
          }
        }
      }
    }

    syncQueue.lastSyncTime = new Date();
    syncQueue.isSyncing = false;
    await persistSyncQueue();

    return { synced, failed };
  } catch (error) {
    console.error("Failed to process sync queue:", error);
    syncQueue.isSyncing = false;
    return { synced: 0, failed: syncQueue.items.length };
  }
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  try {
    syncQueue = { items: [], isSyncing: false };
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.error("Failed to clear sync queue:", error);
  }
}

/**
 * Cache data
 */
export async function cacheData(key: string, data: any, ttl: number = CACHE_TTL): Promise<void> {
  try {
    const cached: CachedData = {
      key,
      data,
      timestamp: new Date(),
      ttl,
    };

    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
  } catch (error) {
    console.error("Failed to cache data:", error);
  }
}

/**
 * Get cached data
 */
export async function getCachedData(key: string): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!data) return null;

    const cached: CachedData = JSON.parse(data);
    const age = Date.now() - new Date(cached.timestamp).getTime();

    // Check if cache expired
    if (cached.ttl && age > cached.ttl) {
      await clearCache(key);
      return null;
    }

    return cached.data;
  } catch (error) {
    console.error("Failed to get cached data:", error);
    return null;
  }
}

/**
 * Clear specific cache
 */
export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.error("Failed to clear cache:", error);
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error("Failed to clear all cache:", error);
  }
}

/**
 * Get cache size
 */
export async function getCacheSize(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));

    let totalSize = 0;
    for (const key of cacheKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        totalSize += data.length;
      }
    }

    return totalSize;
  } catch (error) {
    console.error("Failed to get cache size:", error);
    return 0;
  }
}

/**
 * Get pending sync items
 */
export function getPendingSyncItems(): SyncItem[] {
  return syncQueue.items.filter((item) => item.status === "pending" || item.status === "failed");
}

/**
 * Get sync status
 */
export function getSyncStatus(): {
  isSyncing: boolean;
  pendingItems: number;
  failedItems: number;
  lastSyncTime?: Date;
} {
  const failedItems = syncQueue.items.filter((item) => item.status === "failed").length;
  const pendingItems = syncQueue.items.filter((item) => item.status === "pending").length;

  return {
    isSyncing: syncQueue.isSyncing,
    pendingItems,
    failedItems,
    lastSyncTime: syncQueue.lastSyncTime,
  };
}

/**
 * Batch cache operations
 */
export async function batchCache(items: Array<{ key: string; data: any; ttl?: number }>): Promise<void> {
  try {
    const promises = items.map((item) => cacheData(item.key, item.data, item.ttl));
    await Promise.all(promises);
  } catch (error) {
    console.error("Failed to batch cache:", error);
  }
}

/**
 * Batch get cache
 */
export async function batchGetCache(keys: string[]): Promise<Record<string, any>> {
  try {
    const results: Record<string, any> = {};

    for (const key of keys) {
      const data = await getCachedData(key);
      if (data !== null) {
        results[key] = data;
      }
    }

    return results;
  } catch (error) {
    console.error("Failed to batch get cache:", error);
    return {};
  }
}
