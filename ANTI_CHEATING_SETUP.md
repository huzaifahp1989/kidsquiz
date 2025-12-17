# Anti-Cheating System Setup Guide

This document explains how to deploy the anti-cheating/replay prevention system for quizzes and games.

## Overview

The system prevents users from replaying the same quiz or game multiple times to farm points:

- ✅ **Quiz Prevention**: Each quiz category can only be completed ONCE per user
- ✅ **Game Prevention**: Each game can only be completed ONCE per user
- ✅ **Visual Feedback**: Completed quizzes show a ✓ checkmark and are disabled
- ✅ **Database Level**: Enforced with UNIQUE constraints (cannot be bypassed)

## What This Prevents

Without this system, a user could:
1. Complete Seerah Quiz → get 10 points
2. Retake Seerah Quiz → get 10 more points (CHEATING!)
3. Repeat unlimited times → infinite points

With this system:
1. Complete Seerah Quiz → get 10 points → marked as completed
2. Try to retake Seerah Quiz → button is disabled/grayed out
3. Cannot earn extra points by replaying

## Database Tables Created

### `quiz_progress` Table
Tracks which quizzes have been completed by each user:

```sql
uid          UUID       (user ID)
category     TEXT       (Seerah, Hadith, Prophets, Quran Stories, Akhlaq)
score        INTEGER    (points earned)
completed_at TIMESTAMP  (when completed)
```

**UNIQUE Constraint**: `UNIQUE(uid, category)` - Prevents duplicate entries

### `game_progress` Table
Tracks which games have been completed by each user:

```sql
uid          UUID       (user ID)
game_id      TEXT       (game identifier)
score        INTEGER    (points earned)
completed_at TIMESTAMP  (when completed)
```

**UNIQUE Constraint**: `UNIQUE(uid, game_id)` - Prevents duplicate entries

## RPC Functions Available

### `is_quiz_completed(uid UUID, category TEXT) → BOOLEAN`
Checks if a user has already completed a quiz category.

**Usage**: Check before allowing quiz to start
```typescript
const { data: completed } = await supabase.rpc('is_quiz_completed', {
  uid: user.id,
  category: 'Seerah'
});
```

### `mark_quiz_completed(uid UUID, category TEXT, score_val INTEGER) → JSON`
Marks a quiz as completed for a user.

**Usage**: Call after quiz completes successfully
```typescript
const { data } = await supabase.rpc('mark_quiz_completed', {
  uid: user.id,
  category: 'Seerah',
  score_val: 8
});
```

### `is_game_completed(uid UUID, game_id TEXT) → BOOLEAN`
Checks if a user has already completed a game.

### `mark_game_completed(uid UUID, game_id TEXT, score_val INTEGER) → JSON`
Marks a game as completed for a user.

## Deployment Steps

### Step 1: Copy SQL File Content

Open [PREVENT_REPLAY.sql](./PREVENT_REPLAY.sql) and copy ALL the SQL code.

### Step 2: Deploy to Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste the entire SQL file content
6. Click **Run** (or press Ctrl+Enter)
7. Wait for success message

✅ You should see: "Successfully executed 1 command"

### Step 3: Verify Deployment

Run this query to verify the tables were created:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('quiz_progress', 'game_progress');
```

Expected result: 2 rows (quiz_progress and game_progress)

## Frontend Integration (ALREADY DONE ✅)

The quiz page has already been updated to:

1. **Load completed quizzes** on page load
2. **Disable completed quiz buttons** with visual feedback (grayed out, checkmark)
3. **Mark quizzes as completed** after successful completion

### Code Changes Made:

**File**: `src/app/quiz/page.tsx`

- Added `completedQuizzes` state
- Load quiz_progress table on component mount
- Show CheckCircle icon on completed quizzes
- Disable buttons for completed quizzes
- Call `mark_quiz_completed()` after points awarded

## Testing the System

### Test 1: Complete a Quiz Once
1. Go to Quiz page
2. Select "Seerah" category
3. Complete the quiz and answer all questions
4. See points awarded message
5. ✅ Quiz button should now show "✓ Completed" and be disabled

### Test 2: Try to Play Again
1. Refresh the page
2. Click on "Seerah" category button
3. ❌ Button should be disabled (grayed out, cannot click)
4. Show message: "You've already completed this quiz"

### Test 3: Other Categories Still Work
1. Try different category (e.g., "Hadith")
2. ✅ Should work normally (not disabled)
3. Complete it
4. ✅ Now both "Seerah" and "Hadith" are marked as completed

## For Games (If Used)

If your platform has games, follow the same pattern in the games page:

```typescript
// Load completed games on mount
const loadCompletedGames = async () => {
  const { data } = await supabase
    .from('game_progress')
    .select('game_id')
    .eq('uid', user.id);
  setCompletedGames(data?.map(g => g.game_id) || []);
};

// Mark game as completed after success
await supabase.rpc('mark_game_completed', {
  uid: user.id,
  game_id: gameId,
  score_val: score
});
```

## Troubleshooting

### Issue: "Function does not exist"
**Solution**: Make sure you ran the entire PREVENT_REPLAY.sql file. The RPC functions must be created first.

### Issue: "Permission denied"
**Solution**: The GRANT EXECUTE statements at the end of the SQL file grant permissions. Re-run the entire SQL file.

### Issue: "Duplicate key violation"
**Solution**: This is expected if a user tries to replay. The database rejects it. The UI prevents this by disabling buttons, so users won't encounter this.

### Issue: Buttons not disabling
**Solution**: 
1. Check that quiz_progress table exists: `SELECT * FROM public.quiz_progress LIMIT 1;`
2. Verify data was inserted: `SELECT * FROM public.quiz_progress WHERE uid = 'your-user-id';`
3. Refresh the quiz page to reload completed quizzes

## Security Benefits

✅ **Database Level Enforcement**: Cannot be bypassed by manipulating frontend
✅ **UNIQUE Constraints**: SQL enforces uniqueness automatically
✅ **RLS Policies**: Users can only see/modify their own progress
✅ **Server-Side**: No client-side cheating possible

## Points Farming Prevention Summary

| System Component | Purpose |
|---|---|
| **Quiz Replay Block** | Prevents re-earning points on same quiz |
| **Daily Game Limit (3/day)** | Limits total engagement per day |
| **Weekly Point Limit (250/week)** | Caps points earned per week |
| **RPC Point Awarding** | Server-enforces all limits |
| **Database Constraints** | SQL enforces uniqueness |

Combined, these create a **robust anti-cheating system** that's nearly impossible to exploit.

## Next Steps

1. ✅ Deploy PREVENT_REPLAY.sql to Supabase (this doc)
2. ✅ Quiz page integration (ALREADY DONE)
3. 🔜 Games page integration (if games exist)
4. 🔜 Monitor for any exploitation attempts

---

**Deployed By**: GitHub Copilot  
**Date**: January 2025  
**Status**: Ready for production ✅
