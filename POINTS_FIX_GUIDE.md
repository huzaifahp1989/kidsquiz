# Points System Fix Guide

## Problem
Points were not updating when playing games and quizzes.

## Root Causes
1. **Missing or incorrect RPC functions** in Supabase
2. **RLS policies** might be blocking updates
3. **Fallback logic** in profile-service not handling RPC failures properly

## What Was Fixed

### 1. Updated `profile-service.ts`
- Enhanced `addPoints()` function to:
  - First try the `add_points` RPC function
  - Fall back to direct database updates if RPC fails
  - Properly calculate badges (1 badge per 250 points)
  - Better error logging

### 2. Created SQL Fix Script: `FIX_POINTS_SYSTEM.sql`
This script must be run in your Supabase SQL Editor. It will:
- Ensure all required columns exist in the `users` table
- Fix RLS policies for `users`, `game_progress`, and `quiz_progress` tables
- Create/update the `add_points` RPC function with proper logic
- Create/update `mark_game_completed` and `mark_quiz_completed` functions
- Grant proper permissions to authenticated users

## How to Apply the Fix

### Step 1: Run the SQL Script in Supabase
1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `FIX_POINTS_SYSTEM.sql`
5. Click **Run** to execute the script
6. Verify there are no errors

### Step 2: Verify the Fix
After running the SQL script, check:

```sql
-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'game_progress', 'quiz_progress');

-- 2. Check if policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('users', 'game_progress', 'quiz_progress');

-- 3. Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('add_points', 'mark_game_completed', 'mark_quiz_completed', 'calculate_level');

-- 4. Test the add_points function (replace with a real user ID)
SELECT public.add_points('your-user-id-here'::uuid, 10);
```

### Step 3: Test in the Application
1. Sign in to your application
2. Play a game and check if points are awarded
3. Take a quiz and check if points are awarded
4. Check the browser console (F12) for any errors
5. Verify points appear in your profile

## Expected Behavior After Fix

### Games
- When you complete a task correctly, you should see: `⭐ +X points`
- Points should update in real-time
- Daily game counter should increment
- Profile should refresh automatically

### Quizzes
- When you complete a quiz, you should see: `⭐ +X points! (Y games left today)`
- Points accumulate for each correct answer
- Quiz completion is tracked to prevent replaying
- Badges are awarded every 250 points

## Troubleshooting

### If points still don't update:

1. **Check browser console (F12)**
   - Look for errors related to `add_points`, `RPC`, or `Supabase`
   - Common errors:
     - "Function not found" → Run the SQL script again
     - "Permission denied" → Check RLS policies
     - "Invalid refresh token" → Sign out and sign in again

2. **Check Supabase logs**
   - Go to Supabase Dashboard → Logs
   - Look for errors when `add_points` is called
   - Check if RLS policies are blocking the request

3. **Verify user profile exists**
   ```sql
   SELECT * FROM public.users WHERE uid = 'your-user-id-here';
   ```

4. **Check if columns exist**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = 'users' 
     AND column_name IN ('points', 'weeklypoints', 'monthlypoints', 'badges', 'daily_games_played', 'last_game_date');
   ```

### Common Issues and Solutions

#### Issue: "Daily game limit reached"
- **Cause**: User has played 3 games today
- **Solution**: Wait until midnight for reset, or if testing, run:
  ```sql
  UPDATE public.users 
  SET daily_games_played = 0, last_game_date = CURRENT_DATE - 1 
  WHERE uid = 'your-user-id';
  ```

#### Issue: "Weekly point limit reached"
- **Cause**: User has earned 250 points this week
- **Solution**: Wait until Monday for reset, or if testing, run:
  ```sql
  UPDATE public.users 
  SET weeklypoints = 0, last_weekly_reset = CURRENT_DATE - 7 
  WHERE uid = 'your-user-id';
  ```

#### Issue: Points update but don't show in UI
- **Cause**: Real-time subscription not working
- **Solution**: Manually refresh the page or check:
  ```javascript
  // In auth-context.tsx, ensure real-time subscription is active
  console.log('Real-time subscription active:', subscription);
  ```

## Testing Checklist

- [ ] SQL script runs without errors
- [ ] RLS policies are created
- [ ] RPC functions exist and are executable
- [ ] Can play a game and earn points
- [ ] Can take a quiz and earn points
- [ ] Points appear in profile immediately
- [ ] Daily game counter increments
- [ ] Badges are awarded at 250, 500, 750 points
- [ ] Weekly limit (250 pts) is enforced
- [ ] Daily game limit (3 games) is enforced
- [ ] Profile refreshes automatically after earning points

## Additional Notes

- **Admin users** bypass daily game limit and weekly point limit
- **Badges** are calculated as `floor(total_points / 250)`
- **Daily reset** happens at midnight (based on server time)
- **Weekly reset** happens on Monday
- **Real-time updates** should work automatically via Supabase subscriptions

## Files Modified

1. `src/lib/profile-service.ts` - Enhanced addPoints function
2. `FIX_POINTS_SYSTEM.sql` - New SQL script to fix database

## Next Steps

After confirming points work:
1. Monitor Supabase logs for any errors
2. Consider adding more detailed error messages to users
3. Add analytics to track point earning patterns
4. Consider adding notifications when badges are earned
