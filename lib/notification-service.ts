import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type NotificationType = "challenge" | "milestone" | "leaderboard" | "friend" | "achievement";

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Initialize notification handlers
 */
export async function initializeNotifications() {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Request permissions on iOS
  if (Platform.OS === "ios") {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Notification permissions not granted");
    }
  }
}

/**
 * Send a local notification
 */
export async function sendLocalNotification(payload: NotificationPayload) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        badge: 1,
        sound: "default",
      },
      trigger: { seconds: 1 } as any,
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

/**
 * Send challenge notification
 */
export async function notifyChallenge(friendName: string, exerciseType: string) {
  await sendLocalNotification({
    type: "challenge",
    title: "New Challenge! 🏆",
    body: `${friendName} challenged you to ${exerciseType}`,
    data: { type: "challenge", friendName, exerciseType },
  });
}

/**
 * Send milestone notification
 */
export async function notifyMilestone(milestone: string, value: number) {
  await sendLocalNotification({
    type: "milestone",
    title: "Milestone Reached! 🎉",
    body: `You've reached ${value} ${milestone}!`,
    data: { type: "milestone", milestone, value },
  });
}

/**
 * Send leaderboard rank change notification
 */
export async function notifyRankChange(newRank: number, improvement: number) {
  const emoji = improvement > 0 ? "📈" : "📉";
  await sendLocalNotification({
    type: "leaderboard",
    title: `Rank Changed ${emoji}`,
    body: `You're now ranked #${newRank}`,
    data: { type: "leaderboard", newRank, improvement },
  });
}

/**
 * Send achievement notification
 */
export async function notifyAchievement(achievementName: string, description: string) {
  await sendLocalNotification({
    type: "achievement",
    title: "Achievement Unlocked! ⭐",
    body: `${achievementName}: ${description}`,
    data: { type: "achievement", achievementName },
  });
}

/**
 * Send friend activity notification
 */
export async function notifyFriendActivity(friendName: string, activity: string) {
  await sendLocalNotification({
    type: "friend",
    title: "Friend Activity 👥",
    body: `${friendName} ${activity}`,
    data: { type: "friend", friendName, activity },
  });
}

/**
 * Get notification permission status
 */
export async function getNotificationPermission() {
  const settings = await Notifications.getPermissionsAsync();
  return settings.granted;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}
