/**
 * Wearable Integration Service
 * Connect Apple Watch, Fitbit, Garmin, and Oura for automatic data sync
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type WearableDevice = "apple_watch" | "fitbit" | "garmin" | "oura";

export interface WearableConnection {
  userId: string;
  deviceType: WearableDevice;
  deviceName: string;
  accessToken: string;
  refreshToken?: string;
  connected: boolean;
  connectedAt: Date;
  lastSync: Date;
  syncInterval: number; // minutes
}

export interface WearableData {
  date: Date;
  steps: number;
  calories: number;
  distance: number; // km
  heartRate?: number;
  heartRateVariability?: number;
  sleepMinutes?: number;
  activeMinutes?: number;
  restingHeartRate?: number;
  vo2Max?: number;
  bodyTemperature?: number;
}

export interface WearableStats {
  totalSteps: number;
  totalCalories: number;
  totalDistance: number;
  avgHeartRate?: number;
  totalSleepMinutes?: number;
  totalActiveMinutes?: number;
  longestStreak: number;
  lastSyncTime: Date;
}

const WEARABLE_CONNECTIONS_KEY = "@motionfit_wearable_connections";
const WEARABLE_DATA_KEY = "@motionfit_wearable_data";

/**
 * Connect wearable device
 */
export async function connectWearable(
  userId: string,
  deviceType: WearableDevice,
  deviceName: string,
  accessToken: string,
  refreshToken?: string
): Promise<WearableConnection> {
  try {
    const connection: WearableConnection = {
      userId,
      deviceType,
      deviceName,
      accessToken,
      refreshToken,
      connected: true,
      connectedAt: new Date(),
      lastSync: new Date(),
      syncInterval: 15,
    };

    const connections = await getWearableConnections(userId);
    // Remove existing connection of same type
    const filtered = connections.filter((c) => c.deviceType !== deviceType);
    filtered.push(connection);

    await AsyncStorage.setItem(`${WEARABLE_CONNECTIONS_KEY}_${userId}`, JSON.stringify(filtered));
    return connection;
  } catch (error) {
    console.error("Failed to connect wearable:", error);
    throw error;
  }
}

/**
 * Get wearable connections for user
 */
