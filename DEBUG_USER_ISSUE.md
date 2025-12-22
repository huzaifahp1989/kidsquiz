# Debug and Fix User-Specific Issue

## Problem
Email `huzaify786@gmail.com` - points not updating
Other emails work fine, so the issue is specific to this user account.

## Possible Causes

1. **Missing profile in `public.users` table**
   - User exists in `auth.users` but not in `public.users`
   - Profile creation failed during signup

2. **Corrupted or NULL values**
   - NULL values in critical fields (points, weeklypoints, etc.)
   - Invalid data preventing updates

3. **Old session/token**
   - Cached old user data in browser
   - Expired refresh token

4. **RLS policy issue**
   - User's UID doesn't match auth.uid()
   - Permission denied on updates

## Quick Fix Steps

### Option 1: Run SQL Fix Script (Recommended)

1. Open Supabase SQL Editor
2. Run the script `FIX_SPECIFIC_USER.sql`
3. Check the output/notices for any errors
4. The script will:
   - Find and diagnose the user
   - Fix NULL values
   - Reset counters
   - Test the add_points function

### Option 2: Manual Database Fix

If you have direct database access:

```sql
-- 1. Find the user
SELECT uid, email, points, weeklypoints, daily_games_played 
FROM public.users 
WHERE email = 'huzaify786@gmail.com';

-- 2. Reset their data (replace USER_UID with actual UID)
UPDATE public.users
SET
  points = 0,
  weeklypoints = 0,
  monthlypoints = 0,
  badges = 0,
  daily_games_played = 0,
  last_game_date = CURRENT_DATE,
  level = 'Beginner',
  updatedat = NOW()
WHERE email = 'huzaify786@gmail.com';

-- 3. Test adding points (replace USER_UID with actual UID)
SELECT public.add_points('USER_UID'::uuid, 10);
```

### Option 3: User Actions (In Browser)

Have the user try these steps:

1. **Clear browser cache and cookies**
   - Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
   - Clear "Cookies and other site data"
   - Clear "Cached images and files"

2. **Sign out and sign in again**
   - Go to the website
   - Click Sign Out
   - Close the browser completely
   - Open browser again
   - Sign in with `huzaify786@gmail.com`

3. **Try incognito/private mode**
   - Open browser in incognito/private mode
   - Sign in with the account
   - Try playing a game/quiz
   - If it works in incognito, the issue is browser cache

4. **Check browser console for errors**
   - Press F12 to open Developer Tools
   - Go to Console tab
   - Play a game/quiz
   - Look for errors mentioning:
     - "add_points"
     - "RPC"
     - "permission denied"
     - "not found"
   - Share the error messages

## Verification Steps

After applying the fix:

1. **In Supabase Dashboard**
   ```sql
   -- Check user profile
   SELECT * FROM public.users WHERE email = 'huzaify786@gmail.com';
   
   -- Should return a complete profile with no NULL values
   ```

2. **In the Application**
   - Sign in as `huzaify786@gmail.com`
   - Check if profile loads correctly
   - Play a game and watch for point updates
   - Open browser console (F12) and check for errors

3. **Expected Console Logs**
   ```
   [games] awarding via RPC { rpcName: 'add_points', uid: '...', totalEarned: X }
   [games] RPC success { success: true, points_awarded: X, ... }
   ⭐ +X points
   ```

## Common Issues and Solutions

### Issue: "User not found"
**Cause**: Profile doesn't exist in `public.users`
**Solution**: Run the SQL fix script which creates the profile

### Issue: "Permission denied"
**Cause**: RLS policy blocking the update
**Solution**: 
```sql
-- Check if user's UID matches their auth.uid()
SELECT 
  u.uid as profile_uid,
  au.id as auth_uid,
  u.uid = au.id as uids_match
FROM public.users u
JOIN auth.users au ON au.email = u.email
WHERE u.email = 'huzaify786@gmail.com';
```

If UIDs don't match, fix with:
```sql
UPDATE public.users u
SET uid = au.id
FROM auth.users au
WHERE u.email = au.email
  AND u.email = 'huzaify786@gmail.com';
```

### Issue: "Session expired" or "Invalid refresh token"
**Cause**: Old/expired authentication session
**Solution**: 
1. User must sign out completely
2. Clear browser cache
3. Sign in again

### Issue: Points update in database but not in UI
**Cause**: Real-time subscription not working
**Solution**: Refresh the page or check real-time connection

## Additional Debugging

If the issue persists, collect this information:

1. **User UID**
   ```sql
   SELECT uid FROM public.users WHERE email = 'huzaify786@gmail.com';
   ```

2. **Auth UID**
   ```sql
   SELECT id FROM auth.users WHERE email = 'huzaify786@gmail.com';
   ```

3. **Browser Console Errors**
   - Open F12, go to Console tab
   - Try earning points
   - Copy all error messages

4. **Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Filter for the user's UID
   - Look for errors during the time they tried to earn points

5. **Network Tab**
   - Open F12, go to Network tab
   - Try earning points
   - Look for failed requests (red)
   - Click on "rpc" requests
   - Check Response tab for error messages

## Contact Support

If none of the above works, provide:
- User's UID from database
- Browser console errors
- Supabase log errors
- Screenshots of the issue
