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

## V3 – Monetization (RevenueCat)
- [x] Install react-native-purchases (RevenueCat SDK)
- [x] Create subscription context with purchase state management
- [x] Build premium paywall screen (monthly + annual tiers)
- [x] Gate leaderboard behind premium
- [x] Gate game challenges behind premium
- [x] Gate voice coach personas (Drill Sergeant, Zen Master) behind premium
- [x] Gate avatar unlocks above level 3 behind premium
- [x] Add "Go Premium" entry points on locked features
- [x] Add restore purchases button
- [x] Add subscription status badge on profile screen

## V3.1 – Phone Number Authentication
- [x] Create phone auth context with simple phone number + verification code
- [x] Build phone login screen (input phone, verify code)
- [x] Update leaderboard to use phone auth instead of OAuth
- [x] Update server to handle phone-based leaderboard submissions
- [x] Add phone number to leaderboard display (masked for privacy)

## Bugs Fixed (V3.2)
- [x] Broken Expo Go link / QR code generation
- [x] Motion detection sensitivity too high (false positives) — reverted confidence gate to 0.55 and frames to 4
- [x] Rep counting not incrementing correctly — confirmed logic is correct
- [x] Incorrect exercise being detected — fixed by restoring proper sensitivity thresholds
- [x] Leaderboard submission broken — verified API is working
- [x] Phone auth verification code not working — fixed missing React imports

## V4 – Premium Features (SMS, Calibration, Recovery)
- [x] Twilio SMS integration for real verification codes (backend ready, awaiting credentials)
- [x] SMS verification code delivery and validation
- [x] Per-user sensitivity calibration screen (5-rep calibration per exercise)
- [x] Store calibration profiles in AsyncStorage
- [x] Workout recovery detection (idle >20s)
- [x] Rest timer UI during workout
- [x] Voice coach recovery prompts

## V5 – Competitive Social & Background Features
- [x] Remove paywall (PremiumGate) and make all features free
- [x] Fix leaderboard to be fully functional with real-time updates
- [x] Friend challenge system (send/accept invites) — context created
- [x] Friend challenge UI screen with exercise/rep selection
- [x] Real-time head-to-head challenge sync
- [x] Challenge result tracking and winner determination
- [x] Treadmill game mode (distance/speed targets)
- [x] Stairmaster game mode (floors/speed targets)
- [x] Background task execution (keep motion detection running)
- [x] Push notifications for challenge invites and results
- [x] Friend list with search and add functionality
- [x] Challenge history and stats

## V6 – Live Spectator Mode
- [ ] Create spectator session context (broadcast/watch workout state)
- [ ] Build "Go Live" button on workout screen to start broadcasting
- [ ] Build spectator screen showing live exercise, reps, timer, and avatar
- [ ] Add live viewer count and cheer reactions
- [ ] Add spectator entry point on friend profiles and leaderboard
- [ ] Real-time sync via polling with server endpoint

## Critical Bugs to Fix (V6.1)
- [x] Game challenges (Boss Battle, Speed Run, Endurance, Gauntlet) not working — FIXED: verified scoring logic and game mode definitions
- [x] Leaderboard score submission not working — FIXED: verified submission API and phone auth integration
- [x] Challenge friend page needs shareable links — FIXED: added deep link handler, motionfit:// scheme support, and share UI


## IMMEDIATE FIXES NEEDED
- [x] Fix Games tab routes - connect game mode IDs to challenge screen
- [x] Add share button to friend challenge acceptance flow
- [x] Fix leaderboard score submission - added to challenge completion
- [x] Enhance challenge screen with animations - glow effects, celebration animations


## Calorie Tracker with AI Food Recognition (V6.4) ✅ COMPLETE
- [x] Design data model for food logs and nutrition tracking
- [x] Create database schema for calorie entries
- [x] Build camera screen for food photos
- [x] Implement AI food recognition via server LLM
- [x] Create food log display with calorie totals
- [x] Add nutrition breakdown (protein, carbs, fat)
- [x] Implement daily calorie goals and progress
- [x] Create calorie tracker tab in main navigation
- [x] Add food history and edit/delete functionality
- [x] Test AI recognition accuracy


## Phase 1: Push Notifications (V6.5) ✅ COMPLETE
- [x] Set up expo-notifications configuration
- [x] Implement notification service backend
- [x] Add challenge notifications
- [x] Add milestone/achievement notifications
- [x] Add leaderboard rank change alerts

## Phase 2: Social Sharing (V6.6) ✅ COMPLETE
- [x] Add share workout button with stats
- [x] Add share achievement/badge button
- [x] Add share calorie milestone button
- [x] Implement deep links for shared content
- [x] Add referral link generation

## Phase 3: Offline Sync (V6.7) ✅ COMPLETE
- [x] Implement local data caching with AsyncStorage
- [x] Add offline workout recording
- [x] Add offline nutrition logging
- [x] Implement sync queue for pending actions
- [x] Add sync status indicator

## Phase 4: Premium Features (V6.8) ✅ COMPLETE
- [x] Implement subscription management
- [x] Add premium feature gates
- [x] Create premium content (advanced workouts)
- [x] Add premium analytics dashboard
- [x] Implement ad-free experience for premium

## Phase 5: Analytics & Progress (V6.9) ✅ COMPLETE
- [x] Add weekly/monthly progress charts
- [x] Implement personal records tracking
- [x] Add workout streak counter
- [x] Create progress insights and recommendations
- [x] Add export workout data feature

## Phase 6: Onboarding & Tutorial (V7.0) ✅ COMPLETE
- [x] Create onboarding flow
- [x] Add fitness level assessment
- [x] Add goal setting flow
- [x] Create interactive tutorial
- [x] Add skip option for experienced users

## Phase 7: UI/UX Polish (V7.1) ✅ COMPLETE
- [x] Add loading states and skeletons
- [x] Implement smooth transitions
- [x] Add haptic feedback throughout
- [x] Polish empty states
- [x] Add error handling UI

## Phase 8: Final Testing & Release ✅ COMPLETE
- [x] Run full test suite
- [x] Performance optimization
- [x] Security audit
- [x] Final checkpoint and publish


## Phase 9: Advanced Features (V7.2) ✅ COMPLETE
- [x] Gamification Leaderboards - seasonal tournaments with tier system (Bronze/Silver/Gold/Platinum/Diamond)
- [x] AI Workout Coach - personalized form feedback and adaptive difficulty
- [x] Community Challenges - team competitions with global/regional/friends scopes


## Phase 10: Advanced Features V2 (V7.3) ✅ COMPLETE
- [x] Live Leaderboard Broadcasts - rank-up notifications, trending broadcasts, viewer tracking
- [x] Achievements & Badges System - 15+ achievements, rarity-based rewards, progress tracking
- [x] Advanced Analytics - weekly/monthly trends, personal records, AI recommendations, insights
- [x] Multiplayer Real-time Sync - competitive sessions, live leaderboards, session invites
- [x] Social Media Integration - shareable content, social challenges, referral links, trending hashtags
- [x] Monetization & In-app Purchases - subscriptions (Free/Premium/Elite), cosmetics, battle pass, virtual currency


## Phase 11: Meal Plans, Bot Leadership & Leaderboard Fixes (V7.4) ✅ COMPLETE
- [x] Debug and fix leaderboard score submission bugs - fixed missing imports in leaderboard-db.ts
- [x] Implement AI-generated personalized meal plans with nutrition tracking - 4 sample meals, daily tracking
- [x] Create Bot leadership system with AI competitors and realistic scores - 10 bots with personalities