export async function getWearableConnections(userId: string): Promise<WearableConnection[]> {
  try {
    const data = await AsyncStorage.getItem(`${WEARABLE_CONNECTIONS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get wearable connections:", error);
    return [];
  }
}

/**
 * Disconnect wearable device
 */
export async function disconnectWearable(userId: string, deviceType: WearableDevice): Promise<void> {
  try {
    const connections = await getWearableConnections(userId);
    const filtered = connections.filter((c) => c.deviceType !== deviceType);
    await AsyncStorage.setItem(`${WEARABLE_CONNECTIONS_KEY}_${userId}`, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to disconnect wearable:", error);
  }
}

/**
 * Sync wearable data
 */
export async function syncWearableData(userId: string, deviceType: WearableDevice): Promise<WearableData[]> {
  try {
    const connection = await getWearableConnection(userId, deviceType);
    if (!connection) {
      throw new Error("Device not connected");
    }

    // Simulate API call to wearable service
    const mockData = generateMockWearableData();

    // Store synced data
    const allData = await getWearableData(userId, deviceType);
    allData.push(...mockData);
    await AsyncStorage.setItem(`${WEARABLE_DATA_KEY}_${userId}_${deviceType}`, JSON.stringify(allData));

    // Update last sync time
    connection.lastSync = new Date();
    const connections = await getWearableConnections(userId);
    const index = connections.findIndex((c) => c.deviceType === deviceType);
    if (index >= 0) {
      connections[index] = connection;
      await AsyncStorage.setItem(`${WEARABLE_CONNECTIONS_KEY}_${userId}`, JSON.stringify(connections));
    }

    return mockData;
  } catch (error) {
    console.error("Failed to sync wearable data:", error);
    throw error;
  }
}

/**
 * Get wearable data for user
 */
export async function getWearableData(userId: string, deviceType: WearableDevice, days: number = 30): Promise<WearableData[]> {
  try {
    const data = await AsyncStorage.getItem(`${WEARABLE_DATA_KEY}_${userId}_${deviceType}`);
    const allData: WearableData[] = data ? JSON.parse(data) : [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return allData.filter((d) => new Date(d.date) >= cutoffDate);
  } catch (error) {
    console.error("Failed to get wearable data:", error);
    return [];
  }
}

/**
 * Get wearable stats
 */
export async function getWearableStats(userId: string, deviceType: WearableDevice): Promise<WearableStats> {
  try {
    const data = await getWearableData(userId, deviceType, 30);

    if (data.length === 0) {
      return {
        totalSteps: 0,
        totalCalories: 0,
        totalDistance: 0,
        totalSleepMinutes: 0,
        totalActiveMinutes: 0,
        longestStreak: 0,
        lastSyncTime: new Date(),
      };
    }

    const totalSteps = data.reduce((sum, d) => sum + d.steps, 0);
    const totalCalories = data.reduce((sum, d) => sum + d.calories, 0);
    const totalDistance = data.reduce((sum, d) => sum + d.distance, 0);
    const avgHeartRate = data.filter((d) => d.heartRate).length > 0 
      ? data.reduce((sum, d) => sum + (d.heartRate || 0), 0) / data.filter((d) => d.heartRate).length
      : undefined;
    const totalSleepMinutes = data.reduce((sum, d) => sum + (d.sleepMinutes || 0), 0);
    const totalActiveMinutes = data.reduce((sum, d) => sum + (d.activeMinutes || 0), 0);

    // Calculate longest streak
    let longestStreak = 0;
    let currentStreak = 0;
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const d of sortedData) {
      if (d.steps > 0) {
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    const connection = await getWearableConnection(userId, deviceType);

    return {
      totalSteps,
      totalCalories,
      totalDistance,
      avgHeartRate,
      totalSleepMinutes,
      totalActiveMinutes,
      longestStreak,
      lastSyncTime: connection?.lastSync || new Date(),
    };
  } catch (error) {
    console.error("Failed to get wearable stats:", error);
    throw error;
  }
}

/**
 * Get single wearable connection
 */
async function getWearableConnection(userId: string, deviceType: WearableDevice): Promise<WearableConnection | null> {
  try {
    const connections = await getWearableConnections(userId);
    return connections.find((c) => c.deviceType === deviceType) || null;
  } catch (error) {
    console.error("Failed to get wearable connection:", error);
    return null;
  }
}

/**
 * Generate mock wearable data for testing
 */
function generateMockWearableData(): WearableData[] {
  const data: WearableData[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.push({
      date,
      steps: Math.floor(Math.random() * 15000) + 5000,
      calories: Math.floor(Math.random() * 1000) + 1500,
      distance: Math.floor(Math.random() * 10) + 5,
      heartRate: Math.floor(Math.random() * 40) + 60,
      heartRateVariability: Math.floor(Math.random() * 50) + 20,
      sleepMinutes: Math.floor(Math.random() * 120) + 360,
      activeMinutes: Math.floor(Math.random() * 120) + 30,
      restingHeartRate: Math.floor(Math.random() * 20) + 55,
      vo2Max: Math.floor(Math.random() * 20) + 35,
    });
  }

  return data;
}

/**
 * Check if sync is needed
 */
export async function shouldSync(userId: string, deviceType: WearableDevice): Promise<boolean> {
  try {
    const connection = await getWearableConnection(userId, deviceType);
    if (!connection) return false;

    const timeSinceLastSync = Date.now() - new Date(connection.lastSync).getTime();
    const syncIntervalMs = connection.syncInterval * 60 * 1000;

    return timeSinceLastSync >= syncIntervalMs;
  } catch (error) {
    console.error("Failed to check sync status:", error);
    return false;
  }
}

/**
 * Get supported devices
 */
export function getSupportedDevices(): Array<{ type: WearableDevice; name: string; icon: string }> {
  return [
    { type: "apple_watch", name: "Apple Watch", icon: "⌚" },
    { type: "fitbit", name: "Fitbit", icon: "📱" },
    { type: "garmin", name: "Garmin", icon: "🏃" },
    { type: "oura", name: "Oura Ring", icon: "💍" },
  ];
}
