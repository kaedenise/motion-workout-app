import AsyncStorage from "@react-native-async-storage/async-storage";

export type SubscriptionTier = "free" | "premium" | "elite";

export interface Subscription {
  tier: SubscriptionTier;
  startDate: number;
  endDate: number | null;
  autoRenew: boolean;
  price: number;
}

export interface PremiumFeatures {
  unlimitedWorkouts: boolean;
  advancedAnalytics: boolean;
  customWorkoutPlans: boolean;
  aiCoach: boolean;
  adFree: boolean;
  premiumContent: boolean;
  prioritySupport: boolean;
  socialFeatures: boolean;
}

const SUBSCRIPTION_KEY = "@motionfit_subscription";

/**
 * Get premium features for subscription tier
 */
export function getPremiumFeatures(tier: SubscriptionTier): PremiumFeatures {
  const features: Record<SubscriptionTier, PremiumFeatures> = {
    free: {
      unlimitedWorkouts: false,
      advancedAnalytics: false,
      customWorkoutPlans: false,
      aiCoach: false,
      adFree: false,
      premiumContent: false,
      prioritySupport: false,
      socialFeatures: true,
    },
    premium: {
      unlimitedWorkouts: true,
      advancedAnalytics: true,
      customWorkoutPlans: true,
      aiCoach: false,
      adFree: true,
      premiumContent: true,
      prioritySupport: false,
      socialFeatures: true,
    },
    elite: {
      unlimitedWorkouts: true,
      advancedAnalytics: true,
      customWorkoutPlans: true,
      aiCoach: true,
      adFree: true,
      premiumContent: true,
      prioritySupport: true,
      socialFeatures: true,
    },
  };

  return features[tier];
}

/**
 * Get subscription pricing
 */
export function getSubscriptionPricing(tier: SubscriptionTier): {
  monthly: number;
  yearly: number;
} {
  const pricing: Record<SubscriptionTier, { monthly: number; yearly: number }> = {
    free: { monthly: 0, yearly: 0 },
    premium: { monthly: 9.99, yearly: 79.99 },
    elite: { monthly: 19.99, yearly: 159.99 },
  };

  return pricing[tier];
}

/**
 * Get current subscription
 */
export async function getCurrentSubscription(): Promise<Subscription | null> {
  try {
    const data = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
    if (!data) return null;

    const subscription = JSON.parse(data) as Subscription;

    // Check if subscription has expired
    if (subscription.endDate && subscription.endDate < Date.now()) {
      if (!subscription.autoRenew) {
        // Subscription expired and not auto-renewing
        await clearSubscription();
        return null;
      }
    }

    return subscription;
  } catch (error) {
    console.error("Failed to get subscription:", error);
    return null;
  }
}

/**
 * Set subscription
 */
export async function setSubscription(subscription: Subscription): Promise<void> {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription));
  } catch (error) {
    console.error("Failed to set subscription:", error);
  }
}

/**
 * Clear subscription
 */
export async function clearSubscription(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SUBSCRIPTION_KEY);
  } catch (error) {
    console.error("Failed to clear subscription:", error);
  }
}

/**
 * Check if user has premium access
 */
export async function hasPremiumAccess(): Promise<boolean> {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) return false;

    return subscription.tier === "premium" || subscription.tier === "elite";
  } catch (error) {
    console.error("Failed to check premium access:", error);
    return false;
  }
}

/**
 * Check if user has elite access
 */
export async function hasEliteAccess(): Promise<boolean> {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) return false;

    return subscription.tier === "elite";
  } catch (error) {
    console.error("Failed to check elite access:", error);
    return false;
  }
}

/**
 * Get current subscription tier
 */
export async function getCurrentTier(): Promise<SubscriptionTier> {
  try {
    const subscription = await getCurrentSubscription();
    return subscription?.tier ?? "free";
  } catch (error) {
    console.error("Failed to get current tier:", error);
    return "free";
  }
}

/**
 * Get days remaining in subscription
 */
export async function getDaysRemaining(): Promise<number | null> {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription || !subscription.endDate) return null;

    const daysRemaining = Math.ceil((subscription.endDate - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  } catch (error) {
    console.error("Failed to get days remaining:", error);
    return null;
  }
}

/**
 * Check if subscription is active
 */
export async function isSubscriptionActive(): Promise<boolean> {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) return false;

    // Check if subscription has not expired
    if (subscription.endDate && subscription.endDate < Date.now()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to check subscription status:", error);
    return false;
  }
}

/**
 * Get trial status
 */
export async function getTrialStatus(): Promise<{
  isTrialing: boolean;
  daysRemaining: number;
} | null> {
  try {
    const trialStr = await AsyncStorage.getItem("@motionfit_trial");
    if (!trialStr) return null;

    const trial = JSON.parse(trialStr) as { startDate: number; durationDays: number };
    const endDate = trial.startDate + trial.durationDays * 24 * 60 * 60 * 1000;
    const daysRemaining = Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      isTrialing: daysRemaining > 0,
      daysRemaining: Math.max(0, daysRemaining),
    };
  } catch (error) {
    console.error("Failed to get trial status:", error);
    return null;
  }
}

/**
 * Start trial
 */
export async function startTrial(durationDays: number = 7): Promise<void> {
  try {
    const trial = {
      startDate: Date.now(),
      durationDays,
    };
    await AsyncStorage.setItem("@motionfit_trial", JSON.stringify(trial));
  } catch (error) {
    console.error("Failed to start trial:", error);
  }
}

/**
 * Check if feature is available
 */
export async function isFeatureAvailable(feature: keyof PremiumFeatures): Promise<boolean> {
  try {
    const tier = await getCurrentTier();
    const features = getPremiumFeatures(tier);
    return features[feature];
  } catch (error) {
    console.error("Failed to check feature availability:", error);
    return false;
  }
}
