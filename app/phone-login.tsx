import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
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

  const handleRequestCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Invalid phone number", "Please enter a valid phone number.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    const success = await requestVerificationCode(phoneNumber);
    setLoading(false);

    if (success) {
      Alert.alert(
        "Code sent!",
        `A verification code has been sent to ${phoneNumber}.\n\n[Demo: Any 4-digit code works]`
      );
      setStep("verify");
    } else {
      Alert.alert("Error", "Failed to send verification code. Please try again.");
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 4) {
      Alert.alert("Invalid code", "Please enter a 4-digit code.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    const success = await verifyCode(verificationCode, phoneNumber);
    setLoading(false);

    if (success) {
      Alert.alert("Success!", "You're now logged in to the leaderboard.");
      router.back();
    } else {
      Alert.alert("Invalid code", "The code you entered is incorrect. Please try again.");
      setVerificationCode("");
    }
  };

  const handleBack = () => {
    if (step === "verify") {
      setStep("phone");
      setVerificationCode("");
    } else {
      router.back();
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-[#0d0d1a]">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Leaderboard Login</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === "phone" ? (
            <>
              <LinearGradient colors={["#ff6b35", "#f7931e"]} style={styles.iconBox}>
                <Text style={styles.icon}>📱</Text>
              </LinearGradient>
              <Text style={styles.title}>Enter your phone number</Text>
              <Text style={styles.subtitle}>
                We'll send you a verification code to confirm your identity on the leaderboard.
              </Text>

              <TextInput
                placeholder="Enter phone number"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                editable={!loading}
                style={[styles.input, { color: colors.foreground }]}
              />

              <Pressable
                onPress={handleRequestCode}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  loading && { opacity: 0.7 },
                ]}
              >
                <LinearGradient
                  colors={["#ff6b35", "#f7931e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send Verification Code</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <LinearGradient colors={["#06B6D4", "#0891B2"]} style={styles.iconBox}>
                <Text style={styles.icon}>✓</Text>
              </LinearGradient>
              <Text style={styles.title}>Enter verification code</Text>
              <Text style={styles.subtitle}>
                We sent a 4-digit code to {phoneNumber}. Enter it below to confirm.
              </Text>

              <TextInput
                placeholder="0000"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={verificationCode}
                onChangeText={(text) => setVerificationCode(text.slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                editable={!loading}
                style={[styles.codeInput, { color: colors.foreground }]}
              />

              <Pressable
                onPress={handleVerify}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  loading && { opacity: 0.7 },
                ]}
              >
                <LinearGradient
                  colors={["#06B6D4", "#0891B2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Login</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={() => {
                  setStep("phone");
                  setVerificationCode("");
                }}
                style={({ pressed }) => [styles.changePhoneBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.changePhoneText}>Use a different phone number</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Your phone number is only used for leaderboard verification and is never shared.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backBtnText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: "#ff6b35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 20,
  },
  codeInput: {
    width: 140,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 28,
    letterSpacing: 8,
  },
  button: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#ff6b35",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  changePhoneBtn: {
    paddingVertical: 8,
  },
  changePhoneText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textDecorationLine: "underline",
  },
  footer: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 16,
  },
});
