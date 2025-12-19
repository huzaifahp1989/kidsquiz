-- ============================================================================
-- Verification Script for Islamic Kids Learning Platform
-- ============================================================================
-- Run this in Supabase SQL Editor to verify your setup
-- ============================================================================

-- 1. Check if users table exists and has required columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check if RPC functions exist
SELECT 
    routine_name, 
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE 'add_points%' OR routine_name LIKE 'check_daily%')
ORDER BY routine_name;

-- 3. Check RLS policies on users table
SELECT 
    policyname,
    cmd as command,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;

-- 4. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';

-- 5. List all users (to verify data exists)
SELECT 
    uid,
    email,
    name,
    role,
    points,
    weeklypoints,
    monthlypoints,
    daily_games_played,
    last_game_date,
    level
FROM users
ORDER BY points DESC
LIMIT 10;

-- 6. Check function permissions
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
AND routine_name IN ('add_points_dev', 'add_points_with_limits', 'check_daily_games_limit')
ORDER BY routine_name, grantee;

-- ============================================================================
-- Expected Results:
-- ============================================================================
-- Query 1: Should show columns including uid, email, name, points, weeklypoints, 
--          monthlypoints, daily_games_played, last_game_date, level, etc.
--
-- Query 2: Should show:
--   - add_points_dev (function, json)
--   - add_points_with_limits (function, json)
--   - check_daily_games_limit (function, integer)
--
-- Query 3: Should show at least:
--   - authenticated_read_own_users (SELECT)
--   - authenticated_update_own_users (UPDATE)
--   - public_read_leaderboard (SELECT)
--
-- Query 4: Should show rls_enabled = true
--
-- Query 5: Should list your users
--
-- Query 6: Should show EXECUTE permissions for authenticated role
-- ============================================================================
