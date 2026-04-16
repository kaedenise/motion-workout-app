import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

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

function SessionItem({ session }: { session: WorkoutSession }) {
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
        styles.sessionItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && { opacity: 0.75 },
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: "#FF6B35" }]} />

      <View style={styles.sessionContent}>
        <View style={styles.sessionTop}>
          <View style={styles.sessionMeta}>
            <Text style={[styles.sessionDate, { color: colors.foreground }]}>
              {formatDate(session.startedAt)}
            </Text>
            <Text style={[styles.sessionTime, { color: colors.muted }]}>
              {formatTime(session.startedAt)}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={colors.muted} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#FF6B35" }]}>{session.totalReps}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>reps</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#8B5CF6" }]}>
              {formatDuration(session.durationMs)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>duration</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#EF4444" }]}>
              {session.caloriesBurned}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>kcal</Text>
          </View>
        </View>

        <View style={styles.exercisePills}>
          {exercises.slice(0, 4).map((ex) => (
            <View
              key={ex}
              style={[
                styles.pill,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={styles.pillText}>
                {EXERCISE_ICONS[ex]} {EXERCISE_LABELS[ex]}
              </Text>
            </View>
          ))}
          {exercises.length > 4 && (
            <View
              style={[
                styles.pill,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.pillText, { color: colors.muted }]}>
                +{exercises.length - 4}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  const colors = useColors();
  const router = useRouter();

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📋</Text>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No workouts yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
        Complete your first workout to see your history here.
      </Text>
      <Pressable
        onPress={() => router.push("/(tabs)/workout" as any)}
        style={({ pressed }) => [
          styles.emptyBtn,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.emptyBtnText}>Start a Workout</Text>
      </Pressable>
    </View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const { sessions, isLoading } = useWorkout();

  const totalReps = sessions.reduce((s, w) => s + w.totalReps, 0);
  const totalCalories = sessions.reduce((s, w) => s + w.caloriesBurned, 0);
  const totalDurationMs = sessions.reduce((s, w) => s + w.durationMs, 0);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1A1A2E" }]}>
        <Text style={styles.headerTitle}>Workout History</Text>
        <Text style={[styles.headerSubtitle, { color: "rgba(255,255,255,0.6)" }]}>
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Summary Stats */}
      {sessions.length > 0 && (
        <View style={[styles.summaryRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: "#FF6B35" }]}>{totalReps}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Reps</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: "#8B5CF6" }]}>
              {formatDuration(totalDurationMs)}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Time</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: "#EF4444" }]}>{totalCalories}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total kcal</Text>
          </View>
        </View>
      )}

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionItem session={item} />}
        contentContainerStyle={[
          styles.listContent,
          sessions.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={isLoading ? null : <EmptyState />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  summaryDivider: {
    width: 1,
    marginVertical: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  sessionItem: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  accentBar: {
    width: 4,
  },
  sessionContent: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  sessionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sessionMeta: {
    gap: 2,
  },
  sessionDate: {
    fontSize: 15,
    fontWeight: "600",
  },
  sessionTime: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 4,
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
