/**
 * Spectator Context
 * 
 * Manages live workout broadcasting and spectating.
 * Allows users to go live during a workout and friends to watch in real-time.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "./trpc";

export interface LiveSession {
  id: string;
  broadcasterPhone: string;
  broadcasterName: string;
  broadcasterAvatar: string;
  broadcasterLevel: number;
  exercise: string;
  reps: number;
  confidence: number;
  elapsedMs: number;
  startedAt: number;
  viewerCount: number;
  isLive: boolean;
}

export interface SpectatorState {
  currentLiveSession: LiveSession | null;
  viewers: Array<{ phone: string; name: string; avatar: string }>;
  reactions: Array<{ emoji: string; timestamp: number }>;
}

interface SpectatorContextType {
  // Broadcasting
  isLive: boolean;
  liveSession: LiveSession | null;
  startBroadcast: (
    broadcasterPhone: string,
    broadcasterName: string,
    broadcasterAvatar: string,
    broadcasterLevel: number
  ) => Promise<void>;
  updateBroadcast: (exercise: string, reps: number, confidence: number, elapsedMs: number) => Promise<void>;
  stopBroadcast: () => Promise<void>;

  // Spectating
  watchingSession: LiveSession | null;
  viewerCount: number;
  reactions: Array<{ emoji: string; timestamp: number }>;
  startWatching: (sessionId: string) => Promise<void>;
  stopWatching: () => Promise<void>;
  sendReaction: (emoji: string) => Promise<void>;
  pollLiveSession: (sessionId: string) => Promise<LiveSession | null>;
}

const SpectatorContext = createContext<SpectatorContextType | undefined>(undefined);

export function SpectatorProvider({ children }: { children: React.ReactNode }) {
  const [isLive, setIsLive] = useState(false);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [watchingSession, setWatchingSession] = useState<LiveSession | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [reactions, setReactions] = useState<Array<{ emoji: string; timestamp: number }>>([]);

  // Start broadcasting
  const startBroadcast = useCallback(
    async (
      broadcasterPhone: string,
      broadcasterName: string,
      broadcasterAvatar: string,
      broadcasterLevel: number
    ) => {
      const session: LiveSession = {
        id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        broadcasterPhone,
        broadcasterName,
        broadcasterAvatar,
        broadcasterLevel,
        exercise: "idle",
        reps: 0,
        confidence: 0,
        elapsedMs: 0,
        startedAt: Date.now(),
        viewerCount: 0,
        isLive: true,
      };

      setLiveSession(session);
      setIsLive(true);
      setReactions([]);

      // Persist to AsyncStorage
      await AsyncStorage.setItem("@motionfit_live_session", JSON.stringify(session));
    },
    []
  );

  // Update broadcast with latest motion data
  const updateBroadcast = useCallback(
    async (exercise: string, reps: number, confidence: number, elapsedMs: number) => {
      if (!liveSession) return;

      const updated: LiveSession = {
        ...liveSession,
        exercise,
        reps,
        confidence,
        elapsedMs,
      };

      setLiveSession(updated);

      // Persist to AsyncStorage (in production, this would sync to server)
      await AsyncStorage.setItem("@motionfit_live_session", JSON.stringify(updated));
    },
    [liveSession]
  );

  // Stop broadcasting
  const stopBroadcast = useCallback(async () => {
    setIsLive(false);
    setLiveSession(null);
    setReactions([]);
    await AsyncStorage.removeItem("@motionfit_live_session");
  }, []);

  // Start watching a live session
  const startWatching = useCallback(async (sessionId: string) => {
    // In production, fetch from server
    const sessionJson = await AsyncStorage.getItem("@motionfit_live_session");
    if (sessionJson) {
      const session = JSON.parse(sessionJson);
      if (session.id === sessionId) {
        setWatchingSession(session);
        setViewerCount((session.viewerCount ?? 0) + 1);
      }
    }
  }, []);

  // Stop watching
  const stopWatching = useCallback(async () => {
    setWatchingSession(null);
    setViewerCount(0);
    setReactions([]);
  }, []);

  // Send a reaction emoji
  const sendReaction = useCallback(async (emoji: string) => {
    const newReaction = { emoji, timestamp: Date.now() };
    setReactions((prev) => [...prev, newReaction]);

    // Auto-remove after 2 seconds
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.timestamp !== newReaction.timestamp));
    }, 2000);
  }, []);

  // Poll for live session updates (simulates real-time sync)
  const pollLiveSession = useCallback(async (sessionId: string): Promise<LiveSession | null> => {
    try {
      const sessionJson = await AsyncStorage.getItem("@motionfit_live_session");
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        if (session.id === sessionId && session.isLive) {
          return session;
        }
      }
    } catch (err) {
      console.error("[Spectator] Poll error:", err);
    }
    return null;
  }, []);

  return (
    <SpectatorContext.Provider
      value={{
        isLive,
        liveSession,
        startBroadcast,
        updateBroadcast,
        stopBroadcast,
        watchingSession,
        viewerCount,
        reactions,
        startWatching,
        stopWatching,
        sendReaction,
        pollLiveSession,
      }}
    >
      {children}
    </SpectatorContext.Provider>
  );
}

export function useSpectator() {
  const context = useContext(SpectatorContext);
  if (!context) {
    throw new Error("useSpectator must be used within SpectatorProvider");
  }
  return context;
}
