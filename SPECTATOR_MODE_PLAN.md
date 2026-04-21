# Live Spectator Mode – Detailed Implementation Plan

## Overview
Live Spectator Mode allows users to broadcast their workouts in real-time so friends can watch, cheer, and react with emojis. This feature enhances social engagement and creates a community-driven fitness experience.

---

## Architecture

### 1. Data Model

#### Broadcast Session
```typescript
interface BroadcastSession {
  id: string;                    // Unique broadcast ID
  broadcasterPhone: string;      // Phone number of person working out
  broadcasterName: string;       // Display name
  broadcasterAvatar: string;     // Avatar emoji
  startedAt: number;             // Timestamp when broadcast started
  exercise: string;              // Current exercise (push-up, squat, etc.)
  reps: number;                  // Current rep count
  totalReps: number;             // Target reps
  isActive: boolean;             // Whether broadcast is still live
  viewers: number;               // Count of active viewers
  reactions: ReactionEvent[];    // Recent emoji reactions
  duration: number;              // Elapsed time in seconds
}

interface ReactionEvent {
  id: string;
  viewerName: string;
  emoji: string;                 // 🔥, 💪, 🎉, 👏, 🚀, etc.
  timestamp: number;
}

interface SpectatorSession {
  id: string;
  broadcastId: string;
  viewerPhone: string;
  viewerName: string;
  joinedAt: number;
  lastHeartbeat: number;         // For detecting inactive viewers
}
```

### 2. Backend API Endpoints (tRPC)

#### Broadcast Management
- `spectator.startBroadcast(phone, name, avatar)` → `{ broadcastId, sessionId }`
- `spectator.stopBroadcast(broadcastId)` → `{ success }`
- `spectator.updateBroadcast(broadcastId, exercise, reps, totalReps)` → `{ success }`

#### Viewer Management
- `spectator.joinBroadcast(broadcastId, viewerPhone, viewerName)` → `{ sessionId, broadcast }`
- `spectator.leaveBroadcast(broadcastId, sessionId)` → `{ success }`
- `spectator.getBroadcast(broadcastId)` → `{ broadcast }`
- `spectator.sendReaction(broadcastId, emoji, viewerName)` → `{ success }`
- `spectator.listActiveBroadcasts()` → `{ broadcasts[] }`

#### Polling/Real-time Updates
- `spectator.pollBroadcast(broadcastId, lastUpdate)` → `{ broadcast, newReactions[] }`

### 3. Database Schema

#### broadcasts table
```sql
CREATE TABLE broadcasts (
  id TEXT PRIMARY KEY,
  broadcaster_phone TEXT NOT NULL,
  broadcaster_name TEXT NOT NULL,
  broadcaster_avatar TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  is_active BOOLEAN DEFAULT true,
  total_viewers INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_broadcasts_phone ON broadcasts(broadcaster_phone);
CREATE INDEX idx_broadcasts_active ON broadcasts(is_active);
```

#### broadcast_events table
```sql
CREATE TABLE broadcast_events (
  id TEXT PRIMARY KEY,
  broadcast_id TEXT NOT NULL REFERENCES broadcasts(id),
  event_type TEXT NOT NULL, -- 'exercise_change', 'rep_count', 'reaction'
  exercise TEXT,
  rep_count INTEGER,
  emoji TEXT,
  viewer_name TEXT,
  timestamp INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_broadcast ON broadcast_events(broadcast_id);
```

#### spectators table
```sql
CREATE TABLE spectators (
  id TEXT PRIMARY KEY,
  broadcast_id TEXT NOT NULL REFERENCES broadcasts(id),
  viewer_phone TEXT NOT NULL,
  viewer_name TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  left_at INTEGER,
  last_heartbeat INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spectators_broadcast ON spectators(broadcast_id);
```

---

## Frontend Implementation

### Phase 1: Broadcast Context & State Management

**File:** `lib/spectator-context.tsx`

