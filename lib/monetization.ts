import AsyncStorage from "@react-native-async-storage/async-storage";

export type SubscriptionTier = "free" | "premium" | "elite";

export interface InAppProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: "cosmetic" | "feature" | "subscription" | "bundle";
  icon: string;
  benefit: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  startDate: number;
  renewalDate: number;
  autoRenew: boolean;
  price: number;
  status: "active" | "cancelled" | "expired";
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  timestamp: number;
  status: "completed" | "pending" | "failed";
}

export interface CosmeticItem {
  id: string;
  name: string;
  type: "avatar" | "badge" | "theme" | "effect";
  rarity: "common" | "rare" | "epic" | "legendary";
  price: number;
  owned: boolean;
  equipped: boolean;
}

export interface BattlePass {
  id: string;
  season: number;
  startDate: number;
  endDate: number;
  tier: "free" | "premium";
  currentLevel: number;
  maxLevel: number;
  rewards: BattlePassReward[];
}

export interface BattlePassReward {
  level: number;
  type: "xp" | "cosmetic" | "currency" | "badge";
  reward: string;
  value: number;
  claimed: boolean;
}

export interface VirtualCurrency {
  type: "coins" | "gems" | "premium_currency";
  balance: number;
  lastUpdated: number;
}

const PRODUCTS_KEY = "@motionfit_products";
const SUBSCRIPTION_KEY = "@motionfit_subscription";
const PURCHASES_KEY = "@motionfit_purchases";
const COSMETICS_KEY = "@motionfit_cosmetics";
const BATTLE_PASS_KEY = "@motionfit_battle_pass";
const CURRENCY_KEY = "@motionfit_currency";

const IN_APP_PRODUCTS: InAppProduct[] = [
  // Subscriptions
  {
    id: "sub_premium_monthly",
    name: "Premium Monthly",
    description: "Unlock all premium features for 1 month",
    price: 9.99,
    currency: "USD",
    category: "subscription",
    icon: "⭐",
    benefit: "Ad-free, advanced analytics, premium workouts",
  },
  {
    id: "sub_premium_yearly",
    name: "Premium Yearly",
    description: "Unlock all premium features for 1 year",
    price: 79.99,
    currency: "USD",
    category: "subscription",
    icon: "⭐",
    benefit: "Ad-free, advanced analytics, premium workouts",
  },
  {
    id: "sub_elite_monthly",
    name: "Elite Monthly",
    description: "Premium + exclusive coaching and live streams",
    price: 19.99,
    currency: "USD",
    category: "subscription",
    icon: "👑",
    benefit: "Everything in Premium + AI coaching + live streams",
  },

  // Cosmetics
  {
    id: "cosmetic_avatar_fire",
    name: "Fire Avatar",
    description: "Exclusive fire-themed avatar",
    price: 4.99,
    currency: "USD",
    category: "cosmetic",
    icon: "🔥",
    benefit: "Customize your profile with fire theme",
  },
  {
    id: "cosmetic_theme_dark",
    name: "Dark Theme",
    description: "Premium dark theme for the app",
    price: 2.99,
    currency: "USD",
    category: "cosmetic",
    icon: "🌙",
    benefit: "Exclusive dark theme with custom colors",
  },

  // Bundles
  {
    id: "bundle_starter",
    name: "Starter Bundle",
    description: "1000 coins + premium avatar",
    price: 9.99,
    currency: "USD",
    category: "bundle",
    icon: "🎁",
    benefit: "Great value for new players",
  },
  {
    id: "bundle_power",
    name: "Power Bundle",
    description: "5000 coins + 5 cosmetics + battle pass",
    price: 29.99,
    currency: "USD",
    category: "bundle",
    icon: "⚡",
    benefit: "Best value bundle",
  },
];

/**
 * Get all in-app products
 */
export function getAllProducts(): InAppProduct[] {
  return IN_APP_PRODUCTS;
}

/**
 * Get product by ID
 */
export function getProductById(id: string): InAppProduct | undefined {
  return IN_APP_PRODUCTS.find((p) => p.id === id);
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: string): InAppProduct[] {
  return IN_APP_PRODUCTS.filter((p) => p.category === category);
}

/**
 * Create subscription
 */
export async function createSubscription(
  userId: string,
  tier: SubscriptionTier,
  price: number
): Promise<Subscription> {
  try {
    const subscription: Subscription = {
      id: `sub_${Date.now()}`,
      userId,
      tier,
      startDate: Date.now(),
      renewalDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      autoRenew: true,
      price,
      status: "active",
    };

    await AsyncStorage.setItem(`${SUBSCRIPTION_KEY}_${userId}`, JSON.stringify(subscription));
    return subscription;
  } catch (error) {
    console.error("Failed to create subscription:", error);
    throw error;
  }
}

/**
 * Get subscription
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  try {
    const data = await AsyncStorage.getItem(`${SUBSCRIPTION_KEY}_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to get subscription:", error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string): Promise<void> {
  try {
    const subscription = await getSubscription(userId);
    if (subscription) {
      subscription.status = "cancelled";
      subscription.autoRenew = false;
      await AsyncStorage.setItem(`${SUBSCRIPTION_KEY}_${userId}`, JSON.stringify(subscription));
    }
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
  }
}

/**
 * Record purchase
 */
export async function recordPurchase(
  userId: string,
  productId: string,
  amount: number,
  currency: string
): Promise<Purchase> {
  try {
    const purchase: Purchase = {
      id: `purchase_${Date.now()}`,
      userId,
      productId,
      amount,
      currency,
      timestamp: Date.now(),
      status: "completed",
    };

    const existing = await getPurchases(userId);
    existing.push(purchase);
    await AsyncStorage.setItem(`${PURCHASES_KEY}_${userId}`, JSON.stringify(existing));

    return purchase;
  } catch (error) {
    console.error("Failed to record purchase:", error);
    throw error;
  }
}

