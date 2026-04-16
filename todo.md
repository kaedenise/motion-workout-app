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
