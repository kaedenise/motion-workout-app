# MotionFit – Project TODO

## Branding & Setup
- [x] Generate app logo and configure branding
- [x] Update theme colors (orange primary, navy secondary, teal accent)
- [x] Configure app.config.ts with app name and logo URL
- [x] Add HIGH_SAMPLING_RATE_SENSORS permission to app.config.ts

## Navigation
- [x] Add Home, Workout, History tabs with correct icons
- [x] Add Session Detail screen (stack route)

## Core Engine
- [x] Create motion detection hook (useMotionDetector) using Accelerometer + Gyroscope
- [x] Implement exercise classification algorithm (push-up, squat, jumping jack, sit-up, running, idle)
- [x] Implement rep counting logic with debounce
- [x] Create workout session context/store with AsyncStorage persistence

## Screens
- [x] Home Screen: greeting, quick stats, recent workouts, exercise guide cards
- [x] Workout Screen: exercise name, rep counter, timer, sensor visualizer, finish button
- [x] History Screen: FlatList of past sessions, empty state
- [x] Session Detail Screen: breakdown table, calories, duration

## Polish
- [x] Keep-awake during active workout
- [x] Haptic feedback on rep detection
- [x] Smooth animations on rep counter increment
- [x] Confidence indicator for exercise detection

## V2 – Premium Features
- [x] User onboarding screen (name, avatar selection, fitness level)
- [x] User profile system with XP, level, rank title, avatar, and streak
- [x] Avatar selection screen (12+ unique avatars)
- [x] XP/leveling engine (earn XP per rep, bonus for streaks and challenges)
- [x] Achievement badges system (first workout, 100 reps, 7-day streak, etc.)
- [x] Daily quest system (e.g., "Do 20 push-ups today" with XP reward)
- [x] Game-style exercise challenges (Boss Battle, Speed Run, Endurance mode)
- [x] Global leaderboard (backend DB + tRPC API, top 50 users by XP)
- [x] AI voice coach using expo-speech (rep counting, encouragement, exercise tips)
- [x] Voice coach persona selector (Drill Sergeant, Friendly Coach, Zen Master)
- [x] Profile tab with stats, badges, level progress bar
- [x] Premium dark theme with gradient cards and glow effects
- [x] Streak tracker with fire animation
- [x] Level-up celebration animation
- [x] Database schema: leaderboard_entries, user_profiles tables

## V2.1 – Motion Detection Accuracy
- [x] Rewrite exercise classification with tighter per-exercise thresholds
- [x] Increase sampling rate to 20 Hz for better signal resolution
- [x] Use larger sliding window (30 samples) for more stable classification
- [x] Add axis-specific dominant motion detection per exercise
- [x] Improve rep counting debounce and peak detection per exercise
- [x] Add minimum confidence gate before switching exercises
