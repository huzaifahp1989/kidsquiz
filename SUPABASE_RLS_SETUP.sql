-- Supabase RLS Policy for Islamic Kids Learning Platform
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users (including anonymous) to read their own record
CREATE POLICY "Users can read their own profile"
  ON users FOR SELECT
  USING (auth.uid() = uid);

-- 3. Allow authenticated users to read other users for leaderboard
CREATE POLICY "Authenticated users can read all user profiles for leaderboard"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

-- 4. Allow authenticated users to update their own points/level
CREATE POLICY "Users can update their own points and level"
  ON users FOR UPDATE
  USING (auth.uid() = uid)
  WITH CHECK (auth.uid() = uid);

-- 5. Allow authenticated users to insert their own user record
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = uid);

-- Run these via Supabase dashboard:
-- 1. Go to Authentication > Providers
-- 2. Find "Anonymous Sign-ins" and toggle it ON
-- 3. Save
