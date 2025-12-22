# Points Reward System - Setup & Implementation Guide

## 📋 Overview

This guide walks you through setting up a secure points reward system with:
- ✅ 100 points/day earning limit
- ✅ Persistent total, weekly, monthly points (never reset)
- ✅ Daily counter reset each day
- ✅ Secure RLS policies
- ✅ Server-side validation via Supabase RPC function

---

## 🚀 Quick Setup (3 Steps)

### STEP 1: Run the SQL Setup

1. **Go to your Supabase Dashboard:**
   - URL: https://app.supabase.com
   - Project: jlqrbbqsuksncrxjcmbc (or your project)

2. **Go to SQL Editor**
   - Click "New Query"
   - Copy all SQL from: `SUPABASE_POINTS_SYSTEM.sql`
   - Click "Run"
   - Wait for completion (should show ✓ success)

**What this does:**
- ✅ Creates `users_points` table with all required columns
- ✅ Enables RLS (Row Level Security)
- ✅ Creates RLS policies for security
- ✅ Creates `award_points()` RPC function
- ✅ Grants permissions to authenticated users

### STEP 2: Verify Setup

Run these verification queries in SQL Editor to confirm everything works:

```sql
-- Check table exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users_points'
ORDER BY ordinal_position;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'users_points';

-- Check function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'award_points';
```

Expected results:
- ✅ Table has 8 columns: id, user_id, total_points, weekly_points, monthly_points, today_points, last_earned_date, created_at, updated_at
- ✅ rowsecurity = true
- ✅ routine_name = award_points

### STEP 3: Use in Your App

The points service is already created at: `src/lib/points-service.ts`

#### Example 1: Award 10 points to user

```typescript
import { awardPoints } from '@/lib/points-service'

// In your quiz completion handler
const result = await awardPoints(10)

if (result.success) {
  console.log(`+${result.points_awarded} points!`)
  console.log(`Total: ${result.total_points}`)
  console.log(`Today: ${result.today_points}/100`)
} else {
  console.log(result.message) // e.g., "Daily limit reached"
}
```

#### Example 2: Check remaining daily allowance

```typescript
import { checkDailyAllowance } from '@/lib/points-service'

const allowance = await checkDailyAllowance()
console.log(`You can earn ${allowance.remaining} more points today`)
```

#### Example 3: Get user's current points

```typescript
import { getUserPoints } from '@/lib/points-service'

const points = await getUserPoints()
if (points) {
  console.log(`Total: ${points.total_points}`)
  console.log(`Weekly: ${points.weekly_points}`)
  console.log(`Monthly: ${points.monthly_points}`)
  console.log(`Today: ${points.today_points}`)
}
```

#### Example 4: Award with user-friendly message

```typescript
import { awardPointsWithMessage } from '@/lib/points-service'

const result = await awardPointsWithMessage(10)
console.log(result.message) // "🎉 +10 points! Total: 50"
```

---

## 📊 How It Works

### Daily Limit Logic

```
User starts day → today_points = 0
┌─────────────────────────────────┐
│                                 │
├─ Quiz completed, award 10 pts ──┤ today_points = 10 ✓
├─ Game completed, award 15 pts ──┤ today_points = 25 ✓
├─ Another game, award 70 pts ────┤ today_points = 95 ✓
├─ Another quiz, award 10 pts ────┤ today_points = 105 ❌ BLOCKED
│    (would exceed 100)            │
│                                 │
└─────────────────────────────────┘
        ↓ Next Day ↓
today_points resets to 0, user gets new 100 allowance
```

### Point Columns

| Column | Behavior | When Updated |
|--------|----------|--------------|
| `total_points` | ✅ Always increases | Every award_points() call |
| `weekly_points` | ✅ Always increases | Every award_points() call |
| `monthly_points` | ✅ Always increases | Every award_points() call |
| `today_points` | 🔄 Resets daily | New day: reset to 0, then add points |
| `last_earned_date` | 📅 Tracks last action | Every award_points() call |

**Important:** No automatic reset of totals. Daily limit is just the `today_points` counter.

### Function Response

#### Success Response
```json
{
  "success": true,
  "message": "Points awarded successfully",
  "points_awarded": 10,
  "total_points": 50,
  "today_points": 10,
  "weekly_points": 50,
  "monthly_points": 50
}
```

#### Daily Limit Exceeded
```json
{
  "success": false,
  "message": "Daily limit of 100 points reached",
  "points_awarded": 0,
  "today_points": 100,
  "daily_limit": 100
}
```

---

## 🔒 Security

### RLS Policies

