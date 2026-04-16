import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Switch,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useProfile } from "@/lib/profile-context";
import { useWorkout } from "@/lib/workout-context";
import {
  AVATARS,
  ACHIEVEMENTS,
  VOICE_PERSONAS,
  getLevelInfo,
  type VoicePersona,
} from "@/lib/gamification";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function XPBar({ xp }: { xp: number }) {
  const { current, next, progress } = getLevelInfo(xp);
  return (
    <View style={styles.xpBarContainer}>
      <View style={styles.xpBarLabels}>
        <Text style={[styles.xpBarLabel, { color: current.color }]}>
          Lv {current.level} · {current.title}
        </Text>
        <Text style={styles.xpBarXP}>{xp} XP</Text>
      </View>
      <View style={styles.xpBarBg}>
        <View
          style={[
            styles.xpBarFill,
            { width: `${progress * 100}%`, backgroundColor: current.color },
          ]}
        />
      </View>
      <Text style={styles.xpBarNext}>
        {next.minXP - xp > 0
          ? `${next.minXP - xp} XP to ${next.title}`
          : "Max Level!"}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const { sessions } = useWorkout();

  const avatar = AVATARS.find((a) => a.id === profile.avatarId) ?? AVATARS[0];
  const levelInfo = getLevelInfo(profile.xp);
  const totalReps = sessions.reduce((s, w) => s + w.totalReps, 0);
  const totalCalories = sessions.reduce((s, w) => s + w.caloriesBurned, 0);

  const unlockedAchievements = ACHIEVEMENTS.filter((a) =>
    profile.unlockedAchievements.includes(a.id)
  );
  const lockedAchievements = ACHIEVEMENTS.filter(
    (a) => !profile.unlockedAchievements.includes(a.id)
  );

  const handleVoiceToggle = (val: boolean) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProfile({ voiceEnabled: val });
  };

  const handlePersonaSelect = (persona: VoicePersona) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateProfile({ voicePersona: persona });
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ─── Hero Header ─── */}
        <LinearGradient colors={["#0F0C29", "#302B63"]} style={styles.hero}>
          {/* Avatar */}
          <View style={[styles.avatarCircle, { borderColor: avatar.color }]}>
            <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
          </View>
          <Text style={styles.heroName}>{profile.name}</Text>
          <View style={[styles.levelBadge, { backgroundColor: levelInfo.current.color + "33", borderColor: levelInfo.current.color }]}>
            <Text style={[styles.levelBadgeText, { color: levelInfo.current.color }]}>
              ⚡ {levelInfo.current.title}
            </Text>
          </View>

          {/* XP Bar */}
          <XPBar xp={profile.xp} />

          {/* Streak */}
          <View style={styles.streakRow}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakCount}>{profile.currentStreak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
            {profile.longestStreak > 0 && (
              <Text style={styles.streakBest}>
                (best: {profile.longestStreak})
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* ─── Stats Grid ─── */}
        <View style={styles.statsGrid}>
          {[
            { label: "Workouts", value: sessions.length, emoji: "🏋️", color: "#FF6B35" },
            { label: "Total Reps", value: totalReps, emoji: "🔄", color: "#8B5CF6" },
            { label: "Calories", value: totalCalories, emoji: "🔥", color: "#EF4444" },
            { label: "Challenges", value: profile.completedChallenges.length, emoji: "⚔️", color: "#FFD700" },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ─── Avatar Gallery ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            🎭 Avatars
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>
            {AVATARS.map((av) => {
              const isUnlocked = levelInfo.current.level >= av.unlockLevel;
              const isSelected = profile.avatarId === av.id;
              return (
                <Pressable
                  key={av.id}
                  onPress={() => {
                    if (!isUnlocked) return;
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateProfile({ avatarId: av.id });
                  }}
                  style={({ pressed }) => [
                    styles.avatarItem,
                    {
                      borderColor: isSelected ? av.color : colors.border,
                      backgroundColor: isSelected ? av.color + "22" : colors.surface,
                      opacity: isUnlocked ? 1 : 0.4,
                    },
                    pressed && isUnlocked && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.avatarItemEmoji}>{av.emoji}</Text>
                  <Text style={[styles.avatarItemName, { color: isSelected ? av.color : colors.muted }]}>
                    {av.name}
                  </Text>
                  {!isUnlocked && (
                    <Text style={styles.lockText}>Lv{av.unlockLevel}</Text>
                  )}
                  {isSelected && (
                    <View style={[styles.selectedDot, { backgroundColor: av.color }]} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Voice Coach ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              🎙️ AI Voice Coach
            </Text>
            <Switch
              value={profile.voiceEnabled}
              onValueChange={handleVoiceToggle}
              trackColor={{ false: colors.border, true: "#FF6B35" }}
              thumbColor="#FFFFFF"
            />
          </View>
          {profile.voiceEnabled && (
            <View style={styles.personaList}>
              {(Object.entries(VOICE_PERSONAS) as [VoicePersona, typeof VOICE_PERSONAS[VoicePersona]][]).map(
                ([key, persona]) => (
                  <Pressable
                    key={key}
                    onPress={() => handlePersonaSelect(key)}
                    style={({ pressed }) => [
                      styles.personaCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: profile.voicePersona === key ? "#FF6B35" : colors.border,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={styles.personaEmoji}>{persona.emoji}</Text>
                    <View style={styles.personaInfo}>
                      <Text style={[styles.personaName, { color: colors.foreground }]}>
                        {persona.name}
                      </Text>
                      <Text style={[styles.personaDesc, { color: colors.muted }]}>
                        {persona.description}
                      </Text>
                    </View>
                    {profile.voicePersona === key && (
                      <View style={styles.personaCheck}>
                        <Text style={styles.personaCheckText}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                )
              )}
            </View>
          )}
        </View>

        {/* ─── Achievements ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            🏆 Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </Text>
          <View style={styles.achievementGrid}>
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = profile.unlockedAchievements.includes(achievement.id);
              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    {
                      backgroundColor: unlocked ? colors.surface : colors.background,
                      borderColor: unlocked ? "#FFD700" : colors.border,
                      opacity: unlocked ? 1 : 0.5,
                    },
                  ]}
                >
                  <Text style={[styles.achievementEmoji, { opacity: unlocked ? 1 : 0.4 }]}>
                    {unlocked ? achievement.emoji : "🔒"}
                  </Text>
                  <Text style={[styles.achievementTitle, { color: unlocked ? colors.foreground : colors.muted }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDesc, { color: colors.muted }]}>
                    {achievement.description}
                  </Text>
                  {unlocked && achievement.xpReward > 0 && (
                    <Text style={styles.achievementXP}>+{achievement.xpReward} XP</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── Edit Profile ─── */}
        <View style={[styles.section, { paddingBottom: 0 }]}>
          <Pressable
            onPress={() => router.push("/onboarding" as any)}
            style={({ pressed }) => [
              styles.editBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={[styles.editBtnText, { color: colors.foreground }]}>
              ✏️  Edit Profile & Coach
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 24,
    alignItems: "center",
    gap: 10,
    paddingBottom: 28,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarEmoji: { fontSize: 40 },
  heroName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  levelBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  levelBadgeText: { fontSize: 13, fontWeight: "700" },
  xpBarContainer: { width: "100%", gap: 4, marginTop: 4 },
  xpBarLabels: { flexDirection: "row", justifyContent: "space-between" },
  xpBarLabel: { fontSize: 12, fontWeight: "700" },
  xpBarXP: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  xpBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  xpBarFill: { height: "100%", borderRadius: 4 },
  xpBarNext: { fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "right" },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  streakFire: { fontSize: 20 },
  streakCount: { fontSize: 22, fontWeight: "900", color: "#FF6B35" },
  streakLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  streakBest: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 10,
  },
  statCard: {
    width: "47%",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  statEmoji: { fontSize: 24, marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 12 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  avatarRow: { gap: 10, paddingBottom: 4 },
  avatarItem: {
    width: 72,
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    borderWidth: 2,
    gap: 4,
  },
  avatarItemEmoji: { fontSize: 28 },
  avatarItemName: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  lockText: { fontSize: 9, color: "#F59E0B", fontWeight: "700" },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  personaList: { gap: 10 },
  personaCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  personaEmoji: { fontSize: 28 },
  personaInfo: { flex: 1, gap: 3 },
  personaName: { fontSize: 15, fontWeight: "700" },
  personaDesc: { fontSize: 12, lineHeight: 16 },
  personaCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  personaCheckText: { fontSize: 11, color: "#FFFFFF", fontWeight: "800" },
  achievementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  achievementCard: {
    width: "47%",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    alignItems: "center",
  },
  achievementEmoji: { fontSize: 28, marginBottom: 2 },
  achievementTitle: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  achievementDesc: { fontSize: 11, textAlign: "center", lineHeight: 15 },
  achievementXP: { fontSize: 11, color: "#FFD700", fontWeight: "700" },
  editBtn: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  editBtnText: { fontSize: 15, fontWeight: "600" },
});
