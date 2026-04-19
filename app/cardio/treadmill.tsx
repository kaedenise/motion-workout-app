import { View, Text, Pressable, StyleSheet, Platform, Animated } from "react-native";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useMotionDetector } from "@/hooks/use-motion-detector";
import { useVoiceCoach } from "@/hooks/use-voice-coach";
import { useProfile } from "@/lib/profile-context";
import { estimateTreadmillDistance, calculateCalories, getCardioChallengeDifficulty } from "@/lib/cardio-games";

type Difficulty = "easy" | "medium" | "hard" | "extreme";

export default function TreadmillScreen() {
  const colors = useColors();
  const router = useRouter();
  useKeepAwake();

  const { profile, addRepsXP } = useProfile();
  const motionDetector = useMotionDetector(true);
  const voiceCoach = useVoiceCoach(profile.voicePersona, true);

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameStarted, setGameStarted] = useState(false);
  const [distance, setDistance] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [calories, setCalories] = useState(0);

  const accelBuffer = useRef<number[]>([]);
  const startTimeRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const config = getCardioChallengeDifficulty("treadmill", difficulty);
  const progress = (distance / config.target) * 100;
  const isComplete = distance >= config.target;

  // Process motion data
  useEffect(() => {
    if (!gameStarted) return;

    // In a real app, we'd collect raw accelerometer data
    // For now, we'll simulate based on motion detection
    if (motionDetector.exercise !== "idle") {
      accelBuffer.current.push(motionDetector.confidence * 2);
    }

    // Update every 1 second
    const now = Date.now();
    if (now - lastUpdateRef.current > 1000) {
      lastUpdateRef.current = now;

      const { distance: newDistance, stepCount: newSteps, avgSpeed } = estimateTreadmillDistance(
        accelBuffer.current,
        20
      );

      const elapsed = (now - startTimeRef.current) / 1000;
      const newCalories = calculateCalories("treadmill", newDistance, 0, elapsed);

      setDistance(newDistance);
      setStepCount(newSteps);
      setSpeed(avgSpeed);
      setElapsedMs(elapsed * 1000);
      setCalories(newCalories);

      // Celebrate milestones
      if (newSteps > 0 && newSteps % 50 === 0) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        voiceCoach.announceRep(newSteps);
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
      }

      // Check if complete
      if (isComplete && !gameStarted) {
        handleComplete();
      }
    }
  }, [motionDetector, gameStarted]);

  const handleStart = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGameStarted(true);
    startTimeRef.current = Date.now();
    accelBuffer.current = [];
    voiceCoach.announceStart();
  };

  const handleComplete = async () => {
    setGameStarted(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    voiceCoach.announceFinish();
    await addRepsXP(config.xpReward, "treadmill");
    router.push(("/cardio-result") as any);
  };

  const handleQuit = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGameStarted(false);
    router.back();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <ScreenContainer className="p-4">
      {!gameStarted ? (
        // Pre-game setup
        <View style={styles.setup}>
          <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.header}>
            <Text style={styles.headerEmoji}>🏃</Text>
            <Text style={styles.headerTitle}>Treadmill Challenge</Text>
            <Text style={styles.headerSub}>Run as far as you can</Text>
          </LinearGradient>

          {/* Difficulty Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>Difficulty</Text>
            <View style={styles.difficultyGrid}>
              {(["easy", "medium", "hard", "extreme"] as Difficulty[]).map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDifficulty(d)}
                  style={({ pressed }) => [
                    styles.diffButton,
                    {
                      backgroundColor: difficulty === d ? "#22C55E" : colors.surface,
                      borderColor: difficulty === d ? "#22C55E" : colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[styles.diffLabel, { color: difficulty === d ? "#FFF" : colors.foreground }]}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                  <Text style={[styles.diffTarget, { color: difficulty === d ? "rgba(255,255,255,0.8)" : colors.muted }]}>
                    {config.target} mi
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Challenge Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Target Distance</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{config.target} miles</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Time Limit</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{Math.floor(config.timeLimit / 60)} min</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>XP Reward</Text>
              <Text style={[styles.infoValue, { color: "#22C55E", fontWeight: "700" }]}>+{config.xpReward} XP</Text>
            </View>
          </View>

          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [styles.startButton, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.startButtonGrad}>
              <Text style={styles.startButtonText}>🏃 Start Running</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        // In-game
        <View style={styles.game}>
          {/* Distance Display */}
          <Animated.View style={[styles.distanceCard, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.distanceGrad}>
              <Text style={styles.distanceValue}>{distance.toFixed(2)}</Text>
              <Text style={styles.distanceUnit}>miles</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(progress, 100)}%`, backgroundColor: "#FFF" },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
            </LinearGradient>
          </Animated.View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Steps</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stepCount}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Speed</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{speed.toFixed(1)} mph</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Time</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{formatTime(elapsedMs)}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Calories</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{calories}</Text>
            </View>
          </View>

          {/* Quit Button */}
          <Pressable
            onPress={handleQuit}
            style={({ pressed }) => [styles.quitButton, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.quitButtonText, { color: colors.muted }]}>⊗ Quit</Text>
          </Pressable>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  setup: { flex: 1, justifyContent: "center" },
  header: { padding: 24, borderRadius: 16, alignItems: "center", marginBottom: 24, gap: 8 },
  headerEmoji: { fontSize: 48 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#FFF" },
  headerSub: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  difficultyGrid: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  diffButton: { flex: 0.48, borderRadius: 12, borderWidth: 2, padding: 12, alignItems: "center" },
  diffLabel: { fontSize: 14, fontWeight: "700" },
  diffTarget: { fontSize: 12, marginTop: 4 },
  infoCard: { borderRadius: 12, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: "700" },
  startButton: { borderRadius: 12, overflow: "hidden" },
  startButtonGrad: { padding: 16, alignItems: "center" },
  startButtonText: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  game: { flex: 1, justifyContent: "space-between" },
  distanceCard: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  distanceGrad: { padding: 24, alignItems: "center" },
  distanceValue: { fontSize: 56, fontWeight: "800", color: "#FFF" },
  distanceUnit: { fontSize: 16, color: "rgba(255,255,255,0.9)", marginBottom: 12 },
  progressBar: { width: "100%", height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.3)", overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  statCard: { flex: 0.48, borderRadius: 12, padding: 12, alignItems: "center" },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: "700", marginTop: 4 },
  quitButton: { padding: 12, alignItems: "center" },
  quitButtonText: { fontSize: 14, fontWeight: "600" },
});
