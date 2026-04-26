import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Micro-interaction types
 */
export type MicroInteractionType =
  | "button_press"
  | "toggle_switch"
  | "list_item_select"
  | "swipe_action"
  | "long_press"
  | "double_tap"
  | "pull_to_refresh"
  | "scroll_bounce"
  | "notification_appear"
  | "notification_dismiss"
  | "modal_open"
  | "modal_close"
  | "tab_switch"
  | "input_focus"
  | "input_error"
  | "input_success";

/**
 * Micro-interaction configuration
 */
export interface MicroInteraction {
  type: MicroInteractionType;
  hapticFeedback?: "light" | "medium" | "heavy" | "success" | "warning" | "error";
  duration?: number;
  delay?: number;
  sound?: boolean;
}

/**
 * Trigger micro-interaction feedback
 */
export async function triggerMicroInteraction(interaction: MicroInteraction): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    // Haptic feedback
    if (interaction.hapticFeedback) {
      await triggerHapticFeedback(interaction.hapticFeedback);
    }

    // Could add sound feedback here in future
    // if (interaction.sound) {
    //   await playSound(interaction.type);
    // }
  } catch (error) {
    console.error("Failed to trigger micro-interaction:", error);
  }
}

/**
 * Trigger haptic feedback
 */
export async function triggerHapticFeedback(type: "light" | "medium" | "heavy" | "success" | "warning" | "error"): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    switch (type) {
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    console.error("Failed to trigger haptic feedback:", error);
  }
}

/**
 * Get micro-interaction config by type
 */
export function getMicroInteractionConfig(type: MicroInteractionType): MicroInteraction {
  const configs: Record<MicroInteractionType, MicroInteraction> = {
    button_press: {
      type: "button_press",
      hapticFeedback: "light",
      duration: 100,
    },
    toggle_switch: {
      type: "toggle_switch",
      hapticFeedback: "medium",
      duration: 200,
    },
    list_item_select: {
      type: "list_item_select",
      hapticFeedback: "light",
      duration: 150,
    },
    swipe_action: {
      type: "swipe_action",
      hapticFeedback: "light",
      duration: 100,
    },
    long_press: {
      type: "long_press",
      hapticFeedback: "medium",
      duration: 300,
    },
    double_tap: {
      type: "double_tap",
      hapticFeedback: "light",
      duration: 100,
    },
    pull_to_refresh: {
      type: "pull_to_refresh",
      hapticFeedback: "medium",
      duration: 200,
    },
    scroll_bounce: {
      type: "scroll_bounce",
      hapticFeedback: "light",
      duration: 100,
    },
    notification_appear: {
      type: "notification_appear",
      hapticFeedback: "success",
      duration: 300,
    },
    notification_dismiss: {
      type: "notification_dismiss",
      hapticFeedback: "light",
      duration: 200,
    },
    modal_open: {
      type: "modal_open",
      hapticFeedback: "medium",
      duration: 250,
    },
    modal_close: {
      type: "modal_close",
      hapticFeedback: "light",
      duration: 200,
    },
    tab_switch: {
      type: "tab_switch",
      hapticFeedback: "light",
      duration: 150,
    },
    input_focus: {
      type: "input_focus",
      hapticFeedback: "light",
      duration: 100,
    },
    input_error: {
      type: "input_error",
      hapticFeedback: "error",
      duration: 300,
    },
    input_success: {
      type: "input_success",
      hapticFeedback: "success",
      duration: 200,
    },
  };

  return configs[type] || configs.button_press;
}

/**
 * Create button interaction handler
 */
export async function handleButtonPress(onPress: () => void | Promise<void>): Promise<void> {
  await triggerMicroInteraction(getMicroInteractionConfig("button_press"));
  await onPress();
}

/**
 * Create toggle interaction handler
 */
export async function handleToggle(onToggle: (value: boolean) => void | Promise<void>, value: boolean): Promise<void> {
  await triggerMicroInteraction(getMicroInteractionConfig("toggle_switch"));
  await onToggle(!value);
}

/**
 * Create list item interaction handler
 */
export async function handleListItemPress(onPress: () => void | Promise<void>): Promise<void> {
  await triggerMicroInteraction(getMicroInteractionConfig("list_item_select"));
  await onPress();
}

/**
 * Create input focus handler
 */
export async function handleInputFocus(): Promise<void> {
  await triggerMicroInteraction(getMicroInteractionConfig("input_focus"));
}

/**
 * Create input error handler
 */
export async function handleInputError(): Promise<void> {
  await triggerMicroInteraction(getMicroInteractionConfig("input_error"));
}

/**
 * Create input success handler
 */
export async function handleInputSuccess(): Promise<void> {
  await triggerMicroInteraction(getMicroInteractionConfig("input_success"));
}

/**
 * Create notification appear handler
 */
export async function handleNotificationAppear(): Promise<void> {
  await triggerMicroInteraction(getMicroInteractionConfig("notification_appear"));
}

/**
 * Create modal open handler
 */
export async function handleModalOpen(): Promise<void> {
  await triggerMicroInteraction(getMicroInteractionConfig("modal_open"));
}

/**
 * Create modal close handler
 */
export async function handleModalClose(): Promise<void> {
  await triggerMicroInteraction(getMicroInteractionConfig("modal_close"));
}

/**
 * Create tab switch handler
 */
export async function handleTabSwitch(): Promise<void> {
  await triggerMicroInteraction(getMicroInteractionConfig("tab_switch"));
}

/**
 * Create pull to refresh handler
 */
export async function handlePullToRefresh(): Promise<void> {
  await triggerMicroInteraction(getMicroInteractionConfig("pull_to_refresh"));
}

/**
 * Create success feedback
 */
export async function showSuccessFeedback(message?: string): Promise<void> {
  await triggerMicroInteraction({
    type: "notification_appear",
    hapticFeedback: "success",
  });
}

/**
 * Create error feedback
 */
export async function showErrorFeedback(message?: string): Promise<void> {
  await triggerMicroInteraction({
    type: "notification_appear",
    hapticFeedback: "error",
  });
}

/**
 * Create warning feedback
 */
export async function showWarningFeedback(message?: string): Promise<void> {
  await triggerMicroInteraction({
    type: "notification_appear",
    hapticFeedback: "warning",
  });
}

/**
 * Create info feedback
 */
export async function showInfoFeedback(message?: string): Promise<void> {
  await triggerMicroInteraction({
    type: "notification_appear",
    hapticFeedback: "light",
  });
}
