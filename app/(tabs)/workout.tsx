import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  ScrollView,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useMotionDetector } from "@/hooks/use-motion-detector";
import { useVoiceCoach } from "@/hooks/use-voice-coach";
import { useRecoveryDetector } from "@/hooks/use-recovery-detector";
import { useProfile } from "@/lib/profile-context";
import { useWorkout } from "@/lib/workout-context";
import { GAME_CHALLENGES, AVATARS, getLevelInfo } from "@/lib/gamification";
import { PremiumGate, PremiumBadge } from "@/components/premium-gate";
import { useSubscription } from "@/lib/subscription-context";
import { EXERCISE_LABELS, EXERCISE_ICONS, type ExerciseType } from "@/lib/workout-store";

const EXERCISE_COLORS: Record<string, string> = {
  "push-up": "#FF6B35",
  squat: "#8B5CF6",
  "jumping-jack": "#06B6D4",
  "sit-up": "#F59E0B",
  running: "#22C55E",
  idle: "#687076",
};

type WorkoutTab = "workout" | "challenges";

export default function WorkoutScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isPremium } = useSubscription();
  const { profile, addRepsXP, updateQuestProgress } = useProfile();
  const { activeWorkout, startWorkout, updateCurrentExercise, finishWorkout } = useWorkout();

  const [tab, setTab] = useState<WorkoutTab>("workout");
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null);
  const [xpGained, setXpGained] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const repAnim = useRef(new Animated.Value(1)).current;
  const prevRepsRef = useRef(0);

  const isActive = !!activeWorkout;
  useKeepAwake();

  const { exercise, reps, confidence, motionData, resetReps } = useMotionDetector(isActive);
  const voiceCoach = useVoiceCoach(profile.voicePersona, profile.voiceEnabled && isActive);
  const recovery = useRecoveryDetector(isActive, exercise as ExerciseType);

  // Announce recovery prompts
  useEffect(() => {
    if (recovery.shouldPrompt && profile.voiceEnabled) {
      voiceCoach.announceIdle();
    }
  }, [recovery.shouldPrompt, profile.voiceEnabled, voiceCoach]);

  const exerciseColor = EXERCISE_COLORS[exercise] ?? "#687076";
  const avatar = AVATARS.find((a) => a.id === profile.avatarId) ?? AVATARS[0];
  const levelInfo = getLevelInfo(profile.xp);

  // Sync exercise to context
  useEffect(() => {
    if (isActive) {
      updateCurrentExercise(exercise as ExerciseType, reps);
    }
  }, [exercise, reps, isActive]);

  // Rep animation + haptic
  useEffect(() => {
    if (!isActive || reps === 0) return;
    if (reps > prevRepsRef.current) {
      prevRepsRef.current = reps;
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.sequence([
        Animated.timing(repAnim, { toValue: 1.35, duration: 80, useNativeDriver: true }),
        Animated.timing(repAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
      voiceCoach.announceRep(reps);
    }
  }, [reps, voiceCoach]);

  // Timer
  useEffect(() => {
    if (!isActive) {
      setElapsedMs(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - (activeWorkout?.startedAt ?? Date.now()));
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, activeWorkout?.startedAt, exercise]);

  const handleStart = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startWorkout();
    resetReps();
    prevRepsRef.current = 0;
    setXpGained(0);
    voiceCoach.announceStart();
  };

  const handleFinish = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const session = await finishWorkout();
    if (session) {
      // Award XP for total reps
      const result = await addRepsXP(session.totalReps, "mixed");
      const gained = session.totalReps * 2;
      setXpGained(gained);
      await updateQuestProgress(undefined, session.totalReps);
      if (result.leveledUp) {
        const newLevel = getLevelInfo(profile.xp + gained).current;
        setLevelUpMsg("🎉 Level Up! You're now " + newLevel.title + "!");
        setTimeout(() => setLevelUpMsg(null), 4000);
      }
      voiceCoach.announceFinish();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(("/session/" + session.id) as any);
    }
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m + ":" + String(s % 60).padStart(2, "0");
  };

  const motionBars = motionData
    ? [
        { label: "X", value: Math.abs(motionData.ax), color: "#EF4444" },
        { label: "Y", value: Math.abs(motionData.ay), color: "#22C55E" },
        { label: "Z", value: Math.abs(motionData.az), color: "#3B82F6" },
      ]
    : [];

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["workout", "challenges"] as WorkoutTab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && { borderBottomColor: "#FF6B35", borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabBtnText, { color: tab === t ? "#FF6B35" : colors.muted }]}>
              {t === "workout" ? "⚡ Workout" : "⚔️ Challenges"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ─── WORKOUT TAB ─── */}
      {tab === "workout" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {levelUpMsg && (
            <View style={styles.levelUpBanner}>
              <Text style={styles.levelUpText}>{levelUpMsg}</Text>
            </View>
          )}

          {isActive ? (
            <LinearGradient colors={["#0F0C29", "#1A1A2E"]} style={styles.activeCard}>
              <View style={styles.activeHeader}>
                <Text style={styles.timerText}>⏱ {formatTime(elapsedMs)}</Text>
                {xpGained > 0 && (
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpBadgeText}>+{xpGained} XP</Text>
                  </View>
                )}
              </View>

              <View style={[styles.exerciseBox, { borderColor: exerciseColor }]}>
                <Text style={styles.exerciseIcon}>
                  {EXERCISE_ICONS[exercise as keyof typeof EXERCISE_ICONS] ?? "🔍"}
                </Text>
                <Text style={[styles.exerciseName, { color: exerciseColor }]}>
                  {exercise === "idle" ? "Detecting..." : EXERCISE_LABELS[exercise as keyof typeof EXERCISE_LABELS]}
                </Text>
                <View style={styles.confBarBg}>
                  <View
                    style={[styles.confBarFill, { width: (confidence * 100 + "%") as any, backgroundColor: confidence > 0.6 ? "#34D399" : "#F59E0B" }]}
                  />
                </View>
                <Text style={styles.confLabel}>{Math.round(confidence * 100)}% confidence</Text>
              </View>

              <Animated.Text style={[styles.repCounter, { color: exerciseColor, transform: [{ scale: repAnim }] }]}>
                {reps}
              </Animated.Text>
              <Text style={styles.repLabel}>total reps</Text>

              {motionBars.length > 0 && (
                <View style={styles.motionBars}>
                  {motionBars.map((bar) => (
                    <View key={bar.label} style={styles.motionBarItem}>
                      <Text style={[styles.motionBarLabel, { color: bar.color }]}>{bar.label}</Text>
                      <View style={styles.motionBarBg}>
                        <View style={[styles.motionBarFill, { width: (Math.min(bar.value / 2, 1) * 100 + "%") as any, backgroundColor: bar.color }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {recovery.isResting && (
                <View style={[styles.recoveryBanner, { backgroundColor: "#F59E0B" }]}>
                  <Text style={styles.recoveryText}>⏸ Rest: {Math.floor(recovery.restDurationMs / 1000)}s</Text>
                  <Text style={styles.recoverySubtext}>Ready to continue?</Text>
                </View>
              )}

              {profile.voiceEnabled && (
                <View style={styles.voiceIndicator}>
                  <Text style={styles.voiceIndicatorText}>
                    🎙️ {profile.voicePersona === "drill" ? "Drill Sergeant" : profile.voicePersona === "zen" ? "Zen Master" : "Coach"} active
                  </Text>
                </View>
              )}

              <Pressable onPress={handleFinish} style={({ pressed }) => [styles.finishBtn, pressed && { opacity: 0.85 }]}>
                <LinearGradient colors={["#EF4444", "#DC2626"]} style={styles.finishBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.finishBtnText}>🏁  Finish Workout</Text>
                </LinearGradient>
              </Pressable>

              {/* Live sets log */}
              {activeWorkout && activeWorkout.sets.length > 0 && (
                <View style={[styles.setsCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }]}>
                  <Text style={[styles.setsTitle, { color: "rgba(255,255,255,0.8)" }]}>📋 Sets</Text>
                  {activeWorkout.sets.map((set, i) => (
                    <View key={i} style={[styles.setRow, { borderBottomColor: "rgba(255,255,255,0.1)" }]}>
                      <Text style={styles.setIcon}>{EXERCISE_ICONS[set.exercise as keyof typeof EXERCISE_ICONS] ?? "🏋️"}</Text>
                      <Text style={[styles.setName, { color: "rgba(255,255,255,0.8)" }]}>
                        {EXERCISE_LABELS[set.exercise as keyof typeof EXERCISE_LABELS] ?? set.exercise}
                      </Text>
                      <Text style={[styles.setReps, { color: "#FF6B35" }]}>{set.reps} reps</Text>
                    </View>
                  ))}
                </View>
              )}
            </LinearGradient>
          ) : (
            <LinearGradient colors={["#0F0C29", "#302B63"]} style={styles.startCard}>
              <Text style={styles.startCardEmoji}>{avatar.emoji}</Text>
              <Text style={styles.startCardTitle}>Ready to train?</Text>
              <Text style={styles.startCardSub}>
                {profile.voicePersona === "drill"
                  ? "Your Drill Sergeant is waiting. No excuses!"
                  : profile.voicePersona === "zen"
                  ? "Find your center. Begin your practice."
                  : "Your coach is ready. Let's crush it!"}
              </Text>
              <View style={styles.startCardLevel}>
                <Text style={[styles.startCardLevelText, { color: levelInfo.current.color }]}>
                  ⚡ {levelInfo.current.title} · {profile.xp} XP
                </Text>
              </View>
              <Pressable onPress={handleStart} style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}>
                <LinearGradient colors={["#FF6B35", "#FF4500"]} style={styles.startBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.startBtnText}>⚡  Start Workout</Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          )}
        </ScrollView>
      )}

      {/* ─── CHALLENGES TAB ─── */}
      {tab === "challenges" && (
        <PremiumGate
          featureName="Game Challenges"
          description="Boss battles, speed runs, and endurance modes to test your limits."
          icon="⚔️"
          unlocked={isPremium}
        >
        <FlatList
          data={GAME_CHALLENGES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.challengeList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: challenge }) => {
            const completed = profile.completedChallenges.includes(challenge.id);
            const diffColors: Record<string, string> = { easy: "#22C55E", medium: "#F59E0B", hard: "#EF4444", extreme: "#FFD700" };
            const dc = diffColors[challenge.difficulty];
            return (
              <Pressable
                onPress={() => router.push(("/challenge/" + challenge.id) as any)}
                style={({ pressed }) => [
                  styles.challengeCard,
                  { backgroundColor: colors.surface, borderColor: completed ? "#34D399" : colors.border },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
                <View style={styles.challengeInfo}>
                  <Text style={[styles.challengeTitle, { color: colors.foreground }]}>{challenge.title}</Text>
                  <Text style={[styles.challengeDesc, { color: colors.muted }]} numberOfLines={1}>{challenge.description}</Text>
                  <View style={styles.challengeMeta}>
                    <View style={[styles.diffBadge, { backgroundColor: dc + "22", borderColor: dc }]}>
                      <Text style={[styles.diffText, { color: dc }]}>{challenge.difficulty.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.challengeXP}>+{challenge.xpReward} XP</Text>
                    {challenge.timeLimitSeconds && (
                      <Text style={[styles.challengeTime, { color: colors.muted }]}>⏱ {challenge.timeLimitSeconds}s</Text>
                    )}
                  </View>
                </View>
                {completed ? (
                  <Text style={styles.completedCheck}>✅</Text>
                ) : (
                  <Text style={[styles.challengeArrow, { color: colors.muted }]}>›</Text>
                )}
              </Pressable>
            );
          }}
        />
        </PremiumGate>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabBtnText: { fontSize: 14, fontWeight: "700" },
  levelUpBanner: { margin: 16, padding: 14, borderRadius: 14, backgroundColor: "#FFD70033", alignItems: "center" },
  levelUpText: { color: "#FFD700", fontSize: 15, fontWeight: "800" },
  activeCard: { margin: 16, borderRadius: 20, padding: 20, alignItems: "center", gap: 12 },
  activeHeader: { flexDirection: "row", justifyContent: "space-between", width: "100%", alignItems: "center" },
  timerText: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  xpBadge: { backgroundColor: "#FFD70033", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  xpBadgeText: { color: "#FFD700", fontSize: 13, fontWeight: "800" },
  exerciseBox: { width: "100%", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 2, backgroundColor: "rgba(255,255,255,0.05)", gap: 6 },
  exerciseIcon: { fontSize: 36 },
  exerciseName: { fontSize: 20, fontWeight: "800" },
  confBarBg: { width: "60%", height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" },
  confBarFill: { height: "100%", borderRadius: 2 },
  confLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  repCounter: { fontSize: 88, fontWeight: "900", lineHeight: 100 },
  repLabel: { fontSize: 16, color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  motionBars: { width: "100%", gap: 6 },
  motionBarItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  motionBarLabel: { width: 14, fontSize: 12, fontWeight: "700" },
  motionBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
  motionBarFill: { height: "100%", borderRadius: 3 },
  recoveryBanner: { width: "100%", padding: 12, borderRadius: 12, alignItems: "center", gap: 4, marginBottom: 8 },
  recoveryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  recoverySubtext: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  voiceIndicator: { backgroundColor: "rgba(255,107,53,0.2)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  voiceIndicatorText: { color: "#FF6B35", fontSize: 12, fontWeight: "600" },
  finishBtn: { width: "100%", borderRadius: 14, overflow: "hidden", marginTop: 4 },
  finishBtnGrad: { padding: 16, alignItems: "center" },
  finishBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  startCard: { margin: 16, borderRadius: 20, padding: 28, alignItems: "center", gap: 12 },
  startCardEmoji: { fontSize: 56 },
  startCardTitle: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  startCardSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 20 },
  startCardLevel: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  startCardLevelText: { fontSize: 13, fontWeight: "700" },
  startBtn: { width: "100%", borderRadius: 14, overflow: "hidden", marginTop: 4 },
  startBtnGrad: { padding: 18, alignItems: "center" },
  startBtnText: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  setsCard: { width: "100%", borderRadius: 12, borderWidth: 1, padding: 12, gap: 4, marginTop: 8 },
  setsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  setRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 0.5, gap: 10 },
  setIcon: { fontSize: 16 },
  setName: { flex: 1, fontSize: 13, fontWeight: "600" },
  setReps: { fontSize: 13, fontWeight: "700" },
  challengeList: { padding: 16, gap: 10 },
  challengeCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1.5, gap: 12 },
  challengeEmoji: { fontSize: 32 },
  challengeInfo: { flex: 1, gap: 5 },
  challengeTitle: { fontSize: 15, fontWeight: "700" },
  challengeDesc: { fontSize: 12, lineHeight: 16 },
  challengeMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  diffBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  diffText: { fontSize: 10, fontWeight: "800" },
  challengeXP: { fontSize: 12, color: "#FFD700", fontWeight: "700" },
  challengeTime: { fontSize: 12 },
  completedCheck: { fontSize: 22 },
  challengeArrow: { fontSize: 24, fontWeight: "300" },
});
