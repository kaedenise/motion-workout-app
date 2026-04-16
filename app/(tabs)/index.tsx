import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useProfile } from "@/lib/profile-context";
import { useWorkout } from "@/lib/workout-context";
import {
  AVATARS,
  GAME_CHALLENGES,
  QUEST_POOL,
  getLevelInfo,
  type DailyQuest,
} from "@/lib/gamification";

const { width } = Dimensions.get("window");

const ONBOARDING_KEY = "motionfit_onboarding_done";

const EXERCISE_TIPS: Record<string, { emoji: string; tip: string; placement: string }> = {
  "push-up": { emoji: "💪", tip: "Place phone flat on floor near you", placement: "Floor, face-down" },
  squat: { emoji: "🦵", tip: "Hold phone in hand or pocket", placement: "Hand or pocket" },
  "jumping-jack": { emoji: "🙌", tip: "Hold phone in hand while jumping", placement: "In hand" },
  "sit-up": { emoji: "🧘", tip: "Place phone on chest or hold it", placement: "On chest" },
  running: { emoji: "🏃", tip: "Hold phone or place in arm band", placement: "Arm band" },
};

function XPMiniBar({ xp }: { xp: number }) {
  const { current, progress } = getLevelInfo(xp);
  return (
    <View style={styles.xpMini}>
      <View style={styles.xpMiniBarBg}>
        <View
          style={[
            styles.xpMiniBarFill,
            { width: `${progress * 100}%`, backgroundColor: current.color },
          ]}
        />
      </View>
      <Text style={[styles.xpMiniLabel, { color: current.color }]}>
        Lv{current.level}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profile } = useProfile();
  const { sessions } = useWorkout();
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);

  const avatar = AVATARS.find((a) => a.id === profile.avatarId) ?? AVATARS[0];
  const levelInfo = getLevelInfo(profile.xp);
  const totalReps = sessions.reduce((s, w) => s + w.totalReps, 0);
  const totalCalories = sessions.reduce((s, w) => s + w.caloriesBurned, 0);
  const recentSessions = sessions.slice(0, 3);

  // Check onboarding
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (val !== "1") {
        router.replace("/onboarding" as any);
      }
      setCheckedOnboarding(true);
    });
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayQuests = QUEST_POOL.slice(0, 3);

  const getQuestProgress = (quest: DailyQuest) => {
    if (profile.lastQuestDate !== today) return 0;
    const key = `ex_${quest.exerciseType ?? "total"}`;
    return Math.min(profile.questProgress[key] ?? 0, quest.targetReps);
  };

  const handleStartWorkout = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(tabs)/workout" as any);
  };

  const handleChallenge = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/challenge/${id}` as any);
  };

  if (!checkedOnboarding) return null;

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* ─── Hero Header ─── */}
        <LinearGradient colors={["#0F0C29", "#302B63", "#1A1A2E"]} style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroGreeting}>
              <Text style={styles.heroGreetText}>{greeting},</Text>
              <Text style={styles.heroName}>{profile.name} {avatar.emoji}</Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/profile" as any)}
              style={({ pressed }) => [styles.avatarBtn, { borderColor: avatar.color }, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.avatarBtnEmoji}>{avatar.emoji}</Text>
            </Pressable>
          </View>

          {/* Level & XP */}
          <View style={[styles.levelRow, { backgroundColor: levelInfo.current.color + "22", borderColor: levelInfo.current.color }]}>
            <Text style={[styles.levelTitle, { color: levelInfo.current.color }]}>
              ⚡ {levelInfo.current.title}
            </Text>
            <XPMiniBar xp={profile.xp} />
            <Text style={[styles.levelXP, { color: "rgba(255,255,255,0.6)" }]}>
              {profile.xp} XP
            </Text>
          </View>

          {/* Streak */}
          {profile.currentStreak > 0 && (
            <View style={styles.streakBanner}>
              <Text style={styles.streakBannerText}>
                🔥 {profile.currentStreak}-day streak! Keep it up!
              </Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {[
              { label: "Workouts", value: sessions.length, color: "#FF6B35" },
              { label: "Total Reps", value: totalReps, color: "#8B5CF6" },
              { label: "Calories", value: totalCalories, color: "#EF4444" },
              { label: "Challenges", value: profile.completedChallenges.length, color: "#FFD700" },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ─── Start Workout CTA ─── */}
        <View style={styles.ctaContainer}>
          <Pressable
            onPress={handleStartWorkout}
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }]}
          >
            <LinearGradient
              colors={["#FF6B35", "#FF4500"]}
              style={styles.ctaBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.ctaBtnText}>⚡  Start Workout</Text>
              <Text style={styles.ctaBtnSub}>Motion detection ready</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ─── Daily Quests ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            📋 Daily Quests
          </Text>
          <View style={styles.questList}>
            {todayQuests.map((quest) => {
              const progress = getQuestProgress(quest);
              const pct = Math.min(progress / quest.targetReps, 1);
              const done = pct >= 1;
              return (
                <View
                  key={quest.id}
                  style={[
                    styles.questCard,
                    {
                      backgroundColor: done ? "#34D39922" : colors.surface,
                      borderColor: done ? "#34D399" : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.questEmoji}>{quest.emoji}</Text>
                  <View style={styles.questInfo}>
                    <Text style={[styles.questTitle, { color: colors.foreground }]}>
                      {quest.title}
                    </Text>
                    <View style={styles.questBarBg}>
                      <View
                        style={[
                          styles.questBarFill,
                          {
                            width: `${pct * 100}%`,
                            backgroundColor: done ? "#34D399" : "#FF6B35",
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.questProgress, { color: colors.muted }]}>
                      {progress} / {quest.targetReps} reps
                    </Text>
                  </View>
                  <View style={styles.questReward}>
                    <Text style={styles.questXP}>+{quest.xpReward}</Text>
                    <Text style={[styles.questXPLabel, { color: colors.muted }]}>XP</Text>
                  </View>
                  {done && <Text style={styles.questDone}>✅</Text>}
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── Challenges ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              ⚔️ Challenges
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/workout" as any)}>
              <Text style={[styles.seeAll, { color: "#FF6B35" }]}>See all →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.challengeRow}>
            {GAME_CHALLENGES.slice(0, 6).map((challenge) => {
              const completed = profile.completedChallenges.includes(challenge.id);
              const diffColors: Record<string, string> = {
                easy: "#22C55E",
                medium: "#F59E0B",
                hard: "#EF4444",
                extreme: "#FFD700",
              };
              const dc = diffColors[challenge.difficulty];
              return (
                <Pressable
                  key={challenge.id}
                  onPress={() => handleChallenge(challenge.id)}
                  style={({ pressed }) => [
                    styles.challengeCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: completed ? "#34D399" : colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
                  <Text style={[styles.challengeTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {challenge.title}
                  </Text>
                  <View style={[styles.challengeDiff, { backgroundColor: dc + "22", borderColor: dc }]}>
                    <Text style={[styles.challengeDiffText, { color: dc }]}>
                      {challenge.difficulty.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.challengeXP}>+{challenge.xpReward} XP</Text>
                  {completed && <Text style={styles.challengeDone}>✅</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Exercise Guide ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            📱 Phone Placement Guide
          </Text>
          <View style={styles.guideList}>
            {Object.entries(EXERCISE_TIPS).map(([ex, tip]) => (
              <View
                key={ex}
                style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={styles.guideEmoji}>{tip.emoji}</Text>
                <View style={styles.guideInfo}>
                  <Text style={[styles.guideName, { color: colors.foreground }]}>
                    {ex.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <Text style={[styles.guideTip, { color: colors.muted }]}>{tip.tip}</Text>
                  <View style={[styles.guidePlacement, { backgroundColor: "#FF6B3522" }]}>
                    <Text style={styles.guidePlacementText}>📍 {tip.placement}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Recent Workouts ─── */}
        {recentSessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                📜 Recent Workouts
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/history" as any)}>
                <Text style={[styles.seeAll, { color: "#FF6B35" }]}>All →</Text>
              </Pressable>
            </View>
            {recentSessions.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => router.push(`/session/${session.id}` as any)}
                style={({ pressed }) => [
                  styles.recentCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.recentLeft}>
                  <Text style={[styles.recentDate, { color: colors.muted }]}>
                    {new Date(session.startedAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Text style={[styles.recentReps, { color: colors.foreground }]}>
                    {session.totalReps} reps · {session.caloriesBurned} cal
                  </Text>
                </View>
                <Text style={[styles.recentDuration, { color: "#FF6B35" }]}>
                  {Math.round(session.durationMs / 60000)}m
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 20,
    gap: 12,
    paddingBottom: 24,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroGreeting: { gap: 2 },
  heroGreetText: { fontSize: 14, color: "rgba(255,255,255,0.6)" },
  heroName: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBtnEmoji: { fontSize: 22 },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelTitle: { fontSize: 13, fontWeight: "700" },
  xpMini: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  xpMiniBarBg: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  xpMiniBarFill: { height: "100%", borderRadius: 3 },
  xpMiniLabel: { fontSize: 11, fontWeight: "700" },
  levelXP: { fontSize: 11 },
  streakBanner: {
    backgroundColor: "#FF6B3522",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: "center",
  },
  streakBannerText: { color: "#FF6B35", fontSize: 13, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  ctaContainer: { padding: 16 },
  ctaBtn: { borderRadius: 18, overflow: "hidden" },
  ctaBtnGrad: { padding: 20, alignItems: "center", gap: 4 },
  ctaBtnText: { fontSize: 20, fontWeight: "900", color: "#FFFFFF" },
  ctaBtnSub: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: "600" },
  questList: { gap: 10 },
  questCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  questEmoji: { fontSize: 26 },
  questInfo: { flex: 1, gap: 5 },
  questTitle: { fontSize: 14, fontWeight: "700" },
  questBarBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  questBarFill: { height: "100%", borderRadius: 3 },
  questProgress: { fontSize: 11 },
  questReward: { alignItems: "center" },
  questXP: { fontSize: 16, fontWeight: "800", color: "#FFD700" },
  questXPLabel: { fontSize: 10 },
  questDone: { fontSize: 20 },
  challengeRow: { gap: 12, paddingBottom: 4 },
  challengeCard: {
    width: 140,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
    alignItems: "center",
  },
  challengeEmoji: { fontSize: 32 },
  challengeTitle: { fontSize: 13, fontWeight: "700", textAlign: "center", lineHeight: 18 },
  challengeDiff: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  challengeDiffText: { fontSize: 10, fontWeight: "800" },
  challengeXP: { fontSize: 13, color: "#FFD700", fontWeight: "700" },
  challengeDone: { fontSize: 18 },
  guideList: { gap: 10 },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  guideEmoji: { fontSize: 28 },
  guideInfo: { flex: 1, gap: 5 },
  guideName: { fontSize: 14, fontWeight: "700" },
  guideTip: { fontSize: 12, lineHeight: 16 },
  guidePlacement: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  guidePlacementText: { fontSize: 11, color: "#FF6B35", fontWeight: "600" },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  recentLeft: { gap: 3 },
  recentDate: { fontSize: 12 },
  recentReps: { fontSize: 15, fontWeight: "700" },
  recentDuration: { fontSize: 16, fontWeight: "800" },
});
