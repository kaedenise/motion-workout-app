import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface GameMode {
  id: string;
  name: string;
  emoji: string;
  description: string;
  route: string;
  color1: string;
  color2: string;
}

const GAME_MODES: GameMode[] = [
  {
    id: "boss-battle",
    name: "Boss Battle",
    emoji: "👹",
    description: "Defeat the AI boss by hitting your rep targets faster",
    route: "/challenge/boss-battle",
    color1: "#EF4444",
    color2: "#DC2626",
  },
  {
    id: "speed-run",
    name: "Speed Run",
    emoji: "⚡",
    description: "Complete reps as fast as possible. Beat the clock!",
    route: "/challenge/speed-run",
    color1: "#F59E0B",
    color2: "#D97706",
  },
  {
    id: "endurance",
    name: "Endurance",
    emoji: "🔥",
    description: "See how many reps you can do without stopping",
    route: "/challenge/endurance",
    color1: "#8B5CF6",
    color2: "#7C3AED",
  },
  {
    id: "gauntlet",
    name: "Gauntlet",
    emoji: "⚔️",
    description: "Chain multiple exercises together for the ultimate test",
    route: "/challenge/gauntlet",
    color1: "#06B6D4",
    color2: "#0891B2",
  },
  {
    id: "treadmill",
    name: "Treadmill",
    emoji: "🏃",
    description: "Run a virtual distance. Track your miles and speed",
    route: "/cardio/treadmill",
    color1: "#10B981",
    color2: "#059669",
  },
  {
    id: "stairmaster",
    name: "Stairmaster",
    emoji: "🪜",
    description: "Climb virtual floors. How high can you go?",
    route: "/cardio/stairmaster",
    color1: "#3B82F6",
    color2: "#2563EB",
  },
];

export default function GamesScreen() {
  const colors = useColors();
  const router = useRouter();

  const handleGamePress = (game: GameMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(game.route as any);
  };

  const renderGameCard = ({ item: game }: { item: GameMode }) => (
    <Pressable
      onPress={() => handleGamePress(game)}
      style={({ pressed }) => [
        styles.gameCard,
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
    >
      <LinearGradient colors={[game.color1, game.color2]} style={styles.gradient}>
        <Text style={styles.gameEmoji}>{game.emoji}</Text>
        <Text style={styles.gameName}>{game.name}</Text>
        <Text style={styles.gameDescription}>{game.description}</Text>
        <View style={styles.playButton}>
          <Text style={styles.playText}>Play ›</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            🎮 Game Modes
          </Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            Challenge yourself with AI and cardio games
          </Text>
        </View>

        {/* Game Grid */}
        <FlatList
          data={GAME_MODES}
          keyExtractor={(item) => item.id}
          renderItem={renderGameCard}
          scrollEnabled={false}
          contentContainerStyle={styles.gameGrid}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />

        {/* Footer Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  gameGrid: {
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  gameCard: {
    flex: 1,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  gameEmoji: {
    fontSize: 48,
  },
  gameName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
  },
  gameDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 16,
  },
  playButton: {
    alignSelf: "flex-end",
  },
  playText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});
