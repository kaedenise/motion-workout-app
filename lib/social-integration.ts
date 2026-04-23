import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SocialPost {
  id: string;
  userId: string;
  displayName: string;
  platform: "twitter" | "instagram" | "facebook" | "tiktok";
  content: string;
  image?: string;
  metrics: {
    likes: number;
    shares: number;
    comments: number;
  };
  timestamp: number;
  achievement?: string;
}

export interface ShareableContent {
  type: "workout" | "achievement" | "leaderboard" | "challenge";
  title: string;
  description: string;
  stats: Record<string, number | string>;
  image: string;
  hashtags: string[];
  callToAction: string;
}

export interface SocialChallenge {
  id: string;
  name: string;
  description: string;
  hashtag: string;
  platform: "twitter" | "instagram" | "tiktok";
  startDate: number;
  endDate: number;
  participants: string[];
  reward: string;
}

export interface ReferralLink {
  id: string;
  userId: string;
  code: string;
  platform: "twitter" | "instagram" | "facebook" | "sms" | "email";
  createdAt: number;
  clicks: number;
  conversions: number;
  reward: number;
}

const POSTS_KEY = "@motionfit_social_posts";
const CHALLENGES_KEY = "@motionfit_social_challenges";
const REFERRALS_KEY = "@motionfit_referral_links";

/**
 * Generate shareable workout content
 */
export function generateWorkoutShareContent(
  displayName: string,
  totalReps: number,
  avgFormScore: number,
  caloriesBurned: number,
  exerciseType: string
): ShareableContent {
  return {
    type: "workout",
    title: `🏋️ ${displayName}'s Workout`,
    description: `Just completed ${totalReps} reps of ${exerciseType} with ${avgFormScore}% form score!`,
    stats: {
      reps: totalReps,
      formScore: `${avgFormScore}%`,
      calories: caloriesBurned,
      exercise: exerciseType,
    },
    image: "workout_badge",
    hashtags: ["#MotionFit", "#FitnessJourney", "#WorkoutGoals", "#FormMatters"],
    callToAction: "Join me on MotionFit and compete!",
  };
}

/**
 * Generate shareable achievement content
 */
export function generateAchievementShareContent(
  displayName: string,
  achievementName: string,
  badge: string,
  rarity: string
): ShareableContent {
  return {
    type: "achievement",
    title: `🎉 ${displayName} Unlocked ${achievementName}!`,
    description: `Just earned the ${rarity} badge: ${badge} on MotionFit!`,
    stats: {
      achievement: achievementName,
      rarity: rarity,
      badge: badge,
    },
    image: "achievement_badge",
    hashtags: ["#MotionFit", "#Achievement", "#FitnessGoals", "#Unlocked"],
    callToAction: "Can you unlock this achievement too?",
  };
}

/**
 * Generate shareable leaderboard content
 */
export function generateLeaderboardShareContent(
  displayName: string,
  rank: number,
  tier: string,
  xp: number
): ShareableContent {
  return {
    type: "leaderboard",
    title: `🏆 ${displayName} is #${rank} on MotionFit!`,
    description: `Ranked #${rank} with ${xp} XP in the ${tier} tier. Can you beat me?`,
    stats: {
      rank: rank,
      tier: tier,
      xp: xp,
    },
    image: "leaderboard_rank",
    hashtags: ["#MotionFit", "#Leaderboard", "#FitnessCompetition", "#TopRanked"],
    callToAction: "Join MotionFit and challenge me!",
  };
}

/**
 * Generate shareable challenge content
 */
export function generateChallengeShareContent(
  displayName: string,
  challengeName: string,
  targetReps: number,
  exerciseType: string
): ShareableContent {
  return {
    type: "challenge",
    title: `⚡ ${displayName} Challenged You!`,
    description: `${challengeName}: Complete ${targetReps} reps of ${exerciseType}. Can you beat their score?`,
    stats: {
      challenge: challengeName,
      reps: targetReps,
      exercise: exerciseType,
    },
    image: "challenge_badge",
    hashtags: ["#MotionFit", "#Challenge", "#FitnessBattle", "#AcceptTheChallenge"],
    callToAction: "Accept the challenge on MotionFit!",
  };
}

/**
 * Create social post
 */
export async function createSocialPost(
  userId: string,
  displayName: string,
  platform: "twitter" | "instagram" | "facebook" | "tiktok",
  content: string,
  image?: string,
  achievement?: string
): Promise<SocialPost> {
  try {
    const post: SocialPost = {
      id: `post_${Date.now()}`,
      userId,
      displayName,
      platform,
      content,
      image,
      metrics: {
        likes: 0,
        shares: 0,
        comments: 0,
      },
      timestamp: Date.now(),
      achievement,
    };

    const existing = await getSocialPosts();
    existing.push(post);
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(existing));

    return post;
  } catch (error) {
    console.error("Failed to create social post:", error);
    throw error;
  }
}

