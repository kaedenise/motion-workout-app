import { useCallback, useRef } from "react";
import * as Speech from "expo-speech";
import { Platform } from "react-native";
import { VOICE_PERSONAS, type VoicePersona } from "@/lib/gamification";

const DRILL_LINES = {
  start: [
    "Move it, soldier! Let's go!",
    "No excuses today! Start!",
    "Pain is weakness leaving the body. Begin!",
  ],
  rep: [
    "Keep pushing!",
    "Don't stop now!",
    "Faster! Harder!",
    "Is that all you've got?",
    "Push through the burn!",
  ],
  milestone10: ["Ten reps! Don't you dare stop!", "Ten down, keep going soldier!"],
  milestone25: ["Twenty five! You're halfway there, now push!", "Twenty five reps! No slowing down!"],
  milestone50: ["Fifty reps! Outstanding soldier!", "Half century! You're a machine!"],
  finish: ["Mission complete! Outstanding performance!", "That's how it's done soldier! Dismissed!"],
  idle: ["Stop resting! Get moving!", "Idle time is wasted time! Move!"],
  exercise: {
    "push-up": "Push-up detected! Lock those arms!",
    squat: "Squat position! Drive through those heels!",
    "jumping-jack": "Jumping jacks! Move those arms!",
    "sit-up": "Sit-ups! Core tight, soldier!",
    running: "Running detected! Pump those legs!",
  },
};

const COACH_LINES = {
  start: [
    "Let's do this! You've got this!",
    "Great choice to work out today!",
    "Ready to crush it? Let's go!",
  ],
  rep: [
    "Great work!",
    "Keep it up!",
    "You're doing amazing!",
    "Excellent form!",
    "That's the spirit!",
  ],
  milestone10: ["Ten reps! Awesome job!", "Ten down! You're on fire!"],
  milestone25: ["Twenty five reps! You're crushing it!", "Halfway there! Keep going!"],
  milestone50: ["Fifty reps! Incredible effort!", "Fifty! You're a champion!"],
  finish: ["Amazing workout! You should be proud!", "Fantastic session! See you tomorrow!"],
  idle: ["Take a breath, then keep going!", "Ready when you are!"],
  exercise: {
    "push-up": "Push-up! Great exercise for your chest!",
    squat: "Squats! Perfect for your legs and glutes!",
    "jumping-jack": "Jumping jacks! Great cardio!",
    "sit-up": "Sit-ups! Building that core strength!",
    running: "Running detected! Great cardio session!",
  },
};

const ZEN_LINES = {
  start: [
    "Breathe in. Begin your practice.",
    "Center yourself. The journey starts now.",
    "Be present. Each rep is a moment.",
  ],
  rep: [
    "Breathe.",
    "Stay present.",
    "Feel the movement.",
    "Mind and body as one.",
    "Flow.",
  ],
  milestone10: ["Ten reps. Breathe.", "Ten. Notice the sensation."],
  milestone25: ["Twenty five. You are in flow.", "Halfway. Stay centered."],
  milestone50: ["Fifty reps. Remarkable presence.", "Fifty. You are the movement."],
  finish: ["Your practice is complete. Namaste.", "Rest now. You have done well."],
  idle: ["Rest is also practice.", "Stillness has its place."],
  exercise: {
    "push-up": "Push-up. Feel the earth beneath you.",
    squat: "Squat. Root yourself like a tree.",
    "jumping-jack": "Jumping jacks. Embrace the energy.",
    "sit-up": "Sit-up. Strengthen your center.",
    running: "Running. Feel the rhythm of your breath.",
  },
};

const PERSONA_LINES = { drill: DRILL_LINES, coach: COACH_LINES, zen: ZEN_LINES };

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useVoiceCoach(persona: VoicePersona, enabled: boolean) {
  const lastSpokenRef = useRef<string>("");
  const lastMilestoneRef = useRef<number>(0);
  const lastExerciseRef = useRef<string>("");

  const speak = useCallback(
    async (text: string, priority = false) => {
      if (!enabled || Platform.OS === "web") return;
      if (text === lastSpokenRef.current && !priority) return;

      try {
        const isSpeaking = await Speech.isSpeakingAsync();
        if (isSpeaking && !priority) return;
        if (priority) await Speech.stop();

        lastSpokenRef.current = text;
        const config = VOICE_PERSONAS[persona];

        Speech.speak(text, {
          pitch: config.pitch,
          rate: config.rate,
          language: "en-US",
        });
      } catch {
        // Speech errors are non-critical
      }
    },
    [enabled, persona]
  );

  const announceStart = useCallback(() => {
    const lines = PERSONA_LINES[persona];
    speak(pickRandom(lines.start), true);
  }, [persona, speak]);

  const announceExercise = useCallback(
    (exerciseType: string) => {
      if (exerciseType === lastExerciseRef.current || exerciseType === "idle") return;
      lastExerciseRef.current = exerciseType;
      const lines = PERSONA_LINES[persona];
      const line = lines.exercise[exerciseType as keyof typeof lines.exercise];
      if (line) speak(line, true);
    },
    [persona, speak]
  );

  const announceRep = useCallback(
    (totalReps: number) => {
      const lines = PERSONA_LINES[persona];

      // Milestones
      if (totalReps >= 50 && lastMilestoneRef.current < 50) {
        lastMilestoneRef.current = 50;
        speak(pickRandom(lines.milestone50), true);
        return;
      }
      if (totalReps >= 25 && lastMilestoneRef.current < 25) {
        lastMilestoneRef.current = 25;
        speak(pickRandom(lines.milestone25), true);
        return;
      }
      if (totalReps >= 10 && lastMilestoneRef.current < 10) {
        lastMilestoneRef.current = 10;
        speak(pickRandom(lines.milestone10), true);
        return;
      }

      // Every 5 reps, give encouragement
      if (totalReps > 0 && totalReps % 5 === 0) {
        speak(pickRandom(lines.rep));
      }
    },
    [persona, speak]
  );

  const announceFinish = useCallback(() => {
    const lines = PERSONA_LINES[persona];
    speak(pickRandom(lines.finish), true);
    lastMilestoneRef.current = 0;
    lastExerciseRef.current = "";
  }, [persona, speak]);

  const announceIdle = useCallback(() => {
    const lines = PERSONA_LINES[persona];
    speak(pickRandom(lines.idle));
  }, [persona, speak]);

  const reset = useCallback(() => {
    lastMilestoneRef.current = 0;
    lastExerciseRef.current = "";
    lastSpokenRef.current = "";
  }, []);

  return {
    announceStart,
    announceExercise,
    announceRep,
    announceFinish,
    announceIdle,
    reset,
  };
}
