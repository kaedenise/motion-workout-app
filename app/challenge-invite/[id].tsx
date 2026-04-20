import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFriendChallenge } from "@/lib/friend-challenge-context";
import { usePhoneAuth } from "@/lib/phone-auth-context";
import { useProfile } from "@/lib/profile-context";
import { AVATARS } from "@/lib/gamification";

export default function ChallengeInviteScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams();
  const { phoneNumber } = usePhoneAuth();
  const { profile } = useProfile();
  const { pendingInvites, acceptChallenge, declineChallenge } = useFriendChallenge();
  const [loading, setLoading] = useState(false);

  const invite = pendingInvites.find((inv) => inv.id === id);

  if (!invite) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.foreground, fontSize: 16 }}>Challenge not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const challengerAvatar = AVATARS.find((a) => a.emoji === invite.challengerAvatar) || { emoji: "🏋️" };

  const exerciseEmojis: Record<string, string> = {
    "push-up": "💪",
    squat: "🦵",
    running: "🏃",
    "jumping-jack": "🤸",
    "sit-up": "🫀",
  };

  const handleAccept = async () => {
    if (!phoneNumber) return;
    setLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const avatar = AVATARS.find((a) => a.id === profile.avatarId);
    await acceptChallenge(invite.id, phoneNumber, profile.name, avatar?.emoji || "🏋️");
    setLoading(false);
    router.back();
  };

  const handleDecline = async () => {
    if (!phoneNumber) return;
    setLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await declineChallenge(invite.id);
    setLoading(false);
    router.back();
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="justify-center items-center px-4">
      <LinearGradient colors={["#FF6B35", "#FF8C42"]} style={styles.card}>
        {/* Challenger Avatar */}
        <Text style={styles.avatar}>{challengerAvatar.emoji}</Text>

        {/* Challenge Title */}
        <Text style={styles.title}>You've been challenged!</Text>
        <Text style={styles.challengerName}>{invite.challengerName}</Text>

        {/* Exercise & Target */}
        <View style={styles.challengeBox}>
          <Text style={styles.exerciseEmoji}>{exerciseEmojis[invite.exerciseType]}</Text>
          <Text style={styles.exerciseText}>{invite.targetReps} {invite.exerciseType}s</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Can you complete {invite.targetReps} {invite.exerciseType}s before your opponent?
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={handleDecline}
            disabled={loading}
            style={({ pressed }) => [
              styles.declineBtn,
              pressed && !loading && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.declineBtnText}>Decline</Text>
          </Pressable>

          <Pressable
            onPress={handleAccept}
            disabled={loading}
            style={({ pressed }) => [
              styles.acceptBtn,
              pressed && !loading && { transform: [{ scale: 0.97 }] },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.acceptBtnText}>🚀 Accept Challenge</Text>
            )}
          </Pressable>
        </View>
      </LinearGradient>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    fontSize: 80,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
  },
  challengerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  challengeBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    width: "100%",
    marginVertical: 8,
  },
  exerciseEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  exerciseText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  description: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginTop: 12,
  },
  declineBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  declineBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
  },
  acceptBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  acceptBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
  },
  backBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
});