/**
 * Get social posts
 */
export async function getSocialPosts(): Promise<SocialPost[]> {
  try {
    const data = await AsyncStorage.getItem(POSTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get social posts:", error);
    return [];
  }
}

/**
 * Create social challenge
 */
export async function createSocialChallenge(
  name: string,
  description: string,
  hashtag: string,
  platform: "twitter" | "instagram" | "tiktok",
  durationDays: number = 7
): Promise<SocialChallenge> {
  try {
    const challenge: SocialChallenge = {
      id: `challenge_${Date.now()}`,
      name,
      description,
      hashtag,
      platform,
      startDate: Date.now(),
      endDate: Date.now() + durationDays * 24 * 60 * 60 * 1000,
      participants: [],
      reward: "Exclusive badge and 500 XP",
    };

    const existing = await getSocialChallenges();
    existing.push(challenge);
    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(existing));

    return challenge;
  } catch (error) {
    console.error("Failed to create social challenge:", error);
    throw error;
  }
}

/**
 * Get social challenges
 */
export async function getSocialChallenges(): Promise<SocialChallenge[]> {
  try {
    const data = await AsyncStorage.getItem(CHALLENGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get social challenges:", error);
    return [];
  }
}

/**
 * Join social challenge
 */
export async function joinSocialChallenge(challengeId: string, userId: string): Promise<void> {
  try {
    const challenges = await getSocialChallenges();
    const challenge = challenges.find((c) => c.id === challengeId);

    if (challenge && !challenge.participants.includes(userId)) {
      challenge.participants.push(userId);
      await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    }
  } catch (error) {
    console.error("Failed to join social challenge:", error);
  }
}

/**
 * Generate referral link
 */
export async function generateReferralLink(
  userId: string,
  platform: "twitter" | "instagram" | "facebook" | "sms" | "email"
): Promise<ReferralLink> {
  try {
    const code = `MF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const link: ReferralLink = {
      id: `referral_${Date.now()}`,
      userId,
      code,
      platform,
      createdAt: Date.now(),
      clicks: 0,
      conversions: 0,
      reward: 0,
    };

    const existing = await getReferralLinks();
    existing.push(link);
    await AsyncStorage.setItem(REFERRALS_KEY, JSON.stringify(existing));

    return link;
  } catch (error) {
    console.error("Failed to generate referral link:", error);
    throw error;
  }
}

/**
 * Get referral links
 */
export async function getReferralLinks(): Promise<ReferralLink[]> {
  try {
    const data = await AsyncStorage.getItem(REFERRALS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get referral links:", error);
    return [];
  }
}

/**
 * Track referral click
 */
export async function trackReferralClick(code: string): Promise<void> {
  try {
    const links = await getReferralLinks();
    const link = links.find((l) => l.code === code);

    if (link) {
      link.clicks += 1;
      await AsyncStorage.setItem(REFERRALS_KEY, JSON.stringify(links));
    }
  } catch (error) {
    console.error("Failed to track referral click:", error);
  }
}

/**
 * Track referral conversion
 */
export async function trackReferralConversion(code: string, reward: number): Promise<void> {
  try {
    const links = await getReferralLinks();
    const link = links.find((l) => l.code === code);

    if (link) {
      link.conversions += 1;
      link.reward += reward;
      await AsyncStorage.setItem(REFERRALS_KEY, JSON.stringify(links));
    }
  } catch (error) {
    console.error("Failed to track referral conversion:", error);
  }
}

/**
 * Get referral stats
 */
export async function getReferralStats(userId: string): Promise<{
  totalLinks: number;
  totalClicks: number;
  totalConversions: number;
  totalReward: number;
}> {
  try {
    const links = await getReferralLinks();
    const userLinks = links.filter((l) => l.userId === userId);

    return {
      totalLinks: userLinks.length,
      totalClicks: userLinks.reduce((sum, l) => sum + l.clicks, 0),
      totalConversions: userLinks.reduce((sum, l) => sum + l.conversions, 0),
      totalReward: userLinks.reduce((sum, l) => sum + l.reward, 0),
    };
  } catch (error) {
    console.error("Failed to get referral stats:", error);
    return {
      totalLinks: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalReward: 0,
    };
  }
}

/**
 * Get trending hashtags
 */
export async function getTrendingHashtags(): Promise<Array<{ tag: string; count: number }>> {
  try {
    const posts = await getSocialPosts();
    const hashtagCounts: Record<string, number> = {};

    posts.forEach((post) => {
      const hashtags = post.content.match(/#\w+/g) || [];
      hashtags.forEach((tag) => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(hashtagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  } catch (error) {
    console.error("Failed to get trending hashtags:", error);
    return [];
  }
}
