import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { usePhoneAuth } from "@/lib/phone-auth-context";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";

type Step = "phone" | "verify";

export default function PhoneLoginScreen() {
  const colors = useColors();
  const { requestVerificationCode, verifyCode } = usePhoneAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestCode = async () => {
    setError("");

    // Simple validation: at least 10 digits
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      setError("Please enter a valid phone number (at least 10 digits)");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    const success = await requestVerificationCode(phoneNumber);
    setLoading(false);

    if (success) {
      setStep("verify");
    } else {
      setError("Failed to send code. Please try again.");
    }
  };

  const handleVerify = async () => {
    setError("");

    if (verificationCode.length !== 4) {
      setError("Please enter a 4-digit code");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    const success = await verifyCode(verificationCode, phoneNumber);
    setLoading(false);

    if (success) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } else {
      setError("Invalid code. Try again.");
      setVerificationCode("");
    }
  };

  const handleBack = () => {
    if (step === "verify") {
      setStep("phone");
      setVerificationCode("");
      setError("");
    } else {
      router.back();
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === "phone" ? (
            <>
              <LinearGradient colors={["#FF6B35", "#FF8C42"]} style={styles.iconBox}>
                <Text style={styles.icon}>📱</Text>
              </LinearGradient>

              <Text style={styles.title}>Join the Leaderboard</Text>
              <Text style={styles.subtitle}>Enter your phone number to sign in</Text>

              {/* Phone Input */}
              <TextInput
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="rgba(0,0,0,0.3)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                editable={!loading}
                style={[styles.input, { color: colors.foreground, borderColor: error ? "#EF4444" : colors.border }]}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Submit Button */}
              <Pressable
                onPress={handleRequestCode}
                disabled={loading || !phoneNumber.trim()}
                style={({ pressed }) => [
                  styles.button,
                  pressed && !loading && { transform: [{ scale: 0.97 }] },
                  (loading || !phoneNumber.trim()) && { opacity: 0.6 },
                ]}
              >
                <LinearGradient
                  colors={["#FF6B35", "#FF8C42"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonContent}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Send Code</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Text style={styles.note}>We'll send a 4-digit code to verify your number</Text>
            </>
          ) : (
            <>
              <LinearGradient colors={["#06B6D4", "#0891B2"]} style={styles.iconBox}>
                <Text style={styles.icon}>✓</Text>
              </LinearGradient>

              <Text style={styles.title}>Verify Your Number</Text>
              <Text style={styles.subtitle}>Enter the 4-digit code sent to {phoneNumber}</Text>

              {/* Code Input */}
              <TextInput
                placeholder="0000"
                placeholderTextColor="rgba(0,0,0,0.3)"
                value={verificationCode}
                onChangeText={(text) => setVerificationCode(text.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                editable={!loading}
                style={[styles.codeInput, { color: colors.foreground, borderColor: error ? "#EF4444" : colors.border }]}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Verify Button */}
              <Pressable
                onPress={handleVerify}
                disabled={loading || verificationCode.length !== 4}
                style={({ pressed }) => [
                  styles.button,
                  pressed && !loading && { transform: [{ scale: 0.97 }] },
                  (loading || verificationCode.length !== 4) && { opacity: 0.6 },
                ]}
              >
                <LinearGradient
                  colors={["#06B6D4", "#0891B2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonContent}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Login</Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Change Phone Button */}
              <Pressable
                onPress={() => {
                  setStep("phone");
                  setVerificationCode("");
                  setError("");
                }}
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.secondaryBtnText}>Use Different Number</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 24,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF6B35",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#687076",
    textAlign: "center",
    lineHeight: 20,
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    marginTop: 12,
  },
  codeInput: {
    width: 140,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    letterSpacing: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "600",
    marginTop: 8,
  },
  button: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 20,
  },
  buttonContent: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryBtn: {
    paddingVertical: 12,
    marginTop: 12,
  },
  secondaryBtnText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  note: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 12,
  },
});
