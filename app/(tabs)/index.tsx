import { ScrollView, Text, View, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useWorkout } from "@/lib/workout-context";
import {
  EXERCISE_LABELS,
  EXERCISE_ICONS,
  formatDuration,
  formatDate,
  formatTime,
  type WorkoutSession,
} from "@/lib/workout-store";

const EXERCISE_GUIDE = [
  {
    key: "push-up",
    label: "Push-Up",
    icon: "💪",
    tip: "Place phone on floor. Detect Z-axis oscillation as you push up and down.",
    color: "#FF6B35",
  },
  {
    key: "squat",
    label: "Squat",
    icon: "🦵",
    tip: "Hold phone in hand or pocket. Y-axis dip/rise detects each squat rep.",
    color: "#8B5CF6",
  },
  {
    key: "jumping-jack",
    label: "Jumping Jack",
    icon: "⚡",
    tip: "Hold phone in hand. High-magnitude spikes count each jumping jack.",
    color: "#F59E0B",
  },
  {
    key: "sit-up",
    label: "Sit-Up",
    icon: "🔥",
    tip: "Place phone on chest. Forward tilt oscillation detects sit-up reps.",
    color: "#EF4444",
  },
  {
    key: "running",
    label: "Running",
    icon: "🏃",
    tip: "Hold phone in hand. High-frequency periodic motion detects running.",
    color: "#00D4AA",
  },
];

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function SessionCard({ session }: { session: WorkoutSession }) {
  const colors = useColors();
  const router = useRouter();
  const exercises = [...new Set(session.sets.map((s) => s.exercise))];

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/session/${session.id}` as any);
      }}
      style={({ pressed }) => [
        styles.sessionCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={styles.sessionCardTop}>
        <View>
          <Text style={[styles.sessionDate, { color: colors.foreground }]}>
            {formatDate(session.startedAt)}
          </Text>
          <Text style={[styles.sessionTime, { color: colors.muted }]}>
            {formatTime(session.startedAt)} · {formatDuration(session.durationMs)}
          </Text>
        </View>
        <View style={styles.sessionStats}>
          <Text style={[styles.sessionReps, { color: "#FF6B35" }]}>{session.totalReps}</Text>
          <Text style={[styles.sessionRepsLabel, { color: colors.muted }]}>reps</Text>
        </View>
      </View>
      <View style={styles.exercisePills}>
        {exercises.slice(0, 3).map((ex) => (
          <View
            key={ex}
            style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Text style={styles.pillText}>
              {EXERCISE_ICONS[ex]} {EXERCISE_LABELS[ex]}
            </Text>
          </View>
        ))}
        {exercises.length > 3 && (
          <View style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.pillText, { color: colors.muted }]}>+{exercises.length - 3}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { sessions } = useWorkout();

  const totalWorkouts = sessions.length;
  const totalReps = sessions.reduce((s, w) => s + w.totalReps, 0);
  const totalCalories = sessions.reduce((s, w) => s + w.caloriesBurned, 0);
  const recentSessions = sessions.slice(0, 3);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#1A1A2E" }]}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.headerTitle}>Ready to train?</Text>
          </View>
          <View style={[styles.logoCircle, { backgroundColor: "#FF6B35" }]}>
            <IconSymbol name="dumbbell.fill" size={24} color="#fff" />
          </View>
        </View>

        {/* Start Workout CTA */}
        <View style={styles.ctaContainer}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/workout" as any);
            }}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <IconSymbol name="play.fill" size={22} color="#fff" />
            <Text style={styles.ctaText}>Start Workout</Text>
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Workouts" value={String(totalWorkouts)} icon="🏋️" color="#FF6B35" />
          <StatCard label="Total Reps" value={String(totalReps)} icon="🔄" color="#8B5CF6" />
          <StatCard label="Calories" value={String(totalCalories)} icon="🔥" color="#EF4444" />
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Workouts</Text>
            {sessions.length > 3 && (
              <Pressable onPress={() => router.push("/(tabs)/history" as any)}>
                <Text style={[styles.seeAll, { color: "#FF6B35" }]}>See All</Text>
              </Pressable>
            )}
          </View>

          {recentSessions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>🏃</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No workouts yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Start your first workout to see it here
              </Text>
            </View>
          ) : (
            recentSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
          )}
        </View>

        {/* Exercise Guide */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Exercise Guide</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            How to position your phone for each exercise
          </Text>
          {EXERCISE_GUIDE.map((ex) => (
            <View
              key={ex.key}
              style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.guideIconBg, { backgroundColor: ex.color + "22" }]}>
                <Text style={styles.guideIcon}>{ex.icon}</Text>
              </View>
              <View style={styles.guideContent}>
                <Text style={[styles.guideLabel, { color: colors.foreground }]}>{ex.label}</Text>
                <Text style={[styles.guideTip, { color: colors.muted }]}>{ex.tip}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaContainer: {
    paddingHorizontal: 20,
    marginTop: -14,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  sessionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  sessionCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  sessionDate: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 12,
  },
  sessionStats: {
    alignItems: "flex-end",
  },
  sessionReps: {
    fontSize: 22,
    fontWeight: "800",
  },
  sessionRepsLabel: {
    fontSize: 11,
  },
  exercisePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  guideCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  guideIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  guideIcon: {
    fontSize: 22,
  },
  guideContent: {
    flex: 1,
  },
  guideLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  guideTip: {
    fontSize: 13,
    lineHeight: 18,
  },
});
