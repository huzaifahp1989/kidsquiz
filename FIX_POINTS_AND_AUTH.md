# Fix Points and Authentication Issues

## Issues Fixed

### 1. Authentication Session Persistence
**Problem**: Users were getting signed out when playing games
**Solution**: 
- Updated Supabase client configuration to persist sessions properly
- Added proper session storage using localStorage
- Fixed auth context to properly handle loading states

### 2. Points Not Updating
**Problem**: Points not being updated when playing games
**Solution**:
- Ensured RPC functions are properly configured
- Fixed Supabase client initialization

## Setup Instructions

### Step 1: Verify Supabase Setup

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `jlqrbbqsuksncrxjcmbc`
3. Go to **SQL Editor**

### Step 2: Run Required SQL Scripts

Run these SQL scripts in order (if not already done):

#### A. Create Tables and Functions
```sql
-- Run the contents of RESET_AND_DAILY_LIMITS.sql
-- This creates the add_points_with_limits and add_points_dev functions
```

Copy the entire content from `RESET_AND_DAILY_LIMITS.sql` and execute it in the SQL Editor.

#### B. Verify Functions Exist
Run this query to check if functions are created:
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'add_points%';
```

You should see:
- `add_points_dev`
- `add_points_with_limits`

#### C. Verify Permissions
```sql
-- Ensure authenticated users can execute the functions
GRANT EXECUTE ON FUNCTION add_points_with_limits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_points_dev(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_daily_games_limit(UUID) TO authenticated;
```

### Step 3: Verify RLS Policies

Run this to check your RLS policies:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
```

Make sure you have:
- A policy allowing users to read their own data
- A policy allowing users to update their own data
- A policy allowing public read for leaderboard

### Step 4: Test the Setup

#### A. Test in Supabase SQL Editor
```sql
-- Replace YOUR_USER_UUID with an actual user ID from your users table
SELECT add_points_dev('YOUR_USER_UUID'::UUID, 10);
```

This should return a JSON response with success: true

#### B. Test from the Application

1. Restart your development server (it's already running)
2. Sign in to the application
3. Open browser DevTools (F12) and go to Console tab
4. Play a game
5. Watch the console for any errors

### Step 5: Debugging Points Issues

If points still don't update, check these:

#### A. Check User Authentication
In browser console:
```javascript
// This should show your current auth session
localStorage.getItem('sb-jlqrbbqsuksncrxjcmbc-auth-token')
```

#### B. Check RPC Call
Look for these console messages when playing a game:
- "Auth event:" messages
- "Points updated:" messages
- Any error messages

#### C. Verify User ID
In browser console while signed in:
```javascript
// Check what user ID is being used
console.log(await supabase.auth.getUser())
```

### Step 6: Common Issues and Solutions

#### Issue: "User not found" error
**Solution**: The user's `uid` in the database doesn't match the auth user ID
```sql
-- Check if user exists
SELECT uid, email, name FROM users WHERE email = 'your-email@example.com';

-- If uid doesn't match, you may need to recreate the user
```

#### Issue: "Daily game limit reached"
**Solution**: For testing, use dev mode (admins) or reset daily counter:
```sql
UPDATE users SET daily_games_played = 0, last_game_date = CURRENT_DATE - 1 WHERE email = 'your-email@example.com';
```

#### Issue: "Weekly point limit reached"
**Solution**: Reset weekly points or use dev mode:
```sql
UPDATE users SET weeklypoints = 0, last_weekly_reset = CURRENT_DATE - 7 WHERE email = 'your-email@example.com';
```

#### Issue: User still getting signed out
**Solution**: 
1. Clear browser localStorage and cookies
2. Sign out completely
3. Close all browser tabs
4. Reopen and sign in again

### Step 7: Make a User Admin (for unlimited testing)

To bypass daily/weekly limits:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Admin users:
- Have no daily game limits
- Have no weekly point limits
- Can test without restrictions

### Files Modified

1. **src/lib/supabase.ts** - Added session persistence configuration
2. **src/lib/auth-context.tsx** - Fixed loading states and auth event handling

### Testing Checklist

- [ ] Supabase SQL functions exist (`add_points_dev`, `add_points_with_limits`)
- [ ] RLS policies are configured correctly
- [ ] User can sign in successfully
- [ ] User stays signed in when navigating between pages
- [ ] User stays signed in when playing games
- [ ] Points update correctly after completing a game
- [ ] Profile refreshes automatically after points update
- [ ] Console shows no authentication errors
- [ ] Console shows successful points updates

## Need More Help?

If issues persist:
1. Check browser console for errors (F12)
2. Check Supabase logs: Dashboard > Logs > API
3. Verify your .env.local has correct Supabase URL and key
4. Make sure you're using the correct Supabase project

## Environment Variables Check

Your .env.local should have:
```
NEXT_PUBLIC_SUPABASE_URL=https://jlqrbbqsuksncrxjcmbc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

These are already configured in your project.
