import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFriendChallenge } from "@/lib/friend-challenge-context";
import { usePhoneAuth } from "@/lib/phone-auth-context";
import { useProfile } from "@/lib/profile-context";

/**
 * Deep link handler for shareable challenge links
 * Handles: motionfit://challenge?friend={phone}&exercise={type}&reps={count}
 */
export default function ChallengeLinkHandler() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const { phoneNumber } = usePhoneAuth();
  const { profile } = useProfile();
  const { createChallenge, friends } = useFriendChallenge();

  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        // Extract parameters from deep link
        const friendPhone = params.friend as string;
        const exercise = params.exercise as string;
        const reps = parseInt(params.reps as string, 10);

        if (!friendPhone || !exercise || !reps || !phoneNumber) {
          console.error("Invalid deep link parameters", { friendPhone, exercise, reps, phoneNumber });
          router.back();
          return;
        }

        // Verify friend exists
        const friend = friends.find((f) => f.phone === friendPhone);
        if (!friend) {
          console.error("Friend not found", friendPhone);
          router.back();
          return;
        }

        // Create the challenge
        await createChallenge(
          phoneNumber,
          profile.name,
          profile.avatarId,
          friendPhone,
          exercise as "push-up" | "squat" | "running" | "jumping-jack" | "sit-up",
          reps
        );

        // Navigate to the friends screen after challenge creation
        router.replace("/friends");
      } catch (error) {
        console.error("Error handling challenge deep link:", error);
        router.back();
      }
    };

    handleDeepLink();
  }, [params, phoneNumber, profile, friends, createChallenge]);

  return (
    <ScreenContainer className="items-center justify-center">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.foreground, marginTop: 16 }}>
        Loading challenge...
      </Text>
    </ScreenContainer>
  );
}
