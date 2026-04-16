import React, { createContext, useContext, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PHONE_AUTH_KEY = "@motionfit:phone_auth";
const VERIFICATION_CODE_KEY = "@motionfit:verification_code";

export interface PhoneAuthState {
  phoneNumber: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface PhoneAuthContextValue extends PhoneAuthState {
  requestVerificationCode: (phoneNumber: string) => Promise<boolean>;
  verifyCode: (code: string, phoneNumber: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const PhoneAuthContext = createContext<PhoneAuthContextValue | null>(null);

export function usePhoneAuth(): PhoneAuthContextValue {
  const ctx = useContext(PhoneAuthContext);
  if (!ctx) throw new Error("usePhoneAuth must be used within PhoneAuthProvider");
  return ctx;
}

export function PhoneAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PhoneAuthState>({
    phoneNumber: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize from storage
  React.useEffect(() => {
    const init = async () => {
      const stored = await AsyncStorage.getItem(PHONE_AUTH_KEY);
      if (stored) {
        setState({
          phoneNumber: stored,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    init();
  }, []);

  const requestVerificationCode = useCallback(async (phoneNumber: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      // Generate a mock verification code (in production, this would be sent via SMS)
      // For demo purposes, we'll store it locally and allow any 4-digit code
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      await AsyncStorage.setItem(VERIFICATION_CODE_KEY, code);

      // In a real app, you'd send this via SMS API (Twilio, etc.)
      console.log(`[Demo] Verification code for ${phoneNumber}: ${code}`);

      setState((prev) => ({ ...prev, isLoading: false }));
      return true;
    } catch (err) {
      console.error("Failed to request verification code:", err);
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const verifyCode = useCallback(async (code: string, phoneNumber: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const storedCode = await AsyncStorage.getItem(VERIFICATION_CODE_KEY);

      // In demo mode, accept any 4-digit code or the actual stored code
      const isValid = code.length === 4 && /^\d+$/.test(code) && (code === storedCode || true);

      if (isValid) {
        await AsyncStorage.setItem(PHONE_AUTH_KEY, phoneNumber);
        await AsyncStorage.removeItem(VERIFICATION_CODE_KEY);
        setState({
          phoneNumber,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    } catch (err) {
      console.error("Failed to verify code:", err);
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(PHONE_AUTH_KEY);
    await AsyncStorage.removeItem(VERIFICATION_CODE_KEY);
    setState({
      phoneNumber: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <PhoneAuthContext.Provider
      value={{
        ...state,
        requestVerificationCode,
        verifyCode,
        logout,
      }}
    >
      {children}
    </PhoneAuthContext.Provider>
  );
}
