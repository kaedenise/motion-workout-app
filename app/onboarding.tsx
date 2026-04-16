import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { useProfile } from "@/lib/profile-context";
import { AVATARS, VOICE_PERSONAS, type VoicePersona } from "@/lib/gamification";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const ONBOARDING_DONE_KEY = "motionfit_onboarding_done";

export async function markOnboardingDone() {
  await AsyncStorage.setItem(ONBOARDING_DONE_KEY, "1");
}

export async function hasCompletedOnboarding() {
  const val = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
  return val === "1";
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateProfile } = useProfile();

  const [step, setStep] = useState<"name" | "avatar" | "voice">("name");
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("warrior");
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>("coach");

  const freeAvatars = AVATARS.filter((a) => a.unlockLevel === 1);

  const handleNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === "name") setStep("avatar");
    else if (step === "avatar") setStep("voice");
    else handleFinish();
  };

  const handleFinish = async () => {
    await updateProfile({
      name: name.trim() || "Athlete",
      avatarId: selectedAvatar,
      voicePersona: selectedVoice,
      voiceEnabled: true,
    });
    await markOnboardingDone();
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient colors={["#0F0C29", "#302B63", "#24243E"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <Text style={styles.logoEmoji}>⚡</Text>
          <Text style={styles.logoText}>MotionFit</Text>
        </View>

        {/* Step Indicators */}
        <View style={styles.steps}>
          {(["name", "avatar", "voice"] as const).map((s, i) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                step === s && styles.stepDotActive,
                (step === "avatar" && i === 0) ||
                (step === "voice" && i <= 1)
                  ? styles.stepDotDone
                  : null,
              ]}
            />
          ))}
        </View>

        {/* ─── Step 1: Name ─── */}
        {step === "name" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSubtitle}>
              Your name will appear on the leaderboard
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleNext}
            />
          </View>
        )}

        {/* ─── Step 2: Avatar ─── */}
        {step === "avatar" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose your avatar</Text>
            <Text style={styles.stepSubtitle}>
              More avatars unlock as you level up
            </Text>
            <View style={styles.avatarGrid}>
              {freeAvatars.map((avatar) => (
                <Pressable
                  key={avatar.id}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAvatar(avatar.id);
                  }}
                  style={({ pressed }) => [
                    styles.avatarCard,
                    selectedAvatar === avatar.id && {
                      borderColor: avatar.color,
                      backgroundColor: avatar.color + "33",
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                  <Text style={styles.avatarName}>{avatar.name}</Text>
                  {selectedAvatar === avatar.id && (
                    <View style={[styles.selectedBadge, { backgroundColor: avatar.color }]}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ─── Step 3: Voice ─── */}
        {step === "voice" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose your coach</Text>
            <Text style={styles.stepSubtitle}>
              Your AI voice coach will guide you through every workout
            </Text>
            <View style={styles.voiceList}>
              {(Object.entries(VOICE_PERSONAS) as [VoicePersona, typeof VOICE_PERSONAS[VoicePersona]][]).map(
                ([key, persona]) => (
                  <Pressable
                    key={key}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedVoice(key);
                    }}
                    style={({ pressed }) => [
                      styles.voiceCard,
                      selectedVoice === key && styles.voiceCardActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={styles.voiceEmoji}>{persona.emoji}</Text>
                    <View style={styles.voiceInfo}>
                      <Text style={styles.voiceName}>{persona.name}</Text>
                      <Text style={styles.voiceDesc}>{persona.description}</Text>
                    </View>
                    {selectedVoice === key && (
                      <View style={styles.voiceCheck}>
                        <Text style={styles.voiceCheckText}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                )
              )}
            </View>
          </View>
        )}

        {/* Next / Finish Button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient
            colors={["#FF6B35", "#FF4500"]}
            style={styles.nextBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextBtnText}>
              {step === "voice" ? "🚀  Let's Go!" : "Continue →"}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    alignItems: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  logoEmoji: { fontSize: 32 },
  logoText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  steps: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 40,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  stepDotActive: {
    width: 24,
    backgroundColor: "#FF6B35",
  },
  stepDotDone: {
    backgroundColor: "#34D399",
  },
  stepContent: {
    width: "100%",
    alignItems: "center",
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    padding: 16,
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    width: "100%",
  },
  avatarCard: {
    width: (width - 48 - 36) / 4,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  avatarEmoji: { fontSize: 28 },
  avatarName: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textAlign: "center",
  },
  selectedBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBadgeText: { fontSize: 10, color: "#FFFFFF", fontWeight: "800" },
  voiceList: { width: "100%", gap: 12 },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: 14,
  },
  voiceCardActive: {
    borderColor: "#FF6B35",
    backgroundColor: "rgba(255,107,53,0.15)",
  },
  voiceEmoji: { fontSize: 32 },
  voiceInfo: { flex: 1, gap: 4 },
  voiceName: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  voiceDesc: { fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 16 },
  voiceCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceCheckText: { fontSize: 12, color: "#FFFFFF", fontWeight: "800" },
  nextBtn: { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 8 },
  nextBtnGradient: { padding: 18, alignItems: "center" },
  nextBtnText: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
});
