import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ChallengeStatus = "pending" | "accepted" | "in_progress" | "completed" | "declined";

export interface FriendChallenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengerPhone: string;
  challengerAvatar: string;
  opponentId?: string;
  opponentName?: string;
  opponentPhone?: string;
  opponentAvatar?: string;
  exerciseType: "push-up" | "squat" | "running" | "jumping-jack" | "sit-up";
  targetReps: number;
  status: ChallengeStatus;
  challengerReps: number;
  opponentReps: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  winnerId?: string;
  winnerName?: string;
}

export interface Friend {
  id: string;
  name: string;
  phone: string;
  avatarId: string;
  xp: number;
  addedAt: number;
}

interface FriendChallengeContextType {
  challenges: FriendChallenge[];
  friends: Friend[];
  pendingInvites: FriendChallenge[];
  activeChallenges: FriendChallenge[];
  completedChallenges: FriendChallenge[];
  
  // Challenge operations
  createChallenge: (
    challengerPhone: string,
    challengerName: string,
    challengerAvatar: string,
    opponentPhone: string,
    exerciseType: FriendChallenge["exerciseType"],
    targetReps: number
  ) => Promise<FriendChallenge>;
  acceptChallenge: (challengeId: string, opponentPhone: string, opponentName: string, opponentAvatar: string) => Promise<void>;
  declineChallenge: (challengeId: string) => Promise<void>;
  startChallenge: (challengeId: string) => Promise<void>;
  updateChallengeReps: (challengeId: string, isChallenger: boolean, reps: number) => Promise<void>;
  completeChallenge: (challengeId: string, winnerId: string, winnerName: string) => Promise<void>;
  
  // Friend operations
  addFriend: (phone: string, name: string, avatarId: string, xp: number) => Promise<void>;
  removeFriend: (phone: string) => Promise<void>;
  searchFriends: (query: string) => Promise<Friend[]>;
}

const FriendChallengeContext = createContext<FriendChallengeContextType | undefined>(undefined);

export function FriendChallengeProvider({ children }: { children: React.ReactNode }) {
  const [challenges, setChallenges] = useState<FriendChallenge[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  // Load from storage on mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  const loadFromStorage = async () => {
    try {
      const [challengesData, friendsData] = await Promise.all([
        AsyncStorage.getItem("@motionfit_challenges"),
        AsyncStorage.getItem("@motionfit_friends"),
      ]);
      if (challengesData) setChallenges(JSON.parse(challengesData));
      if (friendsData) setFriends(JSON.parse(friendsData));
    } catch (e) {
      console.error("Failed to load friend challenge data:", e);
    }
  };

  const saveChallenges = useCallback(async (data: FriendChallenge[]) => {
    setChallenges(data);
    try {
      await AsyncStorage.setItem("@motionfit_challenges", JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save challenges:", e);
    }
  }, []);

  const saveFriends = useCallback(async (data: Friend[]) => {
    setFriends(data);
    try {
      await AsyncStorage.setItem("@motionfit_friends", JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save friends:", e);
    }
  }, []);

  const createChallenge = useCallback(
    async (
      challengerPhone: string,
      challengerName: string,
      challengerAvatar: string,
      opponentPhone: string,
      exerciseType: FriendChallenge["exerciseType"],
      targetReps: number
    ): Promise<FriendChallenge> => {
      const challenge: FriendChallenge = {
        id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        challengerId: challengerPhone,
        challengerName,
        challengerPhone,
        challengerAvatar,
        opponentPhone,
        exerciseType,
        targetReps,
        status: "pending",
        challengerReps: 0,
        opponentReps: 0,
        createdAt: Date.now(),
      };
      await saveChallenges([...challenges, challenge]);
      return challenge;
    },
    [challenges, saveChallenges]
  );

  const acceptChallenge = useCallback(
    async (challengeId: string, opponentPhone: string, opponentName: string, opponentAvatar: string) => {
      const updated = challenges.map((c) =>
        c.id === challengeId
          ? { ...c, status: "accepted" as const, opponentPhone, opponentName, opponentAvatar }
          : c
      );
      await saveChallenges(updated);
    },
    [challenges, saveChallenges]
  );

  const declineChallenge = useCallback(
    async (challengeId: string) => {
      const updated = challenges.map((c) =>
        c.id === challengeId ? { ...c, status: "declined" as const } : c
      );
      await saveChallenges(updated);
    },
    [challenges, saveChallenges]
  );

  const startChallenge = useCallback(
    async (challengeId: string) => {
      const updated = challenges.map((c) =>
        c.id === challengeId ? { ...c, status: "in_progress" as const, startedAt: Date.now() } : c
      );
      await saveChallenges(updated);
    },
    [challenges, saveChallenges]
  );

  const updateChallengeReps = useCallback(
    async (challengeId: string, isChallenger: boolean, reps: number) => {
      const updated = challenges.map((c) =>
        c.id === challengeId
          ? {
              ...c,
              ...(isChallenger ? { challengerReps: reps } : { opponentReps: reps }),
            }
          : c
      );
      await saveChallenges(updated);
    },
    [challenges, saveChallenges]
  );

  const completeChallenge = useCallback(
    async (challengeId: string, winnerId: string, winnerName: string) => {
      const updated = challenges.map((c) =>
        c.id === challengeId
          ? { ...c, status: "completed" as const, completedAt: Date.now(), winnerId, winnerName }
          : c
      );
      await saveChallenges(updated);
    },
    [challenges, saveChallenges]
  );

  const addFriend = useCallback(
    async (phone: string, name: string, avatarId: string, xp: number) => {
      const newFriend: Friend = {
        id: phone,
        name,
        phone,
        avatarId,
        xp,
        addedAt: Date.now(),
      };
      await saveFriends([...friends, newFriend]);
    },
    [friends, saveFriends]
  );

  const removeFriend = useCallback(
    async (phone: string) => {
      await saveFriends(friends.filter((f) => f.phone !== phone));
    },
    [friends, saveFriends]
  );

  const searchFriends = useCallback(async (query: string): Promise<Friend[]> => {
    // In a real app, this would query the backend
    // For now, return local friends matching the query
    return friends.filter(
      (f) => f.name.toLowerCase().includes(query.toLowerCase()) || f.phone.includes(query)
    );
  }, [friends]);

  const pendingInvites = challenges.filter((c) => c.status === "pending");
  const activeChallenges = challenges.filter((c) => c.status === "in_progress");
  const completedChallenges = challenges.filter((c) => c.status === "completed");

  return (
    <FriendChallengeContext.Provider
      value={{
        challenges,
        friends,
        pendingInvites,
        activeChallenges,
        completedChallenges,
        createChallenge,
        acceptChallenge,
        declineChallenge,
        startChallenge,
        updateChallengeReps,
        completeChallenge,
        addFriend,
        removeFriend,
        searchFriends,
      }}
    >
      {children}
    </FriendChallengeContext.Provider>
  );
}

export function useFriendChallenge() {
  const context = useContext(FriendChallengeContext);
  if (!context) {
    throw new Error("useFriendChallenge must be used within FriendChallengeProvider");
  }
  return context;
}
