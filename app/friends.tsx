import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFriendChallenge } from "@/lib/friend-challenge-context";
import { useProfile } from "@/lib/profile-context";
import { usePhoneAuth } from "@/lib/phone-auth-context";
import { AVATARS, getLevelInfo } from "@/lib/gamification";

export default function FriendsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { friends, addFriend, createChallenge, pendingInvites, activeChallenges } = useFriendChallenge();
  const { profile } = useProfile();
  const { phoneNumber } = usePhoneAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<"push-up" | "squat" | "running" | "jumping-jack" | "sit-up">("push-up");
  const [targetReps, setTargetReps] = useState("20");
  const [isCreating, setIsCreating] = useState(false);

  const exercises: Array<"push-up" | "squat" | "running" | "jumping-jack" | "sit-up"> = [
    "push-up",
    "squat",
    "running",
    "jumping-jack",
    "sit-up",
  ];

  const exerciseEmojis: Record<string, string> = {
    "push-up": "💪",
    squat: "🦵",
    running: "🏃",
    "jumping-jack": "🤸",
    "sit-up": "🫀",
  };

  const handleCreateChallenge = async () => {
    if (!selectedFriend || !phoneNumber) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsCreating(true);
    try {
      const friend = friends.find((f) => f.phone === selectedFriend);
      if (!friend) return;

      await createChallenge(
        phoneNumber,
        profile.name,
        profile.avatarId,
        selectedFriend,
        selectedExercise,
        parseInt(targetReps, 10)
      );

      setSelectedFriend(null);
      setTargetReps("20");
      setSelectedExercise("push-up");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.phone.includes(searchQuery)
  );

  const friendAvatar = friends.find((f) => f.phone === selectedFriend);
  const selectedFriendAvatar = friendAvatar ? AVATARS.find((a) => a.id === friendAvatar.avatarId) : null;

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <LinearGradient colors={["#FF6B35", "#FF8C42"]} style={styles.header}>
        <Text style={styles.headerTitle}>⚔️ Challenge a Friend</Text>
        <Text style={styles.headerSub}>Send a head-to-head workout challenge</Text>
      </LinearGradient>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            📬 Pending Invites ({pendingInvites.length})
          </Text>
          {pendingInvites.map((invite) => (
            <Pressable
              key={invite.id}
              onPress={() => router.push((`/challenge-invite/${invite.id}`) as any)}
              style={({ pressed }) => [
                styles.inviteCard,
                { backgroundColor: colors.surface, borderColor: "#FF6B35" },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.inviteEmoji}>{exerciseEmojis[invite.exerciseType]}</Text>
              <View style={styles.inviteInfo}>
                <Text style={[styles.inviteName, { color: colors.foreground }]}>
                  {invite.challengerName}
                </Text>
                <Text style={[styles.inviteChallenge, { color: colors.muted }]}>
                  {invite.targetReps} {invite.exerciseType}s
                </Text>
              </View>
              <Text style={styles.inviteArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            ⚡ Active Challenges ({activeChallenges.length})
          </Text>
          {activeChallenges.map((challenge) => {
            const isChallenger = challenge.challengerPhone === phoneNumber;
            const opponentName = isChallenger ? challenge.opponentName : challenge.challengerName;
            const myReps = isChallenger ? challenge.challengerReps : challenge.opponentReps;
            const theirReps = isChallenger ? challenge.opponentReps : challenge.challengerReps;
            const progress = (myReps / challenge.targetReps) * 100;

            return (
              <Pressable
                key={challenge.id}
                onPress={() => router.push((`/challenge-active/${challenge.id}`) as any)}
                style={({ pressed }) => [
                  styles.activeCard,
                  { backgroundColor: colors.surface, borderColor: "#22C55E" },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.activeHeader}>
                  <Text style={styles.activeEmoji}>{exerciseEmojis[challenge.exerciseType]}</Text>
                  <View style={styles.activeInfo}>
                    <Text style={[styles.activeName, { color: colors.foreground }]}>
                      vs {opponentName}
                    </Text>
                    <Text style={[styles.activeStatus, { color: colors.muted }]}>
                      {myReps} / {challenge.targetReps} reps
                    </Text>
                  </View>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(progress, 100)}%`, backgroundColor: "#22C55E" },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Friend Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>👥 Your Friends</Text>

        <TextInput
          placeholder="Search friends by name or phone..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.surface,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
        />

        {filteredFriends.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={[styles.emptyText, { color: colors.foreground }]}>
              {friends.length === 0 ? "No friends yet" : "No matches found"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.phone}
            scrollEnabled={false}
            renderItem={({ item: friend }) => {
              const isSelected = selectedFriend === friend.phone;
              const avatar = AVATARS.find((a) => a.id === friend.avatarId);
              const levelInfo = getLevelInfo(friend.xp);

              return (
                <Pressable
                  onPress={() => setSelectedFriend(isSelected ? null : friend.phone)}
                  style={({ pressed }) => [
                    styles.friendCard,
                    {
                      backgroundColor: isSelected ? "#FF6B3522" : colors.surface,
                      borderColor: isSelected ? "#FF6B35" : colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.friendAvatar}>{avatar?.emoji}</Text>
                  <View style={styles.friendInfo}>
                    <Text style={[styles.friendName, { color: colors.foreground }]}>
                      {friend.name}
                    </Text>
                    <Text style={[styles.friendLevel, { color: colors.muted }]}>
                      Level {levelInfo.current.level} • {friend.xp} XP
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.selectedCheck}>✓</Text>}
                </Pressable>
              );
            }}
          />
        )}
      </View>

      {/* Challenge Setup */}
      {selectedFriend && (
        <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: 16, padding: 16 }]}>
          <Text style={[styles.setupTitle, { color: colors.foreground }]}>Challenge Setup</Text>

          {/* Exercise Selection */}
          <Text style={[styles.setupLabel, { color: colors.muted }]}>Exercise</Text>
          <View style={styles.exerciseGrid}>
            {exercises.map((ex) => (
              <Pressable
                key={ex}
                onPress={() => setSelectedExercise(ex)}
                style={({ pressed }) => [
                  styles.exerciseButton,
                  {
                    backgroundColor: selectedExercise === ex ? "#FF6B35" : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.exerciseButtonEmoji}>{exerciseEmojis[ex]}</Text>
                <Text style={[styles.exerciseButtonLabel, { color: selectedExercise === ex ? "#FFF" : colors.foreground }]}>
                  {ex}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Target Reps */}
          <Text style={[styles.setupLabel, { color: colors.muted }]}>Target Reps</Text>
          <View style={styles.repsInput}>
            <Pressable
              onPress={() => setTargetReps(Math.max(5, parseInt(targetReps, 10) - 5).toString())}
              style={({ pressed }) => [styles.repsButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.repsButtonText}>−</Text>
            </Pressable>
            <TextInput
              value={targetReps}
              onChangeText={setTargetReps}
              keyboardType="number-pad"
              style={[
                styles.repsValue,
                { color: colors.foreground, borderColor: colors.border },
              ]}
            />
            <Pressable
              onPress={() => setTargetReps((parseInt(targetReps, 10) + 5).toString())}
              style={({ pressed }) => [styles.repsButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.repsButtonText}>+</Text>
            </Pressable>
          </View>

          {/* Send Challenge Button */}
          <Pressable
            onPress={handleCreateChallenge}
            disabled={isCreating}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && !isCreating && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <LinearGradient colors={["#FF6B35", "#FF4500"]} style={styles.sendButtonGrad}>
              {isCreating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.sendButtonText}>🚀 Send Challenge</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, borderRadius: 16, marginBottom: 20, gap: 4 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFF" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  inviteEmoji: { fontSize: 32, marginRight: 12 },
  inviteInfo: { flex: 1 },
  inviteName: { fontSize: 14, fontWeight: "600" },
  inviteChallenge: { fontSize: 12, marginTop: 2 },
  inviteArrow: { fontSize: 20, color: "#FF6B35" },
  activeCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  activeHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  activeEmoji: { fontSize: 28, marginRight: 12 },
  activeInfo: { flex: 1 },
  activeName: { fontSize: 14, fontWeight: "600" },
  activeStatus: { fontSize: 12, marginTop: 2 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  searchInput: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    fontSize: 14,
  },
  empty: { alignItems: "center", paddingVertical: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 14 },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  friendAvatar: { fontSize: 40, marginRight: 12 },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 14, fontWeight: "600" },
  friendLevel: { fontSize: 12, marginTop: 2 },
  selectedCheck: { fontSize: 20, color: "#FF6B35", fontWeight: "700" },
  setupTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  setupLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" },
  exerciseGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  exerciseButton: { flex: 0.31, aspectRatio: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  exerciseButtonEmoji: { fontSize: 24, marginBottom: 4 },
  exerciseButtonLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  repsInput: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  repsButton: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#FF6B35", alignItems: "center", justifyContent: "center" },
  repsButtonText: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  repsValue: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  sendButton: { borderRadius: 12, overflow: "hidden" },
  sendButtonGrad: { padding: 14, alignItems: "center" },
  sendButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
