import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useMotionDetector } from "@/hooks/use-motion-detector";
import { useCalibration } from "@/lib/calibration-context";
import { useColors } from "@/hooks/use-colors";
import { useVoiceCoach } from "@/hooks/use-voice-coach";
import { useProfile } from "@/lib/profile-context";
import type { ExerciseType } from "@/lib/workout-store";
import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const EXERCISES: ExerciseType[] = ["push-up", "squat", "sit-up", "jumping-jack", "running"];

export default function CalibrationScreen() {
  const router = useRouter();
  const colors = useColors();
  const { startCalibration, completeCalibration } = useCalibration();
  const { profile } = useProfile();
  const { announceStart, announceRep, announceFinish } = useVoiceCoach(profile.voicePersona, profile.voiceEnabled);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [peakHeights, setPeakHeights] = useState<number[]>([]);

  const currentExercise = EXERCISES[currentIndex];
  const { reps, motionData, confidence } = useMotionDetector(isCalibrating);

  // Track peak heights during calibration
  useEffect(() => {
    if (isCalibrating && motionData && reps > repCount) {
      setRepCount(reps);
      // Record the peak height from the motion data
      const magnitude = motionData.magnitude;
      setPeakHeights((prev) => [...prev, magnitude]);

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Announce rep count via voice coach
      announceRep(reps);
    }
  }, [reps, repCount, isCalibrating, motionData, announceRep]);

  const handleStartCalibration = () => {
    setRepCount(0);
    setPeakHeights([]);
    setIsCalibrating(true);
    startCalibration(currentExercise);
    announceStart();
  };

  const handleCompleteCalibration = async () => {
    setIsCalibrating(false);

    if (peakHeights.length === 0) {
      return;
    }

    // Calculate average peak height and adjust thresholds
    const avgPeakHeight = peakHeights.reduce((a, b) => a + b, 0) / peakHeights.length;
    const minPeakHeight = Math.max(0.1, avgPeakHeight * 0.7); // 70% of average
    const minPeakProminence = Math.max(0.05, avgPeakHeight * 0.15); // 15% of average

    await completeCalibration(currentExercise, {
      exerciseId: currentExercise,
      minPeakHeight,
      minPeakProminence,
      minIntervalMs: 600, // Keep default interval
      calibratedAt: Date.now(),
    });

    announceFinish();

    // Move to next exercise or finish
    if (currentIndex < EXERCISES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.back();
    }
  };

  const handleSkip = () => {
    if (currentIndex < EXERCISES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.back();
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">Calibration</Text>
            <Text className="text-sm text-muted">
              Exercise {currentIndex + 1} of {EXERCISES.length}
            </Text>
          </View>

          {/* Progress */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground capitalize">
              {currentExercise}
            </Text>
            <View className="h-2 bg-surface rounded-full overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{ width: `${((currentIndex + 1) / EXERCISES.length) * 100}%` }}
              />
            </View>
          </View>

          {/* Instructions */}
          <View className="bg-surface rounded-lg p-4 gap-2">
            <Text className="text-sm font-semibold text-foreground">Instructions:</Text>
            <Text className="text-xs text-muted leading-relaxed">
              {isCalibrating
                ? `Perform 5 reps of ${currentExercise} at your normal pace. The app will count automatically.`
                : `Tap "Start Calibration" and perform 5 reps of ${currentExercise} to calibrate sensitivity for your body.`}
            </Text>
          </View>

          {/* Live Stats */}
          {isCalibrating && (
            <View className="gap-3">
              <View className="bg-surface rounded-lg p-4 gap-2">
                <Text className="text-xs text-muted">Reps Detected</Text>
                <Text className="text-3xl font-bold text-primary">{repCount}</Text>
              </View>
              <View className="bg-surface rounded-lg p-4 gap-2">
                <Text className="text-xs text-muted">Confidence</Text>
                <View className="h-2 bg-border rounded-full overflow-hidden">
                  <View
                    className="h-full bg-success"
                    style={{ width: `${Math.min(confidence * 100, 100)}%` }}
                  />
                </View>
                <Text className="text-xs text-muted">{(confidence * 100).toFixed(0)}%</Text>
              </View>
            </View>
          )}

          {/* Buttons */}
          <View className="gap-3 mt-auto">
            {!isCalibrating ? (
              <>
                <Pressable
                  onPress={handleStartCalibration}
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text className="text-white font-semibold text-center">Start Calibration</Text>
                </Pressable>
                <Pressable
                  onPress={handleSkip}
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: colors.border, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text className="text-foreground font-semibold text-center">Skip</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={handleCompleteCalibration}
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: colors.success, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text className="text-white font-semibold text-center">Complete</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
});
