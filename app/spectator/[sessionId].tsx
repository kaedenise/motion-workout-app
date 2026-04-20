/**
 * Spectator Screen
 * 
 * Watch a friend's live workout in real-time.
 * Shows exercise, reps, timer, and live reactions.
 */

import { View, Text, Pressable, StyleSheet, ScrollView, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSpectator, type LiveSession } from "@/lib/spectator-context";
import { AVATARS, getLevelInfo } from "@/lib/gamification";
import { EXERCISE_LABELS, EXERCISE_ICONS, type ExerciseType } from "@/lib/workout-store";

const EXERCISE_COLORS: Record<string, string> = {
  "push-up": "#FF6B35",
  squat: "#8B5CF6",
  "jumping-jack": "#06B6D4",
  "sit-up": "#F59E0B",
  running: "#22C55E",
  idle: "#687076",
};

const REACTION_EMOJIS = ["🔥", "💪", "👏", "🎉", "⚡", "🏆"];

export default function SpectatorScreen() {
  const colors = useColors();
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { watchingSession, startWatching, stopWatching, sendReaction, reactions, viewerCount, pollLiveSession } =
    useSpectator();

  const [session, setSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize spectating
  useEffect(() => {
    if (!sessionId) return;

    const init = async () => {
      await startWatching(sessionId);
      setIsLoading(false);
    };

    init();

    return () => {
      stopWatching();
    };
  }, [sessionId, startWatching, stopWatching]);

  // Poll for live updates every 500ms
  useEffect(() => {
    if (!sessionId) return;

    pollIntervalRef.current = setInterval(async () => {
      const updated = await pollLiveSession(sessionId);
      if (updated) {
        setSession(updated);
      } else {
        // Session ended
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
    }, 500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [sessionId, pollLiveSession]);

  // Use watching session or polled session
  const displaySession = session || watchingSession;

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <Text style={[styles.loadingText, { color: colors.foreground }]}>Loading live session...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!displaySession) {
    return (
      <ScreenContainer>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📡</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Session not found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>This workout is no longer live.</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.backBtnText}>← Go Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const avatar = AVATARS.find((a) => a.id === displaySession.broadcasterAvatar) ?? AVATARS[0];
  const levelInfo = getLevelInfo(displaySession.broadcasterLevel * 1000); // Estimate XP from level
  const exerciseColor = EXERCISE_COLORS[displaySession.exercise] ?? "#687076";
  const exerciseLabel = EXERCISE_LABELS[displaySession.exercise as keyof typeof EXERCISE_LABELS] ?? "Detecting...";

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m + ":" + String(s % 60).padStart(2, "0");
  };

  const handleReaction = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendReaction(emoji);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleClose} style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <Text style={styles.closeBtn}>✕</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Live Spectator</Text>
        </View>
        <View style={styles.viewerBadge}>
          <Text style={styles.viewerText}>👁 {viewerCount}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Broadcaster Info */}
        <LinearGradient colors={["#0F0C29", "#1A1A2E"]} style={styles.broadcasterCard}>
          <View style={styles.broadcasterRow}>
            <View style={[styles.avatarCircle, { borderColor: avatar.color }]}>
              <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
            </View>
            <View style={styles.broadcasterInfo}>
              <Text style={[styles.broadcasterName, { color: colors.foreground }]}>
                {displaySession.broadcasterName}
              </Text>
              <Text style={[styles.broadcasterLevel, { color: levelInfo.current.color }]}>
                Lv{levelInfo.current.level} {levelInfo.current.title}
              </Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>⏱ {formatTime(displaySession.elapsedMs)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Exercise Display */}
        <View style={[styles.exerciseCard, { borderColor: exerciseColor }]}>
          <Text style={styles.exerciseIcon}>
            {EXERCISE_ICONS[displaySession.exercise as keyof typeof EXERCISE_ICONS] ?? "🔍"}
          </Text>
          <Text style={[styles.exerciseName, { color: exerciseColor }]}>{exerciseLabel}</Text>

          {/* Rep Counter */}
          <View style={styles.repCounter}>
            <Text style={styles.repValue}>{displaySession.reps}</Text>
            <Text style={[styles.repLabel, { color: colors.muted }]}>reps</Text>
          </View>

          {/* Confidence Bar */}
          <View style={styles.confBarBg}>
            <View
              style={[
                styles.confBarFill,
                {
                  width: (displaySession.confidence * 100 + "%") as any,
                  backgroundColor: displaySession.confidence > 0.6 ? "#34D399" : "#F59E0B",
                },
              ]}
            />
          </View>
          <Text style={styles.confLabel}>{Math.round(displaySession.confidence * 100)}% confidence</Text>
        </View>

        {/* Reactions */}
        <View style={styles.reactionsSection}>
          <Text style={[styles.reactionsTitle, { color: colors.foreground }]}>Send Reaction</Text>
          <View style={styles.reactionGrid}>
            {REACTION_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => handleReaction(emoji)}
                style={({ pressed }) => [styles.reactionBtn, pressed && { transform: [{ scale: 0.9 }] }]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Live Reactions Feed */}
        {reactions.length > 0 && (
          <View style={styles.reactionsFeed}>
            <FlatList
              data={reactions}
              keyExtractor={(item) => item.timestamp.toString()}
              renderItem={({ item }) => <Text style={styles.feedReaction}>{item.emoji}</Text>}
              horizontal
              scrollEnabled={false}
              contentContainerStyle={styles.feedContainer}
            />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeBtn: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  viewerBadge: {
    backgroundColor: "rgba(255, 107, 53, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF6B35",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  backBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  broadcasterCard: {
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  broadcasterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 24,
  },
  broadcasterInfo: {
    flex: 1,
    gap: 2,
  },
  broadcasterName: {
    fontSize: 15,
    fontWeight: "700",
  },
  broadcasterLevel: {
    fontSize: 12,
    fontWeight: "600",
  },
  timerBadge: {
    backgroundColor: "rgba(255, 107, 53, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF6B35",
  },
  exerciseCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  exerciseIcon: {
    fontSize: 48,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "700",
  },
  repCounter: {
    alignItems: "center",
    gap: 4,
    marginVertical: 8,
  },
  repValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FF6B35",
  },
  repLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  confBarBg: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 8,
  },
  confBarFill: {
    height: "100%",
  },
  confLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  reactionsSection: {
    gap: 12,
  },
  reactionsTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  reactionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reactionBtn: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.3)",
  },
  reactionEmoji: {
    fontSize: 28,
  },
  reactionsFeed: {
    marginTop: 12,
  },
  feedContainer: {
    gap: 8,
    paddingVertical: 8,
  },
  feedReaction: {
    fontSize: 32,
  },
});
