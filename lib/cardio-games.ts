/**
 * Cardio Game Modes: Treadmill and Stairmaster
 * 
 * These game modes track vertical motion (Z-axis) and horizontal motion (X/Y)
 * to estimate distance traveled or floors climbed based on accelerometer data.
 */

export interface CardioGameState {
  mode: "treadmill" | "stairmaster";
  distance: number; // miles or kilometers
  floors: number;
  duration: number; // seconds
  speed: number; // mph or floors/min
  calories: number;
  startTime: number;
  isActive: boolean;
}

export interface CardioGameConfig {
  mode: "treadmill" | "stairmaster";
  targetDistance?: number; // miles
  targetFloors?: number;
  difficulty: "easy" | "medium" | "hard" | "extreme";
}

/**
 * Estimate distance from accelerometer data
 * 
 * Physics: Each running step = ~0.0003 miles (based on average 5'8" person with 2.5ft stride)
 * We detect steps by looking for peaks in vertical acceleration (Z-axis)
 */
export function estimateTreadmillDistance(
  accelZ: number[],
  sampleRate: number = 20
): { distance: number; stepCount: number; avgSpeed: number } {
  const STEP_THRESHOLD = 0.5; // G's of vertical acceleration
  const DISTANCE_PER_STEP = 0.0003; // miles
  const WINDOW_SIZE = Math.floor(sampleRate * 0.5); // 0.5 second window

  let stepCount = 0;
  let lastPeakTime = 0;
  let peakTimes: number[] = [];

  // Detect peaks in vertical acceleration
  for (let i = 1; i < accelZ.length - 1; i++) {
    if (
      accelZ[i] > STEP_THRESHOLD &&
      accelZ[i] > accelZ[i - 1] &&
      accelZ[i] > accelZ[i + 1]
    ) {
      const timeSinceLast = i - lastPeakTime;
      // Ensure peaks are at least 0.3s apart (realistic step cadence)
      if (timeSinceLast > sampleRate * 0.3) {
        stepCount++;
        lastPeakTime = i;
        peakTimes.push(i);
      }
    }
  }

  const distance = stepCount * DISTANCE_PER_STEP;
  const avgSpeed =
    peakTimes.length > 1
      ? (distance / ((peakTimes[peakTimes.length - 1] - peakTimes[0]) / sampleRate / 3600))
      : 0;

  return { distance, stepCount, avgSpeed };
}

/**
 * Estimate floors climbed from accelerometer data
 * 
 * Physics: Each floor = ~10 feet = ~3 meters vertical
 * We detect floor transitions by looking for sustained vertical acceleration
 * combined with reduced horizontal motion (typical stairmaster pattern)
 */
export function estimateStairmasterFloors(
  accelZ: number[],
  accelX: number[],
  accelY: number[],
  sampleRate: number = 20
): { floors: number; avgSpeed: number; climbRate: number } {
  const VERTICAL_THRESHOLD = 0.3; // G's sustained vertical
  const HORIZONTAL_THRESHOLD = 0.2; // G's max horizontal
  const FLOOR_HEIGHT = 0.003; // miles per floor (10 feet)
  const WINDOW_SIZE = Math.floor(sampleRate * 1); // 1 second window

  let floors = 0;
  let climbSamples = 0;
  let lastFloorTime = 0;

  // Detect climbing motion: sustained vertical with minimal horizontal
  for (let i = WINDOW_SIZE; i < accelZ.length; i++) {
    const verticalAvg = accelZ
      .slice(i - WINDOW_SIZE, i)
      .reduce((a, b) => a + b, 0) / WINDOW_SIZE;

    const horizontalMax = Math.max(
      ...accelX.slice(i - WINDOW_SIZE, i).map(Math.abs),
      ...accelY.slice(i - WINDOW_SIZE, i).map(Math.abs)
    );

    // Climbing detected: high vertical, low horizontal
    if (verticalAvg > VERTICAL_THRESHOLD && horizontalMax < HORIZONTAL_THRESHOLD) {
      climbSamples++;

      // Increment floor every ~1.5 seconds of sustained climbing
      if (climbSamples > sampleRate * 1.5 && i - lastFloorTime > sampleRate * 1.5) {
        floors++;
        lastFloorTime = i;
        climbSamples = 0;
      }
    } else {
      climbSamples = 0;
    }
  }

  const distance = floors * FLOOR_HEIGHT;
  const duration = accelZ.length / sampleRate;
  const avgSpeed = duration > 0 ? (floors / duration) * 60 : 0; // floors per minute
  const climbRate = duration > 0 ? (distance / duration) * 3600 : 0; // miles per hour

  return { floors, avgSpeed, climbRate };
}

/**
 * Calculate calories burned based on cardio game performance
 * 
 * Formula: Calories = (MET * weight_kg * duration_hours)
 * Treadmill MET: 5-10 depending on speed
 * Stairmaster MET: 8-12 depending on intensity
 */
export function calculateCalories(
  mode: "treadmill" | "stairmaster",
  distance: number,
  floors: number,
  duration: number,
  weight: number = 70 // kg, average
): number {
  const durationHours = duration / 3600;

  if (mode === "treadmill") {
    // Estimate speed from distance
    const speedMph = distance / durationHours;
    // MET increases with speed: 5 mph = 5 MET, 8 mph = 8.3 MET, etc.
    const met = Math.min(speedMph * 1.04, 10);
    return Math.round(met * weight * durationHours);
  } else {
    // Stairmaster: MET based on climb rate
    const floorsPerMin = floors / (duration / 60);
    // MET increases with climb rate: 1 floor/min = 8 MET, 2 floors/min = 11 MET
    const met = Math.min(8 + floorsPerMin * 1.5, 12);
    return Math.round(met * weight * durationHours);
  }
}

/**
 * Get difficulty parameters for cardio challenges
 */
export function getCardioChallengeDifficulty(
  mode: "treadmill" | "stairmaster",
  difficulty: "easy" | "medium" | "hard" | "extreme"
): { target: number; timeLimit: number; xpReward: number } {
  const params = {
    treadmill: {
      easy: { target: 0.5, timeLimit: 300, xpReward: 50 },
      medium: { target: 1, timeLimit: 600, xpReward: 100 },
      hard: { target: 2, timeLimit: 900, xpReward: 200 },
      extreme: { target: 3, timeLimit: 1200, xpReward: 300 },
    },
    stairmaster: {
      easy: { target: 10, timeLimit: 300, xpReward: 50 },
      medium: { target: 20, timeLimit: 600, xpReward: 100 },
      hard: { target: 40, timeLimit: 900, xpReward: 200 },
      extreme: { target: 60, timeLimit: 1200, xpReward: 300 },
    },
  };

  return params[mode][difficulty];
}
