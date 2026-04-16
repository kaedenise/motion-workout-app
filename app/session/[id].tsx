import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  type ExerciseSet,
} from "@/lib/workout-store";

const EXERCISE_COLORS: Record<string, string> = {
  "push-up": "#FF6B35",
  squat: "#8B5CF6",
  "jumping-jack": "#F59E0B",
  "sit-up": "#EF4444",
  running: "#00D4AA",
  idle: "#6B7280",
};

function SetRow({ set, index }: { set: ExerciseSet; index: number }) {
  const colors = useColors();
  const color = EXERCISE_COLORS[set.exercise] ?? "#FF6B35";

  return (
    <View style={[styles.setRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.setIndex, { backgroundColor: color + "22" }]}>
        <Text style={[styles.setIndexText, { color }]}>{index + 1}</Text>
      </View>
      <Text style={styles.setEmoji}>{EXERCISE_ICONS[set.exercise]}</Text>
      <Text style={[styles.setName, { color: colors.foreground }]}>
        {EXERCISE_LABELS[set.exercise]}
      </Text>
      <View style={styles.setStats}>
        <Text style={[styles.setReps, { color }]}>{set.reps}</Text>
        <Text style={[styles.setRepsLabel, { color: colors.muted }]}>reps</Text>
      </View>
      <Text style={[styles.setDuration, { color: colors.muted }]}>
        {formatDuration(set.durationMs)}
      </Text>
    </View>
  );
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { sessions } = useWorkout();

  const session = sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <ScreenContainer className="p-6">
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.foreground }]}>
            Session not found
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // Aggregate sets by exercise
  const exerciseSummary = session.sets.reduce(
    (acc, set) => {
      if (!acc[set.exercise]) {
        acc[set.exercise] = { reps: 0, durationMs: 0, count: 0 };
      }
      acc[set.exercise].reps += set.reps;
      acc[set.exercise].durationMs += set.durationMs;
      acc[set.exercise].count += 1;
      return acc;
    },
    {} as Record<string, { reps: number; durationMs: number; count: number }>
  );

  const exerciseEntries = Object.entries(exerciseSummary);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1A1A2E" }]}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="chevron.left" size={22} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerDate}>{formatDate(session.startedAt)}</Text>
          <Text style={styles.headerTime}>{formatTime(session.startedAt)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.summaryEmoji}>⏱️</Text>
            <Text style={[styles.summaryValue, { color: "#8B5CF6" }]}>
              {formatDuration(session.durationMs)}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Duration</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.summaryEmoji}>🔄</Text>
            <Text style={[styles.summaryValue, { color: "#FF6B35" }]}>
              {session.totalReps}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Reps</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.summaryEmoji}>🔥</Text>
            <Text style={[styles.summaryValue, { color: "#EF4444" }]}>
              {session.caloriesBurned}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>kcal</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.summaryEmoji}>🏋️</Text>
            <Text style={[styles.summaryValue, { color: "#00D4AA" }]}>
              {exerciseEntries.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Exercises</Text>
          </View>
        </View>

        {/* Exercise Summary */}
        {exerciseEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Exercise Summary
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {exerciseEntries.map(([exercise, data], i) => {
                const color = EXERCISE_COLORS[exercise] ?? "#FF6B35";
                return (
                  <View
                    key={exercise}
                    style={[
                      styles.exerciseRow,
                      { borderTopColor: colors.border },
                      i === 0 && { borderTopWidth: 0 },
                    ]}
                  >
                    <View style={[styles.exerciseIconBg, { backgroundColor: color + "22" }]}>
                      <Text style={styles.exerciseEmoji}>{(EXERCISE_ICONS as any)[exercise]}</Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={[styles.exerciseName, { color: colors.foreground }]}>
                        {(EXERCISE_LABELS as any)[exercise]}
                      </Text>
                      <Text style={[styles.exerciseSets, { color: colors.muted }]}>
                        {data.count} set{data.count !== 1 ? "s" : ""} · {formatDuration(data.durationMs)}
                      </Text>
                    </View>
                    <View style={styles.exerciseRepsCol}>
                      <Text style={[styles.exerciseReps, { color }]}>{data.reps}</Text>
                      <Text style={[styles.exerciseRepsLabel, { color: colors.muted }]}>reps</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Set-by-Set Log */}
        {session.sets.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Set Log
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {session.sets.map((set, i) => (
                <SetRow key={i} set={set} index={i} />
              ))}
            </View>
          </View>
        )}

        {session.sets.length === 0 && (
          <View style={styles.noSets}>
            <Text style={[styles.noSetsText, { color: colors.muted }]}>
              No sets were recorded in this session.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerInfo: {
    flex: 1,
    alignItems: "flex-end",
  },
  headerDate: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerTime: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 10,
  },
  summaryCard: {
    width: "47%",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  summaryEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderTopWidth: 0.5,
    gap: 12,
  },
  exerciseIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseEmoji: {
    fontSize: 20,
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
  },
  exerciseSets: {
    fontSize: 12,
  },
  exerciseRepsCol: {
    alignItems: "flex-end",
  },
  exerciseReps: {
    fontSize: 20,
    fontWeight: "800",
  },
  exerciseRepsLabel: {
    fontSize: 11,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  setIndex: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  setIndexText: {
    fontSize: 12,
    fontWeight: "700",
  },
  setEmoji: {
    fontSize: 16,
  },
  setName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  setStats: {
    alignItems: "flex-end",
  },
  setReps: {
    fontSize: 16,
    fontWeight: "700",
  },
  setRepsLabel: {
    fontSize: 10,
  },
  setDuration: {
    fontSize: 12,
    width: 48,
    textAlign: "right",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: "600",
  },
  backBtn: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  noSets: {
    padding: 32,
    alignItems: "center",
  },
  noSetsText: {
    fontSize: 14,
    textAlign: "center",
  },
});
