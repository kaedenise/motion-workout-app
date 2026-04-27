/**
 * UI State Management Service
 * Handles loading states, empty states, and user feedback
 */

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface UIState {
  loading: LoadingState;
  error?: string;
  message?: string;
  progress?: number; // 0-100
  isVisible: boolean;
}

export interface EmptyState {
  title: string;
  description: string;
  icon: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export interface SkeletonConfig {
  lines: number;
  height: number;
  spacing: number;
  animated: boolean;
}

/**
 * Create empty state for different scenarios
 */
export function getEmptyState(type: string): EmptyState {
  const emptyStates: Record<string, EmptyState> = {
    no_workouts: {
      title: "No Workouts Yet",
      description: "Start your fitness journey by completing your first workout!",
      icon: "🏃",
      action: {
        label: "Start Workout",
        onPress: () => {},
      },
    },
    no_challenges: {
      title: "No Active Challenges",
      description: "Create a challenge with friends or join a community challenge.",
      icon: "🎯",
      action: {
        label: "Browse Challenges",
        onPress: () => {},
      },
    },
    no_friends: {
      title: "No Friends Yet",
      description: "Invite friends to compete and share your fitness journey.",
      icon: "👥",
      action: {
        label: "Invite Friends",
        onPress: () => {},
      },
    },
    no_rewards: {
      title: "No Rewards Earned",
      description: "Complete workouts and challenges to earn rewards.",
      icon: "🎁",
      action: {
        label: "View Rewards",
        onPress: () => {},
      },
    },
    no_achievements: {
      title: "No Achievements Yet",
      description: "Keep working out to unlock achievements and badges!",
      icon: "🏆",
      action: {
        label: "View All Achievements",
        onPress: () => {},
      },
    },
    no_nutrition: {
      title: "No Food Logged",
      description: "Take a photo of your meal to track calories.",
      icon: "📸",
      action: {
        label: "Log Meal",
        onPress: () => {},
      },
    },
    no_leaderboard: {
      title: "Leaderboard Empty",
      description: "Start working out to appear on the leaderboard.",
      icon: "📊",
      action: {
        label: "Start Workout",
        onPress: () => {},
      },
    },
    search_no_results: {
      title: "No Results Found",
      description: "Try searching with different keywords.",
      icon: "🔍",
    },
    error_loading: {
      title: "Failed to Load",
      description: "Something went wrong. Please try again.",
      icon: "⚠️",
      action: {
        label: "Retry",
        onPress: () => {},
      },
    },
    offline: {
      title: "You're Offline",
      description: "Some features are limited without internet connection.",
      icon: "📡",
    },
  };

  return emptyStates[type] || emptyStates.error_loading;
}

/**
 * Create loading skeleton config
 */
export function getSkeletonConfig(type: string): SkeletonConfig {
  const configs: Record<string, SkeletonConfig> = {
    workout_list: {
      lines: 3,
      height: 80,
      spacing: 12,
      animated: true,
    },
    leaderboard: {
      lines: 5,
      height: 60,
      spacing: 8,
      animated: true,
    },
    profile: {
      lines: 4,
      height: 100,
      spacing: 12,
      animated: true,
    },
    challenge: {
      lines: 2,
      height: 120,
      spacing: 16,
      animated: true,
    },
    card: {
      lines: 1,
      height: 150,
      spacing: 0,
      animated: true,
    },
  };

  return configs[type] || configs.card;
}

/**
 * Format loading message
 */
export function getLoadingMessage(action: string): string {
  const messages: Record<string, string> = {
    loading_workouts: "Loading your workouts...",
    loading_challenges: "Loading challenges...",
    loading_leaderboard: "Loading leaderboard...",
    loading_profile: "Loading profile...",
    loading_rewards: "Loading rewards...",
    loading_nutrition: "Analyzing food...",
    syncing: "Syncing your data...",
    uploading: "Uploading...",
    processing: "Processing...",
    saving: "Saving changes...",
  };

  return messages[action] || "Loading...";
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.userMessage) {
    return error.userMessage;
  }

  return "An error occurred. Please try again.";
}

/**
 * Get retry button label based on error type
 */
export function getRetryLabel(errorType: string): string {
  const labels: Record<string, string> = {
    network: "Retry Connection",
    timeout: "Try Again",
    server: "Retry",
    auth: "Log In Again",
    validation: "Fix and Retry",
    unknown: "Try Again",
  };

  return labels[errorType] || labels.unknown;
}

/**
 * Create progress message
 */
export function getProgressMessage(progress: number): string {
  if (progress < 25) return "Starting...";
  if (progress < 50) return "Processing...";
  if (progress < 75) return "Almost there...";
  if (progress < 100) return "Finishing up...";
  return "Complete!";
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m remaining`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s remaining`;
  }
  return `${seconds}s remaining`;
}

/**
 * Get accessibility label for loading state
 */
export function getA11yLoadingLabel(action: string): string {
  return `${action} is loading. Please wait.`;
}

/**
 * Get accessibility label for empty state
 */
export function getA11yEmptyLabel(title: string, description: string): string {
  return `${title}. ${description}`;
}

/**
 * Create toast message
 */
export interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info" | "warning";
  duration: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function createToast(
  text: string,
  type: "success" | "error" | "info" | "warning" = "info",
  duration: number = 3000
): ToastMessage {
  return {
    id: `toast_${Date.now()}`,
    text,
    type,
    duration,
  };
}

/**
 * Get toast icon
 */
export function getToastIcon(type: string): string {
  const icons: Record<string, string> = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  return icons[type] || icons.info;
}

/**
 * Format notification message
 */
export function formatNotification(
  type: string,
  data: Record<string, any>
): { title: string; body: string } {
  const notifications: Record<string, (d: Record<string, any>) => { title: string; body: string }> = {
    challenge_invite: (d) => ({
      title: "New Challenge!",
      body: `${d.friendName} challenged you to ${d.challengeName}`,
    }),
    achievement_unlocked: (d) => ({
      title: "Achievement Unlocked! 🏆",
      body: `You earned: ${d.achievementName}`,
    }),
    rank_up: (d) => ({
      title: "Rank Up! 📈",
      body: `You're now rank #${d.newRank} on the leaderboard`,
    }),
    workout_reminder: (d) => ({
      title: "Time to Work Out! 💪",
      body: `You have ${d.minutesRemaining} minutes to complete your daily goal`,
    }),
    friend_joined: (d) => ({
      title: "Friend Joined!",
      body: `${d.friendName} just joined MotionFit`,
    }),
    reward_available: (d) => ({
      title: "New Reward Available! 🎁",
      body: `You can now redeem ${d.rewardName}`,
    }),
  };

  const formatter = notifications[type];
  return formatter ? formatter(data) : { title: "MotionFit", body: "New notification" };
}
