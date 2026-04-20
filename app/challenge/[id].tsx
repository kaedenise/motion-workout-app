import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useMotionDetector } from "@/hooks/use-motion-detector";
import { useVoiceCoach } from "@/hooks/use-voice-coach";
import { useProfile } from "@/lib/profile-context";
import { GAME_CHALLENGES } from "@/lib/gamification";

const DIFFICULTY_COLORS: Record<string, string[]> = {
  easy: ["#22C55E", "#16A34A"],
  medium: ["#F59E0B", "#D97706"],
  hard: ["#EF4444", "#DC2626"],
  extreme: ["#FFD700", "#FF6B35"],
};

export default function ChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { profile, completeChallenge, addXP } = useProfile();

  useKeepAwake();

  const challenge = GAME_CHALLENGES.find((c) => c.id === id);

  const [phase, setPhase] = useState<"intro" | "active" | "complete" | "failed">("intro");
  const [reps, setReps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(challenge?.timeLimitSeconds ?? 0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const repAnim = useRef(new Animated.Value(1)).current;

  const { exercise: currentExercise, reps: repCount, confidence } = useMotionDetector(phase === "active" ? true : false);

  const voiceCoach = useVoiceCoach(profile.voicePersona, profile.voiceEnabled);

  // Sync reps from motion detector
  useEffect(() => {
    if (phase !== "active") return;
    const newReps = repCount;
    if (newReps > reps) {
      setReps(newReps);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      voiceCoach.announceRep(newReps);

      // Animate rep counter
      Animated.sequence([
        Animated.timing(repAnim, { toValue: 1.4, duration: 80, useNativeDriver: true }),
        Animated.timing(repAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();

      // Check completion
      if (challenge && newReps >= challenge.targetReps) {
        handleComplete();
      }
    }
  }, [repCount, phase]);

  // Announce exercise change
  useEffect(() => {
    if (phase === "active") {
      voiceCoach.announceExercise(currentExercise);
    }
  }, [currentExercise, phase]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "active" || !challenge?.timeLimitSeconds) return;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, (challenge.timeLimitSeconds ?? 0) * 1000 - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));
      setElapsedMs(elapsed);

      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        if (reps < (challenge.targetReps ?? 0)) {
          handleFail();
        }
      }
    }, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Elapsed timer (no time limit)
  useEffect(() => {
    if (phase !== "active" || challenge?.timeLimitSeconds) return;

    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleStart = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startTimeRef.current = Date.now();
    setPhase("active");
    voiceCoach.announceStart();
  };

  const handleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("complete");
    voiceCoach.announceFinish();
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (challenge) {
      completeChallenge(challenge.id, challenge.xpReward);
    }
  };

  const handleFail = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("failed");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    // Still award partial XP
    if (reps > 0) addXP(reps * 1);
  };

  if (!challenge) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.foreground }}>Challenge not found</Text>
      </ScreenContainer>
    );
  }

  const gradientColors = DIFFICULTY_COLORS[challenge.difficulty] as [string, string];
  const progressPct = Math.min(reps / challenge.targetReps, 1);
  const alreadyCompleted = profile.completedChallenges.includes(challenge.id);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}:${String(s % 60).padStart(2, "0")}` : `${s}s`;
  };

  return (
    <LinearGradient colors={["#0F0C29", "#1A1A2E"]} style={{ flex: 1 }}>
      <ScreenContainer containerClassName="bg-transparent">
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.backText}>✕</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>{challenge.emoji}</Text>
            <Text style={styles.headerTitle}>{challenge.title}</Text>
          </View>
          <View style={[styles.diffBadge, { backgroundColor: gradientColors[0] + "33", borderColor: gradientColors[0] }]}>
            <Text style={[styles.diffText, { color: gradientColors[0] }]}>
              {challenge.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ─── INTRO ─── */}
        {phase === "intro" && (
          <View style={styles.centerContent}>
            <Text style={styles.bigEmoji}>{challenge.emoji}</Text>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <Text style={styles.challengeDesc}>{challenge.description}</Text>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { borderColor: gradientColors[0] }]}>
                <Text style={[styles.statVal, { color: gradientColors[0] }]}>
                  {challenge.targetReps}
                </Text>
                <Text style={styles.statLbl}>Target Reps</Text>
              </View>
              {challenge.timeLimitSeconds && (
                <View style={[styles.statBox, { borderColor: "#8B5CF6" }]}>
                  <Text style={[styles.statVal, { color: "#8B5CF6" }]}>
                    {challenge.timeLimitSeconds}s
                  </Text>
                  <Text style={styles.statLbl}>Time Limit</Text>
                </View>
              )}
              <View style={[styles.statBox, { borderColor: "#FFD700" }]}>
                <Text style={[styles.statVal, { color: "#FFD700" }]}>
                  +{challenge.xpReward}
                </Text>
                <Text style={styles.statLbl}>XP Reward</Text>
              </View>
            </View>

            {alreadyCompleted && (
              <View style={styles.completedBanner}>
                <Text style={styles.completedBannerText}>✅ Already completed! Replay for fun.</Text>
              </View>
            )}

            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={gradientColors}
                style={styles.startBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.startBtnText}>⚔️  Start Challenge</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* ─── ACTIVE ─── */}
        {phase === "active" && (
          <View style={styles.activeContent}>
            {/* Timer */}
            {challenge.timeLimitSeconds ? (
              <View style={styles.timerBox}>
                <Text
                  style={[
                    styles.timerText,
                    { color: timeLeft <= 10 ? "#EF4444" : "#FFFFFF" },
                  ]}
                >
                  ⏱ {timeLeft}s
                </Text>
                {/* Time bar */}
                <View style={styles.timeBarBg}>
                  <View
                    style={[
                      styles.timeBarFill,
                      {
                        width: `${(timeLeft / (challenge.timeLimitSeconds ?? 1)) * 100}%`,
                        backgroundColor: timeLeft <= 10 ? "#EF4444" : gradientColors[0],
                      },
                    ]}
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.elapsedText}>⏱ {formatTime(elapsedMs)}</Text>
            )}

            {/* Exercise detected */}
            <View style={styles.exerciseBox}>
              <Text style={styles.exerciseDetected}>
                {currentExercise === "idle" ? "🔍 Detecting..." : `🎯 ${currentExercise.replace("-", " ").toUpperCase()}`}
              </Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${confidence * 100}%`,
                      backgroundColor: confidence > 0.6 ? "#34D399" : "#F59E0B",
                    },
                  ]}
                />
              </View>
            </View>

            {/* Rep Counter */}
            <Animated.Text
              style={[
                styles.repCounter,
                { color: gradientColors[0], transform: [{ scale: repAnim }] },
              ]}
            >
              {reps}
            </Animated.Text>
            <Text style={styles.repLabel}>/ {challenge.targetReps} reps</Text>

            {/* Progress Ring (simple bar) */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPct * 100}%`,
                    backgroundColor: gradientColors[0],
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPct}>{Math.round(progressPct * 100)}%</Text>

            <Pressable
              onPress={handleFail}
              style={({ pressed }) => [styles.giveUpBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.giveUpText}>Give Up</Text>
            </Pressable>
          </View>
        )}

        {/* ─── COMPLETE ─── */}
        {phase === "complete" && (
          <View style={styles.centerContent}>
            <Text style={styles.resultEmoji}>🏆</Text>
            <Text style={styles.resultTitle}>Challenge Complete!</Text>
            <Text style={styles.resultSubtitle}>
              {reps} reps in {formatTime(elapsedMs)}
            </Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>+{challenge.xpReward} XP</Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={["#34D399", "#059669"]}
                style={styles.doneBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.doneBtnText}>🎉  Back to Training</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* ─── FAILED ─── */}
        {phase === "failed" && (
          <View style={styles.centerContent}>
            <Text style={styles.resultEmoji}>💀</Text>
            <Text style={[styles.resultTitle, { color: "#EF4444" }]}>Time's Up!</Text>
            <Text style={styles.resultSubtitle}>
              You got {reps} / {challenge.targetReps} reps
            </Text>
            {reps > 0 && (
              <View style={[styles.xpBadge, { backgroundColor: "#EF444433" }]}>
                <Text style={[styles.xpBadgeText, { color: "#EF4444" }]}>
                  +{reps} XP (partial)
                </Text>
              </View>
            )}
            <View style={styles.failBtns}>
              <Pressable
                onPress={() => {
                  setReps(0);
                  setPhase("intro");
                  voiceCoach.reset();
                }}
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={gradientColors}
                  style={styles.retryBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.retryBtnText}>🔄  Try Again</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.exitBtnText}>Exit</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { padding: 8 },
  backText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerEmoji: { fontSize: 20 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  diffText: { fontSize: 11, fontWeight: "800" },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  bigEmoji: { fontSize: 72, marginBottom: 8 },
  challengeTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  challengeDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 8,
  },
  statBox: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  statVal: { fontSize: 22, fontWeight: "800" },
  statLbl: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  completedBanner: {
    backgroundColor: "#34D39933",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  completedBannerText: { color: "#34D399", fontSize: 13, fontWeight: "600" },
  startBtn: { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 8 },
  startBtnGrad: { padding: 18, alignItems: "center" },
  startBtnText: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  activeContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  timerBox: { alignItems: "center", width: "100%", gap: 8 },
  timerText: { fontSize: 36, fontWeight: "900" },
  timeBarBg: {
    width: "80%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  timeBarFill: { height: "100%", borderRadius: 3 },
  elapsedText: { fontSize: 24, color: "rgba(255,255,255,0.7)", fontWeight: "700" },
  exerciseBox: { alignItems: "center", gap: 6, width: "100%" },
  exerciseDetected: { fontSize: 18, color: "#FFFFFF", fontWeight: "700" },
  confidenceBar: {
    width: "60%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  confidenceFill: { height: "100%", borderRadius: 2 },
  repCounter: { fontSize: 96, fontWeight: "900", lineHeight: 110 },
  repLabel: { fontSize: 18, color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  progressBarBg: {
    width: "80%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    marginTop: 8,
  },
  progressBarFill: { height: "100%", borderRadius: 5 },
  progressPct: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  giveUpBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  giveUpText: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  resultEmoji: { fontSize: 80, marginBottom: 8 },
  resultTitle: { fontSize: 28, fontWeight: "900", color: "#FFFFFF", textAlign: "center" },
  resultSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  xpBadge: {
    backgroundColor: "#FFD70033",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  xpBadgeText: { color: "#FFD700", fontSize: 20, fontWeight: "800" },
  doneBtn: { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 8 },
  doneBtnGrad: { padding: 18, alignItems: "center" },
  doneBtnText: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  failBtns: { width: "100%", gap: 10 },
  retryBtn: { width: "100%", borderRadius: 16, overflow: "hidden" },
  retryBtnGrad: { padding: 18, alignItems: "center" },
  retryBtnText: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  exitBtn: {
    padding: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  exitBtnText: { color: "rgba(255,255,255,0.5)", fontSize: 15 },
});