```typescript
interface SpectatorContextType {
  // Broadcaster state
  isBroadcasting: boolean;
  broadcastId: string | null;
  broadcastSession: BroadcastSession | null;
  
  // Viewer state
  watchingBroadcastId: string | null;
  currentBroadcast: BroadcastSession | null;
  viewers: SpectatorSession[];
  
  // Actions
  startBroadcast: (phone: string, name: string, avatar: string) => Promise<void>;
  stopBroadcast: () => Promise<void>;
  updateBroadcast: (exercise: string, reps: number, totalReps: number) => Promise<void>;
  
  joinBroadcast: (broadcastId: string, phone: string, name: string) => Promise<void>;
  leaveBroadcast: () => Promise<void>;
  sendReaction: (emoji: string) => Promise<void>;
  
  // Polling
  pollBroadcast: () => Promise<void>;
}
```

**Key Features:**
- Manages broadcast lifecycle (start, update, stop)
- Handles viewer joining/leaving
- Manages reaction events
- Implements polling mechanism for real-time updates (every 1-2 seconds)

### Phase 2: Workout Screen Integration

**File:** `app/(tabs)/workout.tsx` (modify existing)

**Add:**
- "Go Live" button in the top-right corner (only visible during active workout)
- Button shows broadcast status (🔴 LIVE with viewer count)
- Toggles broadcast on/off

**Implementation:**
```typescript
const handleToggleBroadcast = async () => {
  if (!isBroadcasting) {
    await spectator.startBroadcast(phoneNumber, profile.name, profile.avatarId);
  } else {
    await spectator.stopBroadcast();
  }
};

// In render:
{phase === "active" && (
  <Pressable onPress={handleToggleBroadcast}>
    <Text>{isBroadcasting ? "🔴 LIVE" : "📡 Go Live"}</Text>
  </Pressable>
)}
```

### Phase 3: Spectator Screen

**File:** `app/spectator/[broadcastId].tsx` (new)

**Layout:**
```
┌─────────────────────────────────┐
│  [Back]  Broadcaster Name  [X]  │
├─────────────────────────────────┤
│                                 │
│         Avatar Emoji (Large)    │
│                                 │
│    Current Exercise: Push-Up    │
│    Reps: 15 / 30               │
│    Duration: 2:45              │
│    Viewers: 12                 │
│                                 │
├─────────────────────────────────┤
│  Recent Reactions:              │
│  🔥 🔥 💪 🎉 👏 🚀 🔥 💪      │
├─────────────────────────────────┤
│  [🔥] [💪] [🎉] [👏] [🚀]     │
│  Reaction Buttons               │
└─────────────────────────────────┘
```

**Features:**
- Display broadcaster info (name, avatar, level)
- Show live exercise and rep count with progress bar
- Display elapsed duration
- Show viewer count
- Recent reactions feed (last 10 reactions)
- Reaction buttons (5 emoji options)
- Auto-refresh every 1-2 seconds via polling
- Graceful handling when broadcast ends

### Phase 4: Broadcast Discovery

**File:** `app/(tabs)/friends.tsx` (modify existing)

**Add New Section:**
```
┌─────────────────────────────────┐
│  🔴 LIVE NOW                    │
├─────────────────────────────────┤
│  [Avatar] Friend Name           │
│  Push-Up • 15/30 • 👥 8        │
│  [Watch]                        │
├─────────────────────────────────┤
│  [Avatar] Another Friend        │
│  Squat • 20/25 • 👥 5          │
│  [Watch]                        │
└─────────────────────────────────┘
```

**Implementation:**
- Query `spectator.listActiveBroadcasts()` on screen focus
- Refresh every 5 seconds
- Show only friends who are currently broadcasting
- Tap to join broadcast

### Phase 5: Leaderboard Integration

**File:** `app/(tabs)/leaderboard.tsx` (modify existing)

**Add:**
- "🔴 LIVE" badge next to users currently broadcasting
- Tap badge to watch their broadcast
- Show "Watching" indicator if user is currently viewing someone

---

## Implementation Phases & Timeline

### Phase 1: Backend Setup (2-3 hours)
1. Create database schema (broadcasts, broadcast_events, spectators tables)
2. Implement tRPC endpoints for broadcast management
3. Implement polling endpoint for real-time updates
4. Add reaction tracking to database

