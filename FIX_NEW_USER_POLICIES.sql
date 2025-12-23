-- ============================================================================
-- FIX NEW USER POLICIES
-- ============================================================================
-- This script fixes RLS policies to ensure new users can create their profiles
-- and view their points correctly.
-- ============================================================================

-- Enable RLS on users table (just in case)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1. Allow users to INSERT their own profile (Critical for new users)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = uid);

-- 2. Allow users to SELECT their own profile (Critical for loading profile)
DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
CREATE POLICY "Users can read their own profile" ON public.users
  FOR SELECT USING (auth.uid() = uid);

-- 3. Allow users to UPDATE their own profile (Already fixed, but ensuring consistency)
DROP POLICY IF EXISTS "auth_update_own" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "auth_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = uid)
  WITH CHECK (auth.uid() = uid);

-- 4. Allow authenticated users to read all profiles (For Leaderboard)
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.users;
CREATE POLICY "Authenticated users can read all profiles" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- VERIFY USERS_POINTS POLICIES
-- ============================================================================

-- Ensure users_points has correct policies
ALTER TABLE public.users_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own points" ON public.users_points;
CREATE POLICY "Users can insert own points"
  ON public.users_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own points" ON public.users_points;
CREATE POLICY "Users can view own points"
  ON public.users_points FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own points" ON public.users_points;
CREATE POLICY "Users can update own points"
  ON public.users_points FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users_points TO authenticated;
