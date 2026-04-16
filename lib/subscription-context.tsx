import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── RevenueCat product identifiers ──────────────────────────────────────────
// These must match the product IDs you create in App Store Connect / Google Play
export const PRODUCT_IDS = {
  MONTHLY: "motionfit_premium_monthly",   // $4.99/month
  ANNUAL:  "motionfit_premium_annual",    // $34.99/year (~$2.92/month)
} as const;

export const ENTITLEMENT_ID = "premium";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  activeProductId: string | null;
  expiryDate: Date | null;
}

interface SubscriptionContextValue extends SubscriptionState {
  purchaseMonthly: () => Promise<boolean>;
  purchaseAnnual: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  openPaywall: () => void;
  closePaywall: () => void;
  isPaywallVisible: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}

// ─── Storage key for dev override ────────────────────────────────────────────
const DEV_PREMIUM_KEY = "@motionfit:dev_premium";

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    isLoading: true,
    activeProductId: null,
    expiryDate: null,
  });
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const rcRef = useRef<typeof import("react-native-purchases") | null>(null);

  // ── Initialize RevenueCat ──────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // On web or if no API key configured, use dev/mock mode
      if (Platform.OS === "web") {
        const devPremium = await AsyncStorage.getItem(DEV_PREMIUM_KEY);
        setState({
          isPremium: devPremium === "true",
          isLoading: false,
          activeProductId: devPremium === "true" ? PRODUCT_IDS.MONTHLY : null,
          expiryDate: devPremium === "true" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        });
        return;
      }

      try {
        // Dynamically import to avoid web crashes
        const Purchases = (await import("react-native-purchases")).default;
        rcRef.current = await import("react-native-purchases");

        // Use your RevenueCat API key here
        // iOS key starts with "appl_", Android key starts with "goog_"
        const apiKey = Platform.OS === "ios"
          ? (process.env.EXPO_PUBLIC_RC_IOS_KEY ?? "")
          : (process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "");

        if (!apiKey) {
          // No key configured — run in mock mode (dev/testing)
          const devPremium = await AsyncStorage.getItem(DEV_PREMIUM_KEY);
          setState({
            isPremium: devPremium === "true",
            isLoading: false,
            activeProductId: devPremium === "true" ? PRODUCT_IDS.MONTHLY : null,
            expiryDate: null,
          });
          return;
        }

        await Purchases.configure({ apiKey });

        // Listen for customer info updates
        Purchases.addCustomerInfoUpdateListener((info) => {
          const entitlement = info.entitlements.active[ENTITLEMENT_ID];
          setState({
            isPremium: !!entitlement,
            isLoading: false,
            activeProductId: entitlement?.productIdentifier ?? null,
            expiryDate: entitlement?.expirationDate
              ? new Date(entitlement.expirationDate)
              : null,
          });
        });

        // Get current status
        const info = await Purchases.getCustomerInfo();
        const entitlement = info.entitlements.active[ENTITLEMENT_ID];
        setState({
          isPremium: !!entitlement,
          isLoading: false,
          activeProductId: entitlement?.productIdentifier ?? null,
          expiryDate: entitlement?.expirationDate
            ? new Date(entitlement.expirationDate)
            : null,
        });
      } catch (err) {
        console.warn("[RevenueCat] Init error, falling back to mock mode:", err);
        const devPremium = await AsyncStorage.getItem(DEV_PREMIUM_KEY);
        setState({
          isPremium: devPremium === "true",
          isLoading: false,
          activeProductId: null,
          expiryDate: null,
        });
      }
    };

    init();
  }, []);

  // ── Purchase helpers ───────────────────────────────────────────────────────
  const purchaseProduct = useCallback(async (productId: string): Promise<boolean> => {
    // Mock mode (no RC key or web)
    if (!rcRef.current || Platform.OS === "web") {
      await AsyncStorage.setItem(DEV_PREMIUM_KEY, "true");
      setState((prev) => ({
        ...prev,
        isPremium: true,
        activeProductId: productId,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }));
      return true;
    }

    try {
      const Purchases = rcRef.current.default as typeof import("react-native-purchases").default;
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p) => p.product.identifier === productId
      );
      if (!pkg) {
        Alert.alert("Product not found", "Please try again later.");
        return false;
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      if (entitlement) {
        setState({
          isPremium: true,
          isLoading: false,
          activeProductId: entitlement.productIdentifier,
          expiryDate: entitlement.expirationDate
            ? new Date(entitlement.expirationDate)
            : null,
        });
        return true;
      }
      return false;
    } catch (err: unknown) {
      const e = err as { userCancelled?: boolean; message?: string };
      if (!e.userCancelled) {
        Alert.alert("Purchase failed", e.message ?? "Please try again.");
      }
      return false;
    }
  }, []);

  const purchaseMonthly = useCallback(
    () => purchaseProduct(PRODUCT_IDS.MONTHLY),
    [purchaseProduct]
  );

  const purchaseAnnual = useCallback(
    () => purchaseProduct(PRODUCT_IDS.ANNUAL),
    [purchaseProduct]
  );

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!rcRef.current || Platform.OS === "web") {
      Alert.alert("No purchases to restore", "You have no previous purchases on this account.");
      return false;
    }
    try {
      const Purchases = rcRef.current.default as typeof import("react-native-purchases").default;
      const info = await Purchases.restorePurchases();
      const entitlement = info.entitlements.active[ENTITLEMENT_ID];
      if (entitlement) {
        setState({
          isPremium: true,
          isLoading: false,
          activeProductId: entitlement.productIdentifier,
          expiryDate: entitlement.expirationDate
            ? new Date(entitlement.expirationDate)
            : null,
        });
        Alert.alert("Purchases restored!", "Your premium access has been restored.");
        return true;
      }
      Alert.alert("No active subscription found", "No previous purchases were found for this account.");
      return false;
    } catch (err: unknown) {
      const e = err as { message?: string };
      Alert.alert("Restore failed", e.message ?? "Please try again.");
      return false;
    }
  }, []);

  const openPaywall = useCallback(() => setIsPaywallVisible(true), []);
  const closePaywall = useCallback(() => setIsPaywallVisible(false), []);

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        purchaseMonthly,
        purchaseAnnual,
        restorePurchases,
        openPaywall,
        closePaywall,
        isPaywallVisible,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
