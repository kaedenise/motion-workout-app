import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useCalories } from "@/lib/calorie-context";
import { AIFoodRecognitionResult } from "@/lib/calorie-tracker";
import { trpc } from "@/lib/trpc";

export default function CameraFoodScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addFoodItem } = useCalories();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<"camera" | "preview" | "analyzing" | "results">(
    "camera"
  );
  const [capturedImage, setCapturedImage] = useState<string | undefined>();
  const [recognitionResult, setRecognitionResult] =
    useState<AIFoodRecognitionResult | null>(null);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">(
    "lunch"
  );
  const [isLoading, setIsLoading] = useState(false);

  const recognizeFoodMutation = trpc.food.recognizeFood.useMutation();

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo) {
        setCapturedImage(photo.uri);
        setPhase("preview");
      }
    } catch (error) {
      console.error("Failed to take photo:", error);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setPhase("preview");
      }
    } catch (error) {
      console.error("Failed to pick image:", error);
    }
  };

  const handleAnalyzeFood = async () => {
    if (!capturedImage) return;

    setPhase("analyzing");
    setIsLoading(true);

    try {
      // Upload image and get URL
      const formData = new FormData();
      formData.append("file", {
        uri: capturedImage,
        type: "image/jpeg",
        name: "food.jpg",
      } as any);

      // For now, we'll use the local image URI
      // In production, upload to S3 and get URL
      const result = await recognizeFoodMutation.mutateAsync({
        imageUri: capturedImage,
      });

      setRecognitionResult(result);
      setPhase("results");
    } catch (error) {
      console.error("Failed to recognize food:", error);
      setPhase("preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFood = async () => {
    if (!recognitionResult) return;

    try {
      await addFoodItem({
        name: recognitionResult.foodName,
        calories: recognitionResult.calories,
        protein: recognitionResult.protein,
        carbs: recognitionResult.carbs,
        fat: recognitionResult.fat,
        fiber: recognitionResult.fiber,
        servingSize: recognitionResult.servingSize,
        confidence: recognitionResult.confidence,
        imageUrl: capturedImage,
        mealType,
        notes: recognitionResult.notes,
      });

      router.back();
    } catch (error) {
      console.error("Failed to add food:", error);
    }
  };

  // Camera permission handling
  if (!permission) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text style={{ color: colors.foreground }}>Loading camera...</Text>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer className="items-center justify-center p-6 gap-4">
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>
          Camera access needed
        </Text>
        <Text style={{ color: colors.muted, textAlign: "center" }}>
          We need camera permission to recognize food from photos
        </Text>
        <Pressable
          onPress={requestPermission}
          style={({ pressed }) => [
            styles.permissionBtn,
            pressed && { opacity: 0.8 },
          ]}
        >
          <LinearGradient
            colors={["#FF6B35", "#FF8C42"]}
            style={styles.permissionBtnGrad}
          >
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </LinearGradient>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <LinearGradient colors={["#0F0C29", "#1A1A2E"]} style={{ flex: 1 }}>
      <ScreenContainer containerClassName="bg-transparent">
        {/* ─── CAMERA PHASE ─── */}
        {phase === "camera" && (
          <View style={styles.container}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              autofocus="on"
            />

            {/* Camera Controls */}
            <View style={styles.cameraControls}>
              <Pressable
                onPress={handlePickImage}
                style={({ pressed }) => [
                  styles.galleryBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.galleryBtnText}>📷</Text>
              </Pressable>

              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [
                  styles.captureBtn,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                <LinearGradient
                  colors={["#FF6B35", "#FF8C42"]}
                  style={styles.captureBtnGrad}
                >
                  <Text style={styles.captureBtnText}>📸</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── PREVIEW PHASE ─── */}
        {phase === "preview" && capturedImage && (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: capturedImage }}
              style={styles.previewImage}
            />

            <View style={styles.previewControls}>
              <Pressable
                onPress={() => setPhase("camera")}
                style={({ pressed }) => [
                  styles.retakeBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.retakeBtnText}>🔄 Retake</Text>
              </Pressable>

              <Pressable
                onPress={handleAnalyzeFood}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.analyzeBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <LinearGradient
                  colors={["#34D399", "#059669"]}
                  style={styles.analyzeBtnGrad}
                >
                  <Text style={styles.analyzeBtnText}>
                    {isLoading ? "Analyzing..." : "🤖 Analyze"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── ANALYZING PHASE ─── */}
        {phase === "analyzing" && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.analyzingText}>
              Analyzing food with AI...
            </Text>
          </View>
        )}

        {/* ─── RESULTS PHASE ─── */}
        {phase === "results" && recognitionResult && (
          <ScrollView contentContainerStyle={styles.resultsContainer}>
            {capturedImage && (
              <Image
                source={{ uri: capturedImage }}
                style={styles.resultImage}
              />
            )}

            <View style={styles.resultContent}>
              <Text style={styles.foodName}>{recognitionResult.foodName}</Text>

              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${recognitionResult.confidence * 100}%`,
                      backgroundColor:
                        recognitionResult.confidence > 0.8
                          ? "#34D399"
                          : recognitionResult.confidence > 0.6
                            ? "#F59E0B"
                            : "#EF4444",
                    },
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>
                {Math.round(recognitionResult.confidence * 100)}% confident
              </Text>

              {/* Nutrition Info */}
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionCard}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(recognitionResult.calories)}
                  </Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>

                <View style={styles.nutritionCard}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(recognitionResult.protein)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>

                <View style={styles.nutritionCard}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(recognitionResult.carbs)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>

                <View style={styles.nutritionCard}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(recognitionResult.fat)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              </View>

              <Text style={styles.servingSize}>
                Serving: {recognitionResult.servingSize}
              </Text>

              {recognitionResult.notes && (
                <Text style={styles.notes}>{recognitionResult.notes}</Text>
              )}

              {/* Meal Type Selection */}
              <Text style={styles.mealTypeLabel}>Meal Type:</Text>
              <View style={styles.mealTypeButtons}>
                {(["breakfast", "lunch", "dinner", "snack"] as const).map(
                  (type) => (
                    <Pressable
                      key={type}
                      onPress={() => setMealType(type)}
                      style={[
                        styles.mealTypeBtn,
                        mealType === type && styles.mealTypeBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.mealTypeBtnText,
                          mealType === type && styles.mealTypeBtnTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Pressable
                  onPress={() => setPhase("preview")}
                  style={({ pressed }) => [
                    styles.editBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </Pressable>

                <Pressable
                  onPress={handleAddFood}
                  style={({ pressed }) => [
                    styles.addBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <LinearGradient
                    colors={["#34D399", "#059669"]}
                    style={styles.addBtnGrad}
                  >
                    <Text style={styles.addBtnText}>✓ Add to Log</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        )}
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  camera: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  galleryBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryBtnText: { fontSize: 28 },
  captureBtn: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
  },
  captureBtnGrad: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnText: { fontSize: 28 },
  closeBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontSize: 24, color: "#FFFFFF" },
  previewContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  previewImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 16,
  },
  previewControls: {
    flexDirection: "row",
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
  },
  retakeBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  analyzeBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  analyzeBtnGrad: {
    paddingVertical: 14,
    alignItems: "center",
  },
  analyzeBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  analyzingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    paddingBottom: 24,
  },
  resultImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 20,
  },
  resultContent: {
    gap: 12,
  },
  foodName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  confidenceBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 3,
  },
  confidenceText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
  },
  nutritionGrid: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 12,
  },
  nutritionCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF6B35",
  },
  nutritionLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  servingSize: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textAlign: "center",
  },
  notes: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },
  mealTypeLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  mealTypeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  mealTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
  },
  mealTypeBtnActive: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  mealTypeBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
  mealTypeBtnTextActive: {
    color: "#FFFFFF",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
  },
  editBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  addBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  addBtnGrad: {
    paddingVertical: 14,
    alignItems: "center",
  },
  addBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  permissionBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  permissionBtnGrad: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  permissionBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