### Phase 2: Context & State (1-2 hours)
1. Create SpectatorContext with full state management
2. Implement broadcast lifecycle (start, update, stop)
3. Implement viewer lifecycle (join, leave, poll)
4. Add error handling and retry logic

### Phase 3: Workout Integration (1 hour)
1. Add "Go Live" button to workout screen
2. Update broadcast state during workout
3. Stop broadcast when workout ends
4. Add broadcast status indicator

### Phase 4: Spectator Screen (2-3 hours)
1. Create spectator screen UI
2. Implement polling mechanism
3. Add reaction buttons and animation
4. Handle broadcast end gracefully
5. Add viewer count display

### Phase 5: Discovery & Integration (1-2 hours)
1. Add "Live Now" section to friends screen
2. Add live badges to leaderboard
3. Implement friend filtering for broadcasts
4. Add watch notifications

### Phase 6: Testing & Polish (1-2 hours)
1. Unit tests for context logic
2. Integration tests for broadcast flow
3. UI/UX polish and animations
4. Performance optimization (polling frequency, memory)

---

## Key Technical Considerations

### Real-time Updates Strategy
- **Polling vs WebSocket:** Use polling (simpler, no server infrastructure) with 1-2 second intervals
- **Optimization:** Only poll if actively watching a broadcast
- **Heartbeat:** Track viewer heartbeat to clean up inactive sessions

### Reaction Animation
```typescript
// Reaction appears at random position, floats up, fades out
Animated.sequence([
  Animated.timing(opacity, { toValue: 1, duration: 100 }),
  Animated.parallel([
    Animated.timing(translateY, { toValue: -50, duration: 1000 }),
    Animated.timing(opacity, { toValue: 0, duration: 800, delay: 200 }),
  ]),
]).start();
```

### Performance Optimization
- Limit reactions displayed to last 10
- Clean up old broadcast records (>24 hours)
- Implement viewer timeout (5 minutes of no heartbeat = remove)
- Batch update broadcasts every 2 seconds instead of per-rep

### Error Handling
- Handle broadcast ended while watching (show "Broadcast ended" screen)
- Handle network disconnection (show "Connection lost" with retry)
- Handle viewer limit exceeded (graceful degradation)

---

## Success Metrics

1. **Engagement:** % of workouts that are broadcasted
2. **Social:** Average viewers per broadcast
3. **Retention:** Users who watch broadcasts vs. those who don't
4. **Performance:** Polling latency, reaction delivery time
5. **Stability:** Broadcast completion rate (% that don't crash)

---

## Future Enhancements

1. **Leaderboard Reactions:** Show reaction counts on leaderboard
2. **Broadcast History:** Save broadcasts for replay (24-48 hours)
3. **Scheduled Broadcasts:** Users can announce upcoming workouts
4. **Group Broadcasts:** Multiple people working out together
5. **Badges:** "Top Broadcaster" or "Most Watched" badges
6. **Notifications:** Notify friends when they go live
7. **Recording:** Save broadcasts to profile
8. **Comments:** Text chat during broadcast

---

## File Structure

```
app/
  (tabs)/
    workout.tsx          [MODIFY] Add "Go Live" button
    friends.tsx          [MODIFY] Add "Live Now" section
    leaderboard.tsx      [MODIFY] Add live badges
  spectator/
    [broadcastId].tsx    [NEW] Spectator screen
lib/
  spectator-context.tsx  [MODIFY] Enhance with full implementation
server/
  routers/
    spectator.ts         [NEW] tRPC endpoints
tests/
  spectator.test.ts      [NEW] Unit tests
```

---

## Dependencies

- `@trpc/server` (already installed)
- `expo-haptics` (already installed for feedback)
- `react-native-reanimated` (already installed for animations)
- No new external dependencies needed

---

## Estimated Total Time: 8-14 hours

- Backend: 2-3 hours
- Frontend Context: 1-2 hours
- UI Implementation: 5-7 hours
- Testing & Polish: 1-2 hours
