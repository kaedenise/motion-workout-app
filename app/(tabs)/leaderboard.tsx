import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useProfile } from "@/lib/profile-context";
import { useWorkout } from "@/lib/workout-context";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { AVATARS, getLevelInfo } from "@/lib/gamification";
import { usePhoneAuth } from "@/lib/phone-auth-context";
import { useRouter } from "expo-router";
import type { LeaderboardEntry } from "@/drizzle/schema";
import { PremiumGate } from "@/components/premium-gate";
import { useSubscription } from "@/lib/subscription-context";

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function LeaderboardRow({
  entry,
  rank,
  isMe,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isMe: boolean;
}) {
  const colors = useColors();
  const avatar = AVATARS.find((a) => a.id === entry.avatarId) ?? AVATARS[0];
  const levelInfo = getLevelInfo(entry.xp);
  const medal = rank <= 3 ? RANK_MEDALS[rank - 1] : null;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: isMe ? "#FF6B3522" : colors.surface,
          borderColor: isMe ? "#FF6B35" : colors.border,
        },
      ]}
    >
      {/* Rank */}
      <View style={styles.rankCol}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={[styles.rankNum, { color: colors.muted }]}>#{rank}</Text>
        )}
      </View>

      {/* Avatar */}
      <View style={[styles.avatarCircle, { borderColor: avatar.color }]}>
        <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
      </View>

      {/* Info */}
      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {entry.displayName}
          </Text>
          {isMe && <Text style={styles.meTag}>YOU</Text>}
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.levelText, { color: levelInfo.current.color }]}>
            Lv{levelInfo.current.level} {levelInfo.current.title}
          </Text>
          {entry.currentStreak > 0 && (
            <Text style={styles.streakText}>🔥{entry.currentStreak}</Text>
          )}
        </View>
      </View>

      {/* XP */}
      <View style={styles.xpCol}>
        <Text style={[styles.xpValue, { color: "#FFD700" }]}>{entry.xp.toLocaleString()}</Text>
        <Text style={[styles.xpLabel, { color: colors.muted }]}>XP</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isPremium } = useSubscription();
  const { phoneNumber, isAuthenticated } = usePhoneAuth();
  const { profile } = useProfile();
  const { sessions } = useWorkout();

  const { data: topEntries, isLoading, refetch } = trpc.leaderboard.getTop.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const submitMutation = trpc.leaderboard.submit.useMutation({
    onSuccess: () => refetch(),
  });

  const totalReps = sessions.reduce((s, w) => s + w.totalReps, 0);

  const handleSubmit = async () => {
    if (!isAuthenticated || !phoneNumber) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await submitMutation.mutateAsync({
      phoneNumber,
      displayName: profile.name,
      avatarId: profile.avatarId,
      xp: profile.xp,
      totalReps,
      totalWorkouts: sessions.length,
      currentStreak: profile.currentStreak,
    });
  };

  const handleLogin = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/phone-login");
  };

  const entries = topEntries ?? [];
  const myEntry = entries.find((e) => e.phoneNumber === phoneNumber);

  return (
    <PremiumGate
      featureName="Global Leaderboard"
      description="Compete with athletes worldwide. See how you rank against the best."
      icon="🏆"
      unlocked={isPremium}
    >
    <ScreenContainer>
      {/* Header */}
      <LinearGradient colors={["#0F0C29", "#1A1A2E"]} style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Global Leaderboard</Text>
        <Text style={styles.headerSub}>Top {entries.length} athletes worldwide</Text>
      </LinearGradient>

      {/* Auth / Submit Banner */}
      {!isAuthenticated || !phoneNumber ? (
        <Pressable
          onPress={handleLogin}
          style={({ pressed }) => [styles.authBanner, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient
            colors={["#FF6B35", "#FF4500"]}
            style={styles.authBannerGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.authBannerText}>
              🔐  Sign in to join the leaderboard
            </Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [styles.submitBanner, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8 }]}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color="#FF6B35" />
          ) : (
            <Text style={[styles.submitBannerText, { color: colors.foreground }]}>
              {myEntry
                ? `📊  Update my score (${profile.xp} XP)`
                : "📤  Submit my score to leaderboard"}
            </Text>
          )}
        </Pressable>
      )}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading rankings...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Be the first!
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            No one has submitted their score yet. Sign in and claim the top spot!
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <LeaderboardRow
              entry={item}
              rank={index + 1}
              isMe={item.phoneNumber === phoneNumber}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </ScreenContainer>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  authBanner: { marginHorizontal: 16, marginTop: 12, borderRadius: 14, overflow: "hidden" },
  authBannerGrad: { padding: 14, alignItems: "center" },
  authBannerText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  submitBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  submitBannerText: { fontSize: 14, fontWeight: "600" },
  list: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  rankCol: { width: 36, alignItems: "center" },
  medal: { fontSize: 22 },
  rankNum: { fontSize: 14, fontWeight: "700" },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 22 },
  infoCol: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "700", flexShrink: 1 },
  meTag: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FF6B35",
    backgroundColor: "#FF6B3522",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelText: { fontSize: 12, fontWeight: "600" },
  streakText: { fontSize: 12 },
  xpCol: { alignItems: "flex-end" },
  xpValue: { fontSize: 16, fontWeight: "800" },
  xpLabel: { fontSize: 11 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
