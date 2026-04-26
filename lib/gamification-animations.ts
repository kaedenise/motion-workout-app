import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { Easing, withTiming, withSequence, withSpring, withDelay } from "react-native-reanimated";

/**
 * XP gain animation configuration
 */
export function createXPGainAnimation(xpAmount: number) {
  const duration = Math.min(1000, xpAmount * 2);
  return {
    scale: withSequence(
      withTiming(1.3, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 200, easing: Easing.in(Easing.cubic) })
    ),
    opacity: withTiming(1, { duration: duration }),
  };
}

/**
 * Level up animation configuration
 */
export function createLevelUpAnimation() {
  return {
    scale: withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1.2, { damping: 6, mass: 1, overshootClamping: false }),
      withTiming(1, { duration: 200 })
    ),
    rotate: withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) })
    ),
    opacity: withTiming(1, { duration: 300 }),
  };
}

/**
 * Achievement unlock animation
 */
export function createAchievementAnimation() {
  return {
    scale: withSequence(
      withTiming(0, { duration: 0 }),
      withSpring(1.1, { damping: 5, mass: 1 }),
      withTiming(1, { duration: 200 })
    ),
    translateY: withSequence(
      withTiming(-50, { duration: 0 }),
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    ),
    opacity: withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: 300 })
    ),
  };
}

/**
 * Rank up animation
 */
export function createRankUpAnimation() {
  return {
    scale: withSequence(
      withTiming(0.9, { duration: 150 }),
      withSpring(1.15, { damping: 7, mass: 1 }),
      withTiming(1, { duration: 200 })
    ),
    opacity: withTiming(1, { duration: 400 }),
  };
}

/**
 * Combo counter animation
 */
export function createComboAnimation(comboCount: number) {
  const intensity = Math.min(comboCount / 10, 1);
  return {
    scale: withSequence(
      withTiming(1 + intensity * 0.2, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 150, easing: Easing.in(Easing.cubic) })
    ),
    opacity: withTiming(1, { duration: 200 }),
  };
}

/**
 * Challenge completion animation
 */
export function createChallengeCompleteAnimation() {
  return {
    scale: withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1.2, { damping: 5, mass: 1 }),
      withTiming(1, { duration: 300 })
    ),
    rotate: withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(720, { duration: 800, easing: Easing.out(Easing.cubic) })
    ),
    opacity: withTiming(1, { duration: 300 }),
  };
}

/**
 * Reward badge animation
 */
export function createRewardBadgeAnimation() {
  return {
    scale: withSequence(
      withTiming(0, { duration: 0 }),
      withSpring(1.1, { damping: 6, mass: 1 }),
      withTiming(1, { duration: 200 })
    ),
    translateY: withSequence(
      withTiming(-100, { duration: 0 }),
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    ),
    opacity: withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: 300 })
    ),
  };
}

/**
 * Leaderboard rank change animation
 */
export function createRankChangeAnimation(direction: "up" | "down") {
  const movement = direction === "up" ? -30 : 30;
  return {
    translateX: withSequence(
      withTiming(movement, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) })
    ),
    opacity: withSequence(
      withTiming(0.5, { duration: 100 }),
      withTiming(1, { duration: 100 })
    ),
  };
}

/**
 * Streak animation
 */
export function createStreakAnimation(streakCount: number) {
  const duration = Math.min(800, 200 + streakCount * 50);
  return {
    scale: withSequence(
      withTiming(1.2, { duration: duration / 2, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: duration / 2, easing: Easing.in(Easing.cubic) })
    ),
    opacity: withTiming(1, { duration: duration }),
  };
}

/**
 * Trigger haptic feedback for different events
 */
export function triggerGameHaptic(eventType: "xp_gain" | "level_up" | "achievement" | "combo" | "rank_up" | "challenge_complete") {
  if (Platform.OS === "web") return;

  const hapticMap = {
    xp_gain: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    level_up: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    achievement: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    combo: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    rank_up: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    challenge_complete: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  };

  hapticMap[eventType]?.();
}

/**
 * Create button press animation
 */
export function createButtonPressAnimation() {
  return {
    scale: withSequence(
      withTiming(0.95, { duration: 100, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 100, easing: Easing.in(Easing.cubic) })
    ),
  };
}

/**
 * Create screen transition animation
 */
export function createScreenTransitionAnimation(direction: "left" | "right" | "up" | "down" = "right") {
  const translationMap = {
    left: { from: 400, to: 0 },
    right: { from: -400, to: 0 },
    up: { from: 600, to: 0 },
    down: { from: -600, to: 0 },
  };

  const translation = translationMap[direction];
  const isHorizontal = direction === "left" || direction === "right";

  return {
    translateX: isHorizontal ? withTiming(translation.to, { duration: 400, easing: Easing.out(Easing.cubic) }) : 0,
    translateY: !isHorizontal ? withTiming(translation.to, { duration: 400, easing: Easing.out(Easing.cubic) }) : 0,
    opacity: withTiming(1, { duration: 300 }),
  };
}

/**
 * Create loading animation
 */
export function createLoadingAnimation() {
  return {
    rotate: withSequence(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      withTiming(0, { duration: 0 })
    ),
    opacity: withTiming(1, { duration: 500 }),
  };
}

/**
 * Create pulse animation
 */
export function createPulseAnimation() {
  return {
    scale: withSequence(
      withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) })
    ),
  };
}

/**
 * Create shake animation for errors
 */
export function createShakeAnimation() {
  return {
    translateX: withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    ),
  };
}

/**
 * Create bounce animation
 */
export function createBounceAnimation() {
  return {
    translateY: withSequence(
      withTiming(-20, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) })
    ),
  };
}

/**
 * Create fade in animation
 */
export function createFadeInAnimation(duration: number = 300) {
  return {
    opacity: withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
  };
}

/**
 * Create fade out animation
 */
export function createFadeOutAnimation(duration: number = 300) {
  return {
    opacity: withTiming(0, { duration, easing: Easing.out(Easing.cubic) }),
  };
}

/**
 * Create scale in animation
 */
export function createScaleInAnimation(duration: number = 300) {
  return {
    scale: withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    opacity: withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
  };
}

/**
 * Create scale out animation
 */
export function createScaleOutAnimation(duration: number = 300) {
  return {
    scale: withTiming(0.8, { duration, easing: Easing.in(Easing.cubic) }),
    opacity: withTiming(0, { duration, easing: Easing.in(Easing.cubic) }),
  };
}

/**
 * Create flip animation
 */
export function createFlipAnimation() {
  return {
    rotateY: withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(180, { duration: 400, easing: Easing.out(Easing.cubic) })
    ),
  };
}

/**
 * Combine multiple animations
 */
export function combineAnimations(...animations: any[]) {
  return animations.reduce((acc, anim) => ({ ...acc, ...anim }), {});
}

/**
 * Create delayed animation
 */
export function createDelayedAnimation(animation: any, delay: number) {
  return Object.entries(animation).reduce((acc, [key, value]) => {
    acc[key] = withDelay(delay, value as any);
    return acc;
  }, {} as any);
}
