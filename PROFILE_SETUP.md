# Profile & Points System Setup Guide

## Overview
This system manages user profiles, tracks points, and maintains leaderboards for the Islamic Kids Learning Platform.

## Architecture

### 1. Database Tables

#### `users` table
Stores user profile and progress data.

```sql
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE,
  name TEXT,
  age INTEGER,
  role TEXT DEFAULT 'kid',
  points INTEGER DEFAULT 0,           -- All-time points
  weeklyPoints INTEGER DEFAULT 0,     -- Weekly points (reset each Sunday)
  monthlyPoints INTEGER DEFAULT 0,    -- Monthly points (reset each month)
  level TEXT DEFAULT 'Beginner',      -- Calculated from points
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### `quiz_progress` table
Tracks quiz completions.

```sql
CREATE TABLE IF NOT EXISTS public.quiz_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  quizId TEXT NOT NULL,
  difficulty TEXT,
  score INTEGER DEFAULT 0,
  completedAt TIMESTAMP DEFAULT NOW()
);
```

#### `game_progress` table
Tracks game plays.

```sql
CREATE TABLE IF NOT EXISTS public.game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  gameId TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  playedAt TIMESTAMP DEFAULT NOW()
);
```

### 2. Leaderboard Views

#### Weekly Leaderboard
Shows top users by weekly points.
```sql
SELECT uid, email, name, age, weeklyPoints as points, level, rank
FROM leaderboard_weekly
ORDER BY rank ASC
LIMIT 100;
```

#### Monthly Leaderboard
Shows top users by monthly points.
```sql
SELECT uid, email, name, age, monthlyPoints as points, level, rank
FROM leaderboard_monthly
ORDER BY rank ASC
LIMIT 100;
```

#### All-Time Leaderboard
Shows top users by total points.
```sql
SELECT uid, email, name, age, points, level, rank
FROM leaderboard_all_time
ORDER BY rank ASC
LIMIT 100;
```

## Level System

Points are automatically converted to levels:

| Level | Points Required |
|-------|-----------------|
| Beginner | 0+ |
| Novice | 25+ |
| Intermediate | 100+ |
| Advanced | 250+ |
| Expert | 500+ |
| Master | 1000+ |

## API Functions

### Profile Service (`src/lib/profile-service.ts`)

#### `getProfile(uid: string): Promise<KidProfile | null>`
Fetches a user's profile.

```typescript
const profile = await getProfile('user-uid-here');
// Returns: { uid, email, name, age, role, points, weeklyPoints, monthlyPoints, level, ... }
```

#### `createProfile(uid, email, name, age): Promise<KidProfile | null>`
Creates a new user profile.

```typescript
const profile = await createProfile('uid', 'user@example.com', 'Ali', 10);
// Returns: newly created profile
```

#### `addPoints(uid: string, pointsToAdd: number): Promise<KidProfile | null>`
Adds points to a user's profile and updates all point types.

```typescript
const updated = await addPoints('uid', 10);
// Adds 10 to: points, weeklyPoints, monthlyPoints
// Automatically recalculates level
// Returns: updated profile
```

#### `calculateLevel(points: number): string`
Calculates level from points.

```typescript
const level = calculateLevel(500);
// Returns: "Expert"
```

#### `getLeaderboard(period: 'weekly' | 'monthly' | 'all_time'): Promise<any[]>`
Fetches leaderboard data.

```typescript
const weekly = await getLeaderboard('weekly');
// Returns: [{ uid, name, level, points, rank }, ...]
```

#### `getUserRank(uid: string, period: 'weekly' | 'monthly' | 'all_time'): Promise<number | null>`
Gets a user's rank in a leaderboard.

```typescript
const rank = await getUserRank('uid', 'weekly');
// Returns: 5 (5th place)
```

## Usage Examples

### In Game Component
```typescript
import { addPoints } from '@/lib/profile-service';

// When user completes a game correctly:
const earned = 10;
const updated = await addPoints(user.id, earned);

if (updated) {
  showToast(`🎉 +${earned} points! Level: ${updated.level}`);
} else {
  showToast('⚠️ Could not save points');
}
```

### In Quiz Component
```typescript
import { addPoints } from '@/lib/profile-service';

// When quiz is completed:
const points = calculateScorePoints(score);
const updated = await addPoints(user.id, points);

if (updated) {
  showToast(`✅ Quiz complete! +${points} points`);
}
```

### In Leaderboard Component
```typescript
import { getLeaderboard, getUserRank } from '@/lib/profile-service';

// Fetch leaderboard
const leaderboard = await getLeaderboard('weekly');

// Get user's rank
const rank = await getUserRank(user.id, 'weekly');
showRankBadge(`🏆 Rank: ${rank}`);
```

## RLS Policies

All tables have Row-Level Security (RLS) enabled with policies that allow:

- ✅ Authenticated users to read/write their own data
- ✅ Public read access for leaderboards
- ✅ Anonymous users to create profiles and earn points

See `SUPABASE_ALL_POLICIES.sql` for complete policy definitions.

## Setup Checklist

- [ ] Run `SUPABASE_ALL_POLICIES.sql` in Supabase SQL Editor
- [ ] Verify tables exist: users, quiz_progress, game_progress
- [ ] Verify views exist: leaderboard_weekly, leaderboard_monthly, leaderboard_all_time
- [ ] Enable RLS on all tables
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Test: Go to `/debug` page
- [ ] Click "Ensure Profile" button
- [ ] Should see profile created without PGRST204 error
- [ ] Play a game or quiz
- [ ] Verify points appear in profile and leaderboard

## Troubleshooting

### PGRST204 Error (No rows found)
**Cause**: RLS policies too restrictive or table doesn't exist
**Fix**: Re-run `SUPABASE_ALL_POLICIES.sql`

### Points not updating
**Cause**: Profile not created or RLS blocking UPDATE
**Fix**: Go to `/debug` page, click "Ensure Profile", check console errors

### Leaderboard empty
**Cause**: Views not created or no data in users table
**Fix**: Verify views exist in Supabase, ensure at least one profile has points > 0

### Anonymous users can't save points
**Cause**: RLS policies don't allow anonymous writes
**Fix**: Ensure `anon_insert_own` and `anon_update_own` policies exist

## Files Updated

- ✅ `src/lib/profile-service.ts` - New profile API service
- ✅ `src/app/leaderboard/page.tsx` - Updated leaderboard component
- ✅ `SUPABASE_ALL_POLICIES.sql` - Complete RLS setup (must run in Supabase)

## Next Steps

1. ✅ Run `SUPABASE_ALL_POLICIES.sql` in Supabase
2. ✅ Hard refresh browser
3. ✅ Test profile creation at `/debug`
4. ✅ Play games/quizzes to earn points
5. ✅ Check leaderboard at `/leaderboard`
