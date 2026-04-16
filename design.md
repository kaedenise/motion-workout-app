# MotionFit – Design Document

## Brand Identity
- **App Name:** MotionFit
- **Tagline:** Move Smart. Train Hard.
- **Primary Color:** #FF6B35 (energetic orange — evokes energy, action, sport)
- **Secondary Color:** #1A1A2E (deep navy — premium, focused)
- **Accent:** #00D4AA (teal — success, completion)
- **Background (light):** #F8F9FA
- **Background (dark):** #0D0D1A
- **Surface (light):** #FFFFFF
- **Surface (dark):** #1A1A2E
- **Font:** System default (SF Pro on iOS, Roboto on Android)

---

## Screen List

1. **Home Screen** (`/`) — Dashboard with quick-start, recent workouts, and stats summary
2. **Workout Screen** (`/workout`) — Active workout with real-time motion detection, rep counter, exercise name
3. **History Screen** (`/history`) — Past workout sessions list with stats
4. **Session Detail Screen** (`/history/[id]`) — Detailed breakdown of a single past workout

---

## Primary Content and Functionality

### Home Screen
- Greeting header with date
- "Start Workout" large CTA button
- Quick stats row: total workouts, total reps, total calories (estimated)
- Recent workouts list (last 3 sessions)
- Exercise guide cards (supported exercises with how-to tips)

### Workout Screen
- Large detected exercise name (e.g., "Push-Up", "Squat", "Jumping Jack")
- Rep counter (large, bold number)
- Live motion confidence indicator (bar/ring)
- Elapsed time timer
- Sensor data visualizer (small waveform or bars for x/y/z)
- Stop/Finish button
- Exercise selector (manual override if auto-detection is wrong)
- Keep-awake enabled while workout is active

### History Screen
- FlatList of past sessions sorted by date
- Each item: date, duration, total reps, exercises detected, estimated calories
- Empty state with illustration and "Start your first workout" CTA

### Session Detail Screen
- Session date and total duration
- Exercises breakdown table (exercise name, reps, duration)
- Estimated calories burned
- Back navigation

---

## Key User Flows

### Start Workout Flow
1. User opens app → Home Screen
2. Taps "Start Workout" → Workout Screen opens
3. Phone detects motion → exercise name and reps update in real time
4. User finishes → taps "Finish Workout"
5. Session saved → redirected to History or Home

### View History Flow
1. User taps "History" tab → History Screen
2. Taps a session card → Session Detail Screen
3. Views breakdown → taps back

---

## Supported Exercises (Motion Detection)

| Exercise | Detection Method | Key Signal |
|----------|-----------------|------------|
| Push-Up | Accelerometer Z-axis oscillation (phone on floor) | Z-axis peaks |
| Squat | Accelerometer Y-axis oscillation (phone in pocket) | Y-axis dip/rise |
| Jumping Jack | High magnitude spikes + periodicity | Total magnitude peaks |
| Sit-Up | Accelerometer Y+Z combined (phone on chest) | Y-axis forward tilt |
| Running/Jogging | High-frequency periodic magnitude | Step cadence |
| Rest/Idle | Low magnitude, low variance | Near-static |

---

## Color Choices

```
primary:    #FF6B35 (orange) — CTAs, active states, rep counter
secondary:  #1A1A2E (navy)  — headers, dark backgrounds
accent:     #00D4AA (teal)  — success, completion badges
background: #F8F9FA / #0D0D1A
surface:    #FFFFFF / #1A1A2E
foreground: #1A1A2E / #F0F0F0
muted:      #6B7280 / #9CA3AF
border:     #E5E7EB / #2D2D4E
```

---

## Tab Bar

| Tab | Icon | Screen |
|-----|------|--------|
| Home | house.fill | Home Screen |
| Workout | figure.run | Workout Screen |
| History | clock.fill | History Screen |