Three RLS policies are in place:

1. **"Users can view own points"** - SELECT
   - Users can only see their own points row

2. **"Award points RPC function"** - UPDATE
   - Users can only update their own row
   - Direct updates are prevented; must use award_points() function

3. **"System can create points records"** - INSERT
   - Allows creating new user point records

### Function Security

The `award_points()` function is:
- ✅ **SECURITY DEFINER**: Runs with Supabase system permissions
- ✅ **auth.uid()**: Only awards points to logged-in user
- ✅ **Server-side validation**: All business logic on backend
- ✅ **Atomic**: All updates happen or none happen

Users cannot:
- ❌ Manipulate daily_points directly
- ❌ Reset their totals
- ❌ See other users' points (except via public views)
- ❌ Bypass the 100 points/day limit

---

## 🧪 Testing

### Test 1: Basic Award Points

```sql
-- Simulate awarding 10 points
SELECT award_points(10);

-- Expected response shows success: true, points_awarded: 10
```

### Test 2: Daily Limit

```sql
-- Award 50 points
SELECT award_points(50);

-- Award another 50 points
SELECT award_points(50);

-- Try to award 10 more (should fail)
SELECT award_points(10);

-- Expected: "Daily limit of 100 points reached"
```

### Test 3: New Day Reset

```sql
-- After midnight, award points again
-- The daily counter resets but totals keep increasing
SELECT award_points(10);

-- Check that today_points went back down
SELECT today_points, total_points FROM users_points WHERE user_id = auth.uid();

-- Expected: today_points = 10 (reset), total_points = 70 (increased)
```

---

## 📝 Common Integration Points

### Quiz Completion
```typescript
async function completeQuiz(quizId: string, score: number) {
  // Save quiz result
  await saveQuizResult(quizId, score)
  
  // Award points based on score
  const pointsEarned = Math.floor(score / 10) // Example: 80 score = 8 points
  const result = await awardPoints(pointsEarned)
  
  return result
}
```

### Game Completion
```typescript
async function completeGame(gameId: string, points: number) {
  // Save game result
  await saveGameResult(gameId, points)
  
  // Award points
  const result = await awardPoints(points)
  
  return result
}
```

### Daily Challenge
```typescript
async function claimDailyChallenge() {
  // Award 20 points for daily challenge
  const result = await awardPoints(20)
  
  if (result.success) {
    showNotification(`+${result.points_awarded} points!`)
  } else {
    showNotification('Daily limit reached')
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "User not authenticated" error

**Solution:**
- Make sure user is logged in before calling awardPoints()
- Check that Firebase/Supabase auth is initialized

### Issue: "Permission denied" on users_points table

**Solution:**
- Verify RLS policies were created (see Step 2 verification)
- Check that user is authenticated
- Ensure GRANT permissions were executed

### Issue: Function not found error

**Solution:**
- Verify the award_points function was created (see Step 2)
- Check function name spelling: `award_points` (lowercase with underscore)
- Refresh the Supabase client

### Issue: Points not updating

**Solution:**
- Check that user_id in users_points matches auth.uid()
- Verify users_points table has data for the user
- Check the response object - it shows if daily limit was hit

---

## 📋 Files Created/Modified

- ✅ **SUPABASE_POINTS_SYSTEM.sql** - SQL setup with function and RLS
- ✅ **src/lib/points-service.ts** - TypeScript service for your app
- ✅ **POINTS_SYSTEM_SETUP.md** - This guide

---

## ✅ Checklist

- [ ] Copy SQL from SUPABASE_POINTS_SYSTEM.sql
- [ ] Run SQL in Supabase SQL Editor
- [ ] Verify setup with verification queries
- [ ] Check users_points table exists
- [ ] Test award_points() function
- [ ] Import points-service in your components
- [ ] Call awardPoints() on quiz/game completion
- [ ] Test daily limit (try awarding 101 points)
- [ ] Verify totals never reset (test next day)

---

## 🎯 Next Steps

1. **Integrate into Quiz System**
   - Add `awardPoints()` call to quiz completion handler

2. **Integrate into Games**
   - Add `awardPoints()` call to game completion handler

3. **Add Points Display**
   - Show `today_points / 100` on user profile
   - Show total_points on leaderboard

4. **Add Notification**
   - Show "+X points" message on award
   - Show daily limit message when hit

---

## 📞 Support

If you encounter issues:

1. Check error message in console
2. Verify SQL was executed successfully
3. Check RLS policies exist
4. Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'award_points'`
5. Test with `SELECT award_points(10)` in SQL Editor
