import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFriendChallenge } from "@/lib/friend-challenge-context";
import { usePhoneAuth } from "@/lib/phone-auth-context";
import { AVATARS } from "@/lib/gamification";

export default function ChallengeActiveScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams();
  const { phoneNumber } = usePhoneAuth();
  const { activeChallenges, updateChallengeReps, completeChallenge } = useFriendChallenge();


  const challenge = activeChallenges.find((c) => c.id === id);
  const isChallenger = challenge?.challengerPhone === phoneNumber;
  const myReps = isChallenger ? challenge?.challengerReps || 0 : challenge?.opponentReps || 0;
  const theirReps = isChallenger ? challenge?.opponentReps || 0 : challenge?.challengerReps || 0;
  const targetReps = challenge?.targetReps || 20;
  const progress = (myReps / targetReps) * 100;
  const theirProgress = (theirReps / targetReps) * 100;

  const opponentName = isChallenger ? challenge?.opponentName : challenge?.challengerName;
  const opponentAvatar = isChallenger ? challenge?.opponentAvatar : challenge?.challengerAvatar;

  const exerciseEmojis: Record<string, string> = {
    "push-up": "💪",
    squat: "🦵",
    running: "🏃",
    "jumping-jack": "🤸",
    "sit-up": "🫀",
  };

  // Simulate rep updates (in real app, this would come from motion detection)
  const handleAddRep = async () => {
    if (!challenge || myReps >= targetReps) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newReps = myReps + 1;
    await updateChallengeReps(challenge.id, isChallenger, newReps);

    if (newReps >= targetReps) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // Determine winner
      const iWon = newReps >= targetReps && theirReps < targetReps;
      await completeChallenge(
        challenge.id,
        iWon ? (isChallenger ? challenge.challengerId : challenge.opponentId || "") : "",
        iWon ? (isChallenger ? challenge.challengerName : challenge.opponentName || "") : ""
      );
    }
  };

  useEffect(() => {
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      // In a real app, this would fetch from server
    }, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [challenge?.id]);

  if (!challenge) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.foreground, fontSize: 16 }}>Challenge not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-4 py-6">
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: colors.primary, fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {exerciseEmojis[challenge.exerciseType]} {challenge.exerciseType}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Opponent Info */}
      <View style={[styles.opponentCard, { backgroundColor: colors.surface }]}>
        <Text style={styles.opponentAvatar}>{opponentAvatar || "🏋️"}</Text>
        <Text style={[styles.opponentName, { color: colors.foreground }]}>{opponentName}</Text>
        <Text style={[styles.opponentReps, { color: colors.muted }]}>
          {theirReps} / {targetReps}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(theirProgress, 100)}%`, backgroundColor: "#06B6D4" },
            ]}
          />
        </View>
      </View>

      {/* VS Divider */}
      <View style={styles.divider}>
        <Text style={[styles.dividerText, { color: colors.muted }]}>VS</Text>
      </View>

      {/* Your Info */}
      <View style={[styles.yourCard, { backgroundColor: colors.surface }]}>
        <Text style={styles.yourAvatar}>🏋️</Text>
        <Text style={[styles.yourName, { color: colors.foreground }]}>You</Text>
        <Text style={[styles.yourReps, { color: colors.muted }]}>
          {myReps} / {targetReps}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(progress, 100)}%`, backgroundColor: "#FF6B35" },
            ]}
          />
        </View>
      </View>

      {/* Large Rep Counter */}
      {myReps < targetReps && (
        <View style={styles.counterContainer}>
          <Pressable
            onPress={handleAddRep}
            style={({ pressed }) => [
              styles.counterButton,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <LinearGradient colors={["#FF6B35", "#FF8C42"]} style={styles.counterGradient}>
              <Text style={styles.counterText}>+1 Rep</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      {/* Finish Button */}
      {myReps >= targetReps && (
        <View style={styles.finishContainer}>
          <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.finishGradient}>
            <Text style={styles.finishText}>🎉 You Won!</Text>
          </LinearGradient>
        </View>
      )}

      {/* Status Message */}
      {theirReps >= targetReps && myReps < targetReps && (
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: "#EF4444" }]}>
            Your opponent finished! 😢
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  opponentCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  opponentAvatar: {
    fontSize: 56,
    marginBottom: 8,
  },
  opponentName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  opponentReps: {
    fontSize: 14,
    marginBottom: 12,
  },
  yourCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  yourAvatar: {
    fontSize: 56,
    marginBottom: 8,
  },
  yourName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  yourReps: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressBar: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  divider: {
    alignItems: "center",
    marginVertical: 12,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: "700",
  },
  counterContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  counterButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
  },
  counterGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
  },
  finishContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  finishGradient: {
    paddingVertical: 20,
    alignItems: "center",
  },
  finishText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
  },
  statusContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
