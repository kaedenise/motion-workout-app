import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSubscription } from "@/lib/subscription-context";
import { router } from "expo-router";

interface PremiumGateProps {
  /** The feature name shown in the lock overlay */
  featureName: string;
  /** Short description of what the user gets */
  description?: string;
  /** Icon/emoji for the feature */
  icon?: string;
  /** If true, renders children normally (no gate). Defaults to isPremium. */
  unlocked?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a feature with a premium lock overlay when the user is not subscribed.
 * If unlocked (or isPremium), renders children directly.
 */
export function PremiumGate({
  featureName,
  description = "Upgrade to MotionFit Premium to unlock this feature.",
  icon = "🔒",
  unlocked,
  children,
}: PremiumGateProps) {
  const { isPremium, openPaywall } = useSubscription();
  const isUnlocked = unlocked ?? isPremium;

  if (isUnlocked) return <>{children}</>;

  const handleUnlock = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    openPaywall();
    router.push("/paywall");
  };

  return (
    <View style={styles.container}>
      {/* Blurred/dimmed children preview */}
      <View style={styles.childrenPreview} pointerEvents="none">
        {children}
      </View>

      {/* Lock overlay */}
      <View style={styles.overlay}>
        <LinearGradient
          colors={["rgba(13,13,26,0.7)", "rgba(13,13,26,0.97)"]}
          style={styles.overlayGradient}
        >
          <View style={styles.lockIconWrap}>
            <Text style={styles.lockIcon}>{icon}</Text>
          </View>
          <Text style={styles.lockTitle}>{featureName}</Text>
          <Text style={styles.lockDesc}>{description}</Text>
          <Pressable
            onPress={handleUnlock}
            style={({ pressed }) => [
              styles.unlockBtn,
              pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
            ]}
          >
            <LinearGradient
              colors={["#ff6b35", "#f7931e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.unlockBtnGradient}
            >
              <Text style={styles.unlockBtnText}>⚡ Unlock Premium</Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

/**
 * Inline lock badge — use this on tab icons or small UI elements
 * to indicate a feature is premium without a full overlay.
 */
export function PremiumBadge({ onPress }: { onPress?: () => void }) {
  const { isPremium } = useSubscription();
  if (isPremium) return null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.badge, pressed && { opacity: 0.7 }]}
    >
      <LinearGradient
        colors={["#ff6b35", "#f7931e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.badgeGradient}
      >
        <Text style={styles.badgeText}>PRO</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  childrenPreview: {
    flex: 1,
    opacity: 0.15,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  overlayGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  lockIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(255,107,53,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.3)",
  },
  lockIcon: {
    fontSize: 36,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  lockDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  unlockBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#ff6b35",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  unlockBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  unlockBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  badge: {
    borderRadius: 6,
    overflow: "hidden",
    marginLeft: 4,
  },
  badgeGradient: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
});
