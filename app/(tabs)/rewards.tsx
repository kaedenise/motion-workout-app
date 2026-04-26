import { ScrollView, View, Text, Pressable, FlatList, Image } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";
import {
  getAllRewards,
  getRewardsByTier,
  getUserPoints,
  redeemReward,
  getActiveRedemptions,
  type Reward,
  type RedemptionRecord,
  type RewardTier,
} from "@/lib/rewards-system";
import { triggerMicroInteraction } from "@/lib/micro-interactions";

const TIERS: RewardTier[] = ["bronze", "silver", "gold", "platinum", "diamond"];

export default function RewardsScreen() {
  const colors = useColors();
  const [userPoints, setUserPoints] = useState(0);
  const [selectedTier, setSelectedTier] = useState<RewardTier>("bronze");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"marketplace" | "redeemed">("marketplace");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const points = await getUserPoints("user123"); // Replace with actual user ID
      const allRewards = await getAllRewards();
      const userRedemptions = await getActiveRedemptions("user123");

      setUserPoints(points);
      setRewards(allRewards);
      setRedemptions(userRedemptions);
    } catch (error) {
      console.error("Failed to load rewards:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeemReward(reward: Reward) {
    try {
      await triggerMicroInteraction({ type: "button_press", hapticFeedback: "light" });

      if (userPoints < reward.pointsCost) {
        alert("Not enough points to redeem this reward");
        return;
      }

      const redemption = await redeemReward("user123", reward.id);
      if (redemption) {
        setUserPoints(userPoints - reward.pointsCost);
        setRedemptions([...redemptions, redemption]);
        alert(`Reward redeemed! Code: ${redemption.code}`);
      }
    } catch (error) {
      console.error("Failed to redeem reward:", error);
    }
  }

  const tierRewards = rewards.filter((r) => r.tier === selectedTier && r.active);

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Points Header */}
        <View className="bg-primary p-6 rounded-2xl mb-6">
          <Text className="text-white text-sm font-medium mb-2">Available Points</Text>
          <Text className="text-white text-5xl font-bold">{userPoints.toLocaleString()}</Text>
          <Text className="text-white/80 text-sm mt-2">Earn more by completing workouts and challenges</Text>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row gap-2 mb-6">
          <Pressable
            onPress={() => setActiveTab("marketplace")}
            className={cn("flex-1 py-3 rounded-lg items-center", activeTab === "marketplace" ? "bg-primary" : "bg-surface")}
          >
            <Text className={cn("font-semibold", activeTab === "marketplace" ? "text-white" : "text-foreground")}>
              Marketplace
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("redeemed")}
            className={cn("flex-1 py-3 rounded-lg items-center", activeTab === "redeemed" ? "bg-primary" : "bg-surface")}
          >
            <Text className={cn("font-semibold", activeTab === "redeemed" ? "text-white" : "text-foreground")}>
              Redeemed ({redemptions.length})
            </Text>
          </Pressable>
        </View>

        {activeTab === "marketplace" ? (
          <>
            {/* Tier Filter */}
            <View className="mb-6">
              <Text className="text-foreground font-semibold mb-3">Filter by Tier</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                {TIERS.map((tier) => (
                  <Pressable
                    key={tier}
                    onPress={() => {
                      setSelectedTier(tier);
                      triggerMicroInteraction({ type: "button_press", hapticFeedback: "light" });
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full",
                      selectedTier === tier ? "bg-primary" : "bg-surface border border-border"
                    )}
                  >
                    <Text className={cn("font-semibold capitalize", selectedTier === tier ? "text-white" : "text-foreground")}>
                      {tier}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Rewards List */}
            <View className="gap-3">
              {tierRewards.map((reward) => (
                <View key={reward.id} className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-foreground font-bold text-lg">{reward.name}</Text>
                      <Text className="text-muted text-sm mt-1">{reward.description}</Text>
                    </View>
                    <View className="bg-primary/20 px-3 py-1 rounded-full">
                      <Text className="text-primary font-bold text-sm">{reward.pointsCost}</Text>
                    </View>
                  </View>

                  {reward.partner && (
                    <Text className="text-muted text-xs mb-3">By {reward.partner}</Text>
                  )}

                  <View className="flex-row justify-between items-center">
                    <Text className="text-muted text-xs">
                      {reward.totalAvailable - reward.claimedCount} / {reward.totalAvailable} available
                    </Text>
                    <Pressable
                      onPress={() => handleRedeemReward(reward)}
                      disabled={userPoints < reward.pointsCost}
                      className={cn(
                        "px-4 py-2 rounded-lg",
                        userPoints >= reward.pointsCost ? "bg-primary" : "bg-muted/30"
                      )}
                    >
                      <Text className={cn("font-semibold text-sm", userPoints >= reward.pointsCost ? "text-white" : "text-muted")}>
                        Redeem
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Redeemed Rewards */}
            <View className="gap-3">
              {redemptions.length > 0 ? (
                redemptions.map((redemption) => (
                  <View key={redemption.id} className="bg-surface rounded-xl p-4 border border-border">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-foreground font-bold">{redemption.rewardName}</Text>
                        <Text className="text-muted text-xs mt-1">
                          Redeemed {new Date(redemption.redeemedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        className={cn(
                          "px-3 py-1 rounded-full",
                          redemption.status === "claimed" ? "bg-success/20" : "bg-warning/20"
                        )}
                      >
                        <Text className={cn("text-xs font-semibold capitalize", redemption.status === "claimed" ? "text-success" : "text-warning")}>
                          {redemption.status}
                        </Text>
                      </View>
                    </View>

                    {redemption.code && (
                      <View className="bg-background rounded-lg p-3 mt-3 border border-border">
                        <Text className="text-muted text-xs mb-1">Redemption Code</Text>
                        <Text className="text-foreground font-mono font-bold text-lg">{redemption.code}</Text>
                      </View>
                    )}

                    <Text className="text-muted text-xs mt-3">Points spent: {redemption.pointsSpent}</Text>
                  </View>
                ))
              ) : (
                <View className="items-center justify-center py-12">
                  <Text className="text-muted text-center">No redeemed rewards yet</Text>
                  <Text className="text-muted text-xs text-center mt-2">Start earning points to redeem rewards!</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
