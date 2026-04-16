import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSubscription } from "@/lib/subscription-context";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";

const FEATURES = [
  { icon: "🏆", title: "Global Leaderboard", desc: "Compete with athletes worldwide" },
  { icon: "⚔️", title: "Game Challenges", desc: "Boss battles, speed runs & endurance modes" },
  { icon: "🎙️", title: "All Voice Coaches", desc: "Drill Sergeant, Zen Master & more" },
  { icon: "🧬", title: "All Avatars", desc: "Unlock every avatar as you level up" },
  { icon: "📊", title: "Advanced Stats", desc: "Weekly trends, personal records & insights" },
  { icon: "⚡", title: "Unlimited Workouts", desc: "No daily limits, track everything" },
];

export default function PaywallScreen() {
  const colors = useColors();
  const { purchaseMonthly, purchaseAnnual, restorePurchases, closePaywall } = useSubscription();
  const [selected, setSelected] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLoading(true);
    const success = selected === "annual"
      ? await purchaseAnnual()
      : await purchaseMonthly();
    setLoading(false);
    if (success) {
      closePaywall();
      router.back();
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    await restorePurchases();
    setLoading(false);
  };

  const handleClose = () => {
    closePaywall();
    if (router.canGoBack()) router.back();
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-[#0d0d1a]">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>

        {/* Hero */}
        <LinearGradient
          colors={["#ff6b35", "#f7931e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBadge}
        >
          <Text style={styles.heroIcon}>⚡</Text>
        </LinearGradient>

        <Text style={styles.heroTitle}>MotionFit{"\n"}Premium</Text>
        <Text style={styles.heroSubtitle}>
          Unlock everything. Compete globally.{"\n"}Train like a champion.
        </Text>

        {/* Feature list */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.plansRow}>
          {/* Annual plan */}
          <Pressable
            onPress={() => {
              setSelected("annual");
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={({ pressed }) => [
              styles.planCard,
              selected === "annual" && styles.planCardSelected,
              pressed && { opacity: 0.85 },
            ]}
          >
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>
            <Text style={styles.planPrice}>$34.99</Text>
            <Text style={styles.planPeriod}>per year</Text>
            <Text style={styles.planPerMonth}>$2.92 / mo</Text>
            <Text style={styles.planSaving}>Save 42%</Text>
          </Pressable>

          {/* Monthly plan */}
          <Pressable
            onPress={() => {
              setSelected("monthly");
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={({ pressed }) => [
              styles.planCard,
              selected === "monthly" && styles.planCardSelected,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.planPrice}>$4.99</Text>
            <Text style={styles.planPeriod}>per month</Text>
            <Text style={styles.planPerMonth}>Billed monthly</Text>
            <Text style={styles.planSaving}>Cancel anytime</Text>
          </Pressable>
        </View>

        {/* CTA button */}
        <Pressable
          onPress={handlePurchase}
          disabled={loading}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            loading && { opacity: 0.7 },
          ]}
        >
          <LinearGradient
            colors={["#ff6b35", "#f7931e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>
                {selected === "annual"
                  ? "Start Annual Plan — $34.99/yr"
                  : "Start Monthly Plan — $4.99/mo"}
              </Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* Free trial note */}
        <Text style={styles.trialNote}>
          3-day free trial included · Cancel anytime
        </Text>

        {/* Restore */}
        <Pressable
          onPress={handleRestore}
          disabled={loading}
          style={({ pressed }) => [styles.restoreBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </Pressable>

        {/* Legal */}
        <Text style={styles.legal}>
          Payment will be charged to your App Store / Google Play account at confirmation.
          Subscription automatically renews unless cancelled at least 24 hours before the end
          of the current period.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  closeBtn: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "600",
  },
  heroBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
    shadowColor: "#ff6b35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  heroIcon: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 42,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,107,53,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 20,
  },
  featureDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 18,
  },
  checkmark: {
    fontSize: 16,
    color: "#ff6b35",
    fontWeight: "800",
    marginLeft: 8,
  },
  plansRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
    overflow: "hidden",
    minHeight: 130,
    justifyContent: "center",
  },
  planCardSelected: {
    borderColor: "#ff6b35",
    backgroundColor: "rgba(255,107,53,0.12)",
  },
  bestValueBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ff6b35",
    paddingVertical: 4,
    alignItems: "center",
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 20,
  },
  planPeriod: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  planPerMonth: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    marginTop: 4,
  },
  planSaving: {
    fontSize: 11,
    color: "#ff6b35",
    fontWeight: "700",
    marginTop: 4,
  },
  ctaButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#ff6b35",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  trialNote: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginBottom: 16,
  },
  restoreBtn: {
    paddingVertical: 8,
    marginBottom: 20,
  },
  restoreText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textDecorationLine: "underline",
  },
  legal: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
