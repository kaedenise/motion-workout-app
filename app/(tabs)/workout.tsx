import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useMotionDetector } from "@/hooks/use-motion-detector";
import { useWorkout } from "@/lib/workout-context";
import {
  EXERCISE_LABELS,
  EXERCISE_ICONS,
  type ExerciseType,
  formatDuration,
} from "@/lib/workout-store";

const EXERCISE_COLORS: Record<ExerciseType, string> = {
  "push-up": "#FF6B35",
  squat: "#8B5CF6",
  "jumping-jack": "#F59E0B",
  "sit-up": "#EF4444",
  running: "#00D4AA",
  idle: "#6B7280",
};

function ConfidenceBar({ confidence, color }: { confidence: number; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.confidenceTrack, { backgroundColor: colors.border }]}>
      <View
        style={[
          styles.confidenceFill,
          {
            width: `${Math.round(confidence * 100)}%` as any,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

function SensorBar({ value, max = 2, color }: { value: number; color: string; max?: number }) {
  const colors = useColors();
  const pct = Math.min(Math.abs(value) / max, 1);
  return (
    <View style={[styles.sensorTrack, { backgroundColor: colors.border }]}>
      <View
        style={[
          styles.sensorFill,
          { width: `${pct * 100}%` as any, backgroundColor: color },
        ]}
      />
    </View>
  );
}

export default function WorkoutScreen() {
  const colors = useColors();
  const router = useRouter();
  const { activeWorkout, startWorkout, updateCurrentExercise, finishWorkout } = useWorkout();

  const isActive = !!activeWorkout;
  useKeepAwake();

  const { exercise, confidence, reps, motionData, isAvailable, resetReps } =
    useMotionDetector(isActive);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevRepsRef = useRef(reps);
  const repScale = useSharedValue(1);
  const exerciseOpacity = useSharedValue(1);
  const prevExerciseRef = useRef<ExerciseType>("idle");

  // Elapsed timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - (activeWorkout?.startedAt ?? Date.now()));
      }, 1000);
    } else {
      setElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, activeWorkout?.startedAt]);

  // Sync exercise to context
  useEffect(() => {
    if (isActive) {
      updateCurrentExercise(exercise, reps);
    }
  }, [exercise, reps, isActive]);

  // Haptic + animation on new rep
  useEffect(() => {
    if (reps > prevRepsRef.current) {
      prevRepsRef.current = reps;
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      repScale.value = withSpring(1.25, { damping: 8 }, () => {
        repScale.value = withTiming(1, { duration: 150 });
      });
    }
  }, [reps]);

  // Animate exercise change
  useEffect(() => {
    if (exercise !== prevExerciseRef.current) {
      prevExerciseRef.current = exercise;
      exerciseOpacity.value = withTiming(0, { duration: 120 }, () => {
        exerciseOpacity.value = withTiming(1, { duration: 200 });
      });
    }
  }, [exercise]);

  const repAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: repScale.value }],
  }));
  const exerciseAnimStyle = useAnimatedStyle(() => ({
    opacity: exerciseOpacity.value,
  }));

  const exerciseColor = EXERCISE_COLORS[exercise];

  const handleStart = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startWorkout();
    resetReps();
  };

  const handleFinish = () => {
    Alert.alert("Finish Workout?", "Your session will be saved.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Finish",
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          const session = await finishWorkout();
          if (session) {
            router.push(`/session/${session.id}` as any);
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#1A1A2E" }]}>
          <Text style={styles.headerTitle}>
            {isActive ? "Workout Active" : "Start Workout"}
          </Text>
          {isActive && (
            <View style={[styles.timerBadge, { backgroundColor: "#FF6B3522" }]}>
              <IconSymbol name="clock.fill" size={14} color="#FF6B35" />
              <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
            </View>
          )}
        </View>

        {!isAvailable && (
          <View style={[styles.warningBanner, { backgroundColor: colors.warning + "22" }]}>
            <Text style={[styles.warningText, { color: colors.warning }]}>
              ⚠️ Motion sensors not available on this device/platform
            </Text>
          </View>
        )}

        {/* Main Detection Card */}
        <View style={styles.detectionArea}>
          <Animated.View style={[styles.exerciseCard, exerciseAnimStyle, { backgroundColor: colors.surface, borderColor: exerciseColor, shadowColor: exerciseColor }]}>
            <Text style={styles.exerciseEmoji}>{EXERCISE_ICONS[exercise]}</Text>
            <Text style={[styles.exerciseName, { color: exerciseColor }]}>
              {EXERCISE_LABELS[exercise]}
            </Text>
            <Text style={[styles.exerciseSubtitle, { color: colors.muted }]}>
              {isActive ? "Detected exercise" : "Waiting to start..."}
            </Text>

            {/* Confidence */}
            {isActive && (
              <View style={styles.confidenceContainer}>
                <View style={styles.confidenceRow}>
                  <Text style={[styles.confidenceLabel, { color: colors.muted }]}>Confidence</Text>
                  <Text style={[styles.confidenceValue, { color: exerciseColor }]}>
                    {Math.round(confidence * 100)}%
                  </Text>
                </View>
                <ConfidenceBar confidence={confidence} color={exerciseColor} />
              </View>
            )}
          </Animated.View>

          {/* Rep Counter */}
          <View style={[styles.repCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.repLabel, { color: colors.muted }]}>REPS</Text>
            <Animated.Text style={[styles.repCount, { color: "#FF6B35" }, repAnimStyle]}>
              {reps}
            </Animated.Text>
            {isActive && (
              <Pressable
                onPress={() => {
                  resetReps();
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={({ pressed }) => [
                  styles.resetBtn,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={[styles.resetBtnText, { color: colors.muted }]}>Reset</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Sensor Visualizer */}
        {isActive && motionData && (
          <View style={[styles.sensorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sensorTitle, { color: colors.foreground }]}>
              <IconSymbol name="waveform" size={14} color={colors.muted} /> Live Sensor Data
            </Text>
            <View style={styles.sensorRow}>
              <Text style={[styles.sensorAxisLabel, { color: "#FF6B35" }]}>X</Text>
              <SensorBar value={motionData.ax} color="#FF6B35" />
              <Text style={[styles.sensorAxisValue, { color: colors.muted }]}>
                {motionData.ax.toFixed(2)}
              </Text>
            </View>
            <View style={styles.sensorRow}>
              <Text style={[styles.sensorAxisLabel, { color: "#8B5CF6" }]}>Y</Text>
              <SensorBar value={motionData.ay} color="#8B5CF6" />
              <Text style={[styles.sensorAxisValue, { color: colors.muted }]}>
                {motionData.ay.toFixed(2)}
              </Text>
            </View>
            <View style={styles.sensorRow}>
              <Text style={[styles.sensorAxisLabel, { color: "#00D4AA" }]}>Z</Text>
              <SensorBar value={motionData.az} color="#00D4AA" />
              <Text style={[styles.sensorAxisValue, { color: colors.muted }]}>
                {motionData.az.toFixed(2)}
              </Text>
            </View>
            <View style={styles.sensorRow}>
              <Text style={[styles.sensorAxisLabel, { color: "#F59E0B" }]}>Mag</Text>
              <SensorBar value={motionData.magnitude} max={3} color="#F59E0B" />
              <Text style={[styles.sensorAxisValue, { color: colors.muted }]}>
                {motionData.magnitude.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Current Session Sets */}
        {isActive && activeWorkout && activeWorkout.sets.length > 0 && (
          <View style={[styles.setsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.setsTitle, { color: colors.foreground }]}>This Session</Text>
            {activeWorkout.sets.map((set, i) => (
              <View key={i} style={[styles.setRow, { borderTopColor: colors.border }]}>
                <Text style={styles.setEmoji}>{EXERCISE_ICONS[set.exercise]}</Text>
                <Text style={[styles.setName, { color: colors.foreground }]}>
                  {EXERCISE_LABELS[set.exercise]}
                </Text>
                <Text style={[styles.setReps, { color: "#FF6B35" }]}>{set.reps} reps</Text>
                <Text style={[styles.setDuration, { color: colors.muted }]}>
                  {formatDuration(set.durationMs)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionArea}>
          {!isActive ? (
            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [
                styles.startBtn,
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              <IconSymbol name="play.fill" size={22} color="#fff" />
              <Text style={styles.startBtnText}>Start Workout</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleFinish}
              style={({ pressed }) => [
                styles.finishBtn,
                { borderColor: colors.error },
                pressed && { opacity: 0.8 },
              ]}
            >
              <IconSymbol name="stop.fill" size={20} color={colors.error} />
              <Text style={[styles.finishBtnText, { color: colors.error }]}>Finish Workout</Text>
            </Pressable>
          )}
        </View>

        {/* Placement Tips */}
        {!isActive && (
          <View style={[styles.tipsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.tipsTitle, { color: colors.foreground }]}>📱 Phone Placement Tips</Text>
            <Text style={[styles.tipText, { color: colors.muted }]}>
              • <Text style={{ fontWeight: "600" }}>Push-Up:</Text> Place flat on floor beneath you
            </Text>
            <Text style={[styles.tipText, { color: colors.muted }]}>
              • <Text style={{ fontWeight: "600" }}>Squat:</Text> Hold in hand or keep in pocket
            </Text>
            <Text style={[styles.tipText, { color: colors.muted }]}>
              • <Text style={{ fontWeight: "600" }}>Jumping Jack:</Text> Hold in one hand
            </Text>
            <Text style={[styles.tipText, { color: colors.muted }]}>
              • <Text style={{ fontWeight: "600" }}>Sit-Up:</Text> Place on chest / hold to chest
            </Text>
            <Text style={[styles.tipText, { color: colors.muted }]}>
              • <Text style={{ fontWeight: "600" }}>Running:</Text> Hold in hand while running
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  timerText: {
    color: "#FF6B35",
    fontSize: 14,
    fontWeight: "700",
  },
  warningBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  warningText: {
    fontSize: 13,
    textAlign: "center",
  },
  detectionArea: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  exerciseCard: {
    flex: 2,
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exerciseEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  exerciseSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  confidenceContainer: {
    width: "100%",
    gap: 4,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confidenceLabel: {
    fontSize: 11,
  },
  confidenceValue: {
    fontSize: 11,
    fontWeight: "700",
  },
  confidenceTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 3,
  },
  repCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  repLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  repCount: {
    fontSize: 56,
    fontWeight: "900",
    lineHeight: 64,
  },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sensorCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  sensorTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  sensorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sensorAxisLabel: {
    width: 28,
    fontSize: 12,
    fontWeight: "700",
  },
  sensorTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  sensorFill: {
    height: "100%",
    borderRadius: 3,
  },
  sensorAxisValue: {
    width: 40,
    fontSize: 11,
    textAlign: "right",
  },
  setsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  setsTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 0.5,
    gap: 8,
  },
  setEmoji: {
    fontSize: 16,
  },
  setName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  setReps: {
    fontSize: 14,
    fontWeight: "700",
  },
  setDuration: {
    fontSize: 12,
    width: 50,
    textAlign: "right",
  },
  actionArea: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  startBtn: {
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
  startBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  finishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
  },
  finishBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  tipsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
