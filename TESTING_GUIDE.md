# Testing Points and Authentication

## Quick Test Steps

### 1. Sign In
1. Open the website at http://localhost:3000
2. Click "Sign In" or navigate to `/signin`
3. Sign in with your credentials
4. You should stay signed in (check the navbar shows your name)

### 2. Test Points Update

#### Option A: Play a Quiz
1. Navigate to "Quizzes" from the home page
2. Select any quiz and complete it
3. Check if points are awarded at the end
4. Go back to home page and verify your points increased

#### Option B: Play a Game
1. Navigate to "Games" from the home page
2. Select any game (e.g., "Word Search – Seerah")
3. Complete the game
4. Check console (F12) for "Points updated" messages
5. Go back to home page and verify your points increased

### 3. Verify Session Persistence
1. While signed in, navigate between pages (Home → Games → Quiz → Profile)
2. You should stay signed in throughout
3. If you get signed out, check browser console for errors

### 4. Check Browser Console

Open DevTools (F12) and look for these messages:

**Good signs:**
- ✅ "Found existing session: [user-id]"
- ✅ "Points updated: {...}"
- ✅ "Profile refreshed: {...}"
- ✅ "Real-time update received: {...}"

**Bad signs:**
- ❌ "Session check error"
- ❌ "RPC failed"
- ❌ "User not found"
- ❌ "Auth state changed: undefined"

### 5. Common Issues

#### Issue: Signed Out When Playing Games
**Symptoms**: User gets redirected to sign in page when starting a game
**Solutions**:
1. Clear browser cache and localStorage
2. Sign out completely and sign in again
3. Check if .env.local has correct Supabase credentials
4. Verify Supabase RLS policies allow reading/updating user data

#### Issue: Points Not Updating
**Symptoms**: Points stay at 0 even after completing games/quizzes
**Solutions**:
1. Check browser console for error messages
2. Verify RPC functions exist in Supabase (run VERIFY_SETUP.sql)
3. Check if user role is correct (not 'guardian' or invalid role)
4. Verify user has games remaining (not hit daily limit)
5. Make user admin to bypass limits: `UPDATE users SET role = 'admin' WHERE email = 'your-email';`

#### Issue: "Daily game limit reached"
**Solutions**:
1. Make yourself admin: `UPDATE users SET role = 'admin' WHERE email = 'your-email';`
2. Or reset daily counter: `UPDATE users SET daily_games_played = 0 WHERE email = 'your-email';`
3. Or wait until tomorrow (counter resets at midnight)

### 6. Quick Database Fixes

Run these in Supabase SQL Editor if needed:

```sql
-- Make yourself admin (unlimited games/points)
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

-- Reset daily games
UPDATE users SET daily_games_played = 0, last_game_date = CURRENT_DATE - 1 
WHERE email = 'your-email@example.com';

-- Reset weekly points
UPDATE users SET weeklypoints = 0, last_weekly_reset = CURRENT_DATE - 7 
WHERE email = 'your-email@example.com';

-- Give yourself some test points
UPDATE users SET points = 50, weeklypoints = 50, monthlypoints = 50 
WHERE email = 'your-email@example.com';

-- Check your current status
SELECT email, name, role, points, weeklypoints, daily_games_played, level 
FROM users WHERE email = 'your-email@example.com';
```

### 7. Test Checklist

Complete this checklist to verify everything works:

- [ ] Can sign in successfully
- [ ] Stay signed in when navigating between pages
- [ ] Stay signed in when playing games
- [ ] Points update after completing a quiz
- [ ] Points update after completing a game
- [ ] Profile data refreshes automatically
- [ ] Can see updated points on home page
- [ ] Leaderboard shows correct points
- [ ] No errors in browser console
- [ ] No errors in Network tab (F12 → Network)

### 8. Files Changed

These files were modified to fix the issues:

1. **src/lib/supabase.ts** 
   - Added session persistence configuration
   - Added auto-refresh token
   - Added localStorage for session storage

2. **src/lib/auth-context.tsx**
   - Fixed loading states
   - Added proper auth event logging
   - Fixed session initialization

3. **src/app/quiz/page.tsx**
   - Fixed RPC parameter names (uid → p_uid, points_to_add → p_points_to_add)

### 9. Need More Help?

If you're still having issues:

1. **Check Supabase Dashboard Logs**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to "Logs" → "API"
   - Look for errors

2. **Check Browser Network Tab**
   - Open DevTools (F12)
   - Go to Network tab
   - Play a game or quiz
   - Look for failed requests (red)
   - Click on them to see error details

3. **Verify Environment Variables**
   - Check `.env.local` has correct values
   - Restart dev server after changing .env.local

4. **Run Verification SQL**
   - Run `VERIFY_SETUP.sql` in Supabase SQL Editor
   - Check if all functions and policies exist

## Current Status

✅ Session persistence configured
✅ Auth context fixed
✅ RPC parameters fixed in quiz page
✅ Supabase client properly initialized
⏳ Waiting for Supabase functions to be set up (run RESET_AND_DAILY_LIMITS.sql)