/**
 * Get purchases
 */
export async function getPurchases(userId: string): Promise<Purchase[]> {
  try {
    const data = await AsyncStorage.getItem(`${PURCHASES_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get purchases:", error);
    return [];
  }
}

/**
 * Get total spent
 */
export async function getTotalSpent(userId: string): Promise<number> {
  try {
    const purchases = await getPurchases(userId);
    return purchases.reduce((total, p) => total + p.amount, 0);
  } catch (error) {
    console.error("Failed to get total spent:", error);
    return 0;
  }
}

/**
 * Add virtual currency
 */
export async function addVirtualCurrency(
  userId: string,
  type: "coins" | "gems" | "premium_currency",
  amount: number
): Promise<VirtualCurrency> {
  try {
    const key = `${CURRENCY_KEY}_${userId}_${type}`;
    const existing = await AsyncStorage.getItem(key);
    const currency: VirtualCurrency = existing
      ? JSON.parse(existing)
      : { type, balance: 0, lastUpdated: Date.now() };

    currency.balance += amount;
    currency.lastUpdated = Date.now();

    await AsyncStorage.setItem(key, JSON.stringify(currency));
    return currency;
  } catch (error) {
    console.error("Failed to add virtual currency:", error);
    throw error;
  }
}

/**
 * Get virtual currency balance
 */
export async function getVirtualCurrencyBalance(
  userId: string,
  type: "coins" | "gems" | "premium_currency"
): Promise<number> {
  try {
    const key = `${CURRENCY_KEY}_${userId}_${type}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data).balance : 0;
  } catch (error) {
    console.error("Failed to get virtual currency balance:", error);
    return 0;
  }
}

/**
 * Purchase cosmetic
 */
export async function purchaseCosmetic(userId: string, cosmeticId: string): Promise<CosmeticItem | null> {
  try {
    const product = getProductById(cosmeticId);
    if (!product) return null;

    await recordPurchase(userId, cosmeticId, product.price, product.currency);

    const cosmetic: CosmeticItem = {
      id: cosmeticId,
      name: product.name,
      type: "avatar",
      rarity: "rare",
      price: product.price,
      owned: true,
      equipped: false,
    };

    const existing = await getOwnedCosmetics(userId);
    existing.push(cosmetic);
    await AsyncStorage.setItem(`${COSMETICS_KEY}_${userId}`, JSON.stringify(existing));

    return cosmetic;
  } catch (error) {
    console.error("Failed to purchase cosmetic:", error);
    return null;
  }
}

/**
 * Get owned cosmetics
 */
export async function getOwnedCosmetics(userId: string): Promise<CosmeticItem[]> {
  try {
    const data = await AsyncStorage.getItem(`${COSMETICS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get owned cosmetics:", error);
    return [];
  }
}

/**
 * Create battle pass
 */
export async function createBattlePass(userId: string, season: number): Promise<BattlePass> {
  try {
    const rewards: BattlePassReward[] = [];
    for (let i = 1; i <= 50; i++) {
      const rewardType = i % 5 === 0 ? "cosmetic" : i % 3 === 0 ? "badge" : "xp";
      rewards.push({
        level: i,
        type: rewardType as any,
        reward: `Reward ${i}`,
        value: i * 100,
        claimed: false,
      });
    }

    const battlePass: BattlePass = {
      id: `bp_${Date.now()}`,
      season,
      startDate: Date.now(),
      endDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
      tier: "premium",
      currentLevel: 1,
      maxLevel: 50,
      rewards,
    };

    await AsyncStorage.setItem(`${BATTLE_PASS_KEY}_${userId}`, JSON.stringify(battlePass));
    return battlePass;
  } catch (error) {
    console.error("Failed to create battle pass:", error);
    throw error;
  }
}

/**
 * Get battle pass
 */
export async function getBattlePass(userId: string): Promise<BattlePass | null> {
  try {
    const data = await AsyncStorage.getItem(`${BATTLE_PASS_KEY}_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to get battle pass:", error);
    return null;
  }
}

/**
 * Claim battle pass reward
 */
export async function claimBattlePassReward(userId: string, level: number): Promise<void> {
  try {
    const battlePass = await getBattlePass(userId);
    if (!battlePass) return;

    const reward = battlePass.rewards.find((r) => r.level === level);
    if (reward) {
      reward.claimed = true;
      await AsyncStorage.setItem(`${BATTLE_PASS_KEY}_${userId}`, JSON.stringify(battlePass));
    }
  } catch (error) {
    console.error("Failed to claim battle pass reward:", error);
  }
}

/**
 * Get monetization stats
 */
export async function getMonetizationStats(userId: string): Promise<{
  totalSpent: number;
  subscriptionActive: boolean;
  cosmeticsOwned: number;
  battlePassLevel: number;
}> {
  try {
    const totalSpent = await getTotalSpent(userId);
    const subscription = await getSubscription(userId);
    const cosmetics = await getOwnedCosmetics(userId);
    const battlePass = await getBattlePass(userId);

    return {
      totalSpent,
      subscriptionActive: subscription?.status === "active" || false,
      cosmeticsOwned: cosmetics.length,
      battlePassLevel: battlePass?.currentLevel || 0,
    };
  } catch (error) {
    console.error("Failed to get monetization stats:", error);
    return {
      totalSpent: 0,
      subscriptionActive: false,
      cosmeticsOwned: 0,
      battlePassLevel: 0,
    };
  }
}
