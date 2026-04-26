import Animated, { Easing, withTiming, withSequence, withDelay, useSharedValue } from "react-native-reanimated";

/**
 * Particle effect types for different game events
 */
export type ParticleType = "confetti" | "sparkle" | "xp_burst" | "achievement" | "level_up" | "combo";

export interface Particle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rotation: number;
  scale: number;
  opacity: number;
}

export interface ParticleEmitterConfig {
  type: ParticleType;
  x: number;
  y: number;
  count: number;
  velocity?: number;
  spread?: number;
  lifetime?: number;
  colors?: string[];
  size?: number;
}

/**
 * Generate confetti particles
 */
export function generateConfetti(config: ParticleEmitterConfig): Particle[] {
  const particles: Particle[] = [];
  const { x, y, count, velocity = 300, spread = 360, lifetime = 2000, colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181"] } = config;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * spread * (Math.PI / 180);
    const speed = velocity * (0.5 + Math.random() * 0.5);

    const scale = 1;
    const opacity = 1;

    particles.push({
      id: `particle_${i}`,
      type: "confetti",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 100,
      life: 0,
      maxLife: lifetime,
      size: 8 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale,
      opacity,
    });
  }

  return particles;
}

/**
 * Generate sparkle particles
 */
export function generateSparkles(config: ParticleEmitterConfig): Particle[] {
  const particles: Particle[] = [];
  const { x, y, count, velocity = 200, lifetime = 1500, colors = ["#FFD700", "#FFA500", "#FF69B4"] } = config;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = velocity * Math.random();

    const scale = 1;
    const opacity = 1;

    particles.push({
      id: `sparkle_${i}`,
      type: "sparkle",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: lifetime,
      size: 4 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale,
      opacity,
    });
  }

  return particles;
}

/**
 * Generate XP burst particles
 */
export function generateXPBurst(config: ParticleEmitterConfig): Particle[] {
  const particles: Particle[] = [];
  const { x, y, count, velocity = 250, lifetime = 1800 } = config;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = velocity * (0.7 + Math.random() * 0.3);

    const scale = 1;
    const opacity = 1;

    particles.push({
      id: `xp_${i}`,
      type: "xp_burst",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: lifetime,
      size: 6 + Math.random() * 3,
      color: "#00FF00",
      rotation: Math.random() * 360,
      scale,
      opacity,
    });
  }

  return particles;
}

/**
 * Generate achievement unlock particles
 */
export function generateAchievementParticles(config: ParticleEmitterConfig): Particle[] {
  const particles: Particle[] = [];
  const { x, y, count, velocity = 300, lifetime = 2000 } = config;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = velocity * Math.random();

    const scale = 1;
    const opacity = 1;

    particles.push({
      id: `achievement_${i}`,
      type: "achievement",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 50,
      life: 0,
      maxLife: lifetime,
      size: 10 + Math.random() * 5,
      color: "#FFD700",
      rotation: Math.random() * 360,
      scale,
      opacity,
    });
  }

  return particles;
}

/**
 * Generate level-up particles
 */
export function generateLevelUpParticles(config: ParticleEmitterConfig): Particle[] {
  const particles: Particle[] = [];
  const { x, y, count, lifetime = 2500, colors = ["#FF1493", "#00BFFF", "#32CD32", "#FFD700"] } = config;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = 200 + Math.random() * 100;

    const scale = 1;
    const opacity = 1;

    particles.push({
      id: `levelup_${i}`,
      type: "level_up",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: lifetime,
      size: 8 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale,
      opacity,
    });
  }

  return particles;
}

/**
 * Generate combo particles
 */
export function generateComboParticles(config: ParticleEmitterConfig): Particle[] {
  const particles: Particle[] = [];
  const { x, y, count, lifetime = 1500, colors = ["#FF6B6B", "#FFE66D", "#4ECDC4"] } = config;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 150 + Math.random() * 150;

    const scale = 1;
    const opacity = 1;

    particles.push({
      id: `combo_${i}`,
      type: "combo",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: lifetime,
      size: 6 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale,
      opacity,
    });
  }

  return particles;
}

/**
 * Update particle physics
 */
export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * (deltaTime / 1000),
      y: p.y + p.vy * (deltaTime / 1000) + 9.8 * (deltaTime / 1000) ** 2,
      vy: p.vy + 9.8 * (deltaTime / 1000),
      life: p.life + deltaTime,
      rotation: p.rotation + 5,
    }))
    .filter((p) => p.life < p.maxLife);
}

/**
 * Get particle opacity based on life
 */
export function getParticleOpacity(particle: Particle): number {
  const progress = particle.life / particle.maxLife;
  if (progress < 0.2) {
    return progress / 0.2;
  }
  if (progress > 0.8) {
    return 1 - (progress - 0.8) / 0.2;
  }
  return 1;
}

/**
 * Get particle scale based on life
 */
export function getParticleScale(particle: Particle): number {
  const progress = particle.life / particle.maxLife;
  if (progress < 0.1) {
    return progress / 0.1;
  }
  if (progress > 0.9) {
    return 1 - (progress - 0.9) / 0.1;
  }
  return 1;
}

/**
 * Create animation for particle
 */
export function createParticleAnimation(particle: Particle) {
  return {
    scale: withSequence(
      withTiming(getParticleScale(particle), {
        duration: particle.maxLife,
        easing: Easing.out(Easing.quad),
      })
    ),
    opacity: withSequence(
      withTiming(getParticleOpacity(particle), {
        duration: particle.maxLife,
        easing: Easing.out(Easing.quad),
      })
    ),
  };
}

/**
 * Create burst animation config
 */
export function createBurstAnimationConfig(type: ParticleType, x: number, y: number) {
  const configs: Record<ParticleType, ParticleEmitterConfig> = {
    confetti: { type: "confetti", x, y, count: 30, velocity: 400, spread: 360, lifetime: 2500 },
    sparkle: { type: "sparkle", x, y, count: 20, velocity: 250, lifetime: 1500 },
    xp_burst: { type: "xp_burst", x, y, count: 15, velocity: 300, lifetime: 1800 },
    achievement: { type: "achievement", x, y, count: 25, velocity: 350, lifetime: 2000 },
    level_up: { type: "level_up", x, y, count: 35, velocity: 400, lifetime: 2500 },
    combo: { type: "combo", x, y, count: 20, velocity: 300, lifetime: 1500 },
  };

  return configs[type] || configs.confetti;
}
