-- ============================================================================
-- Islamic Kids Learning Platform - Points Reward System with Daily Limits
-- ============================================================================
-- Run this SQL in your Supabase dashboard (SQL Editor)
-- This implements a secure points system with 100 points/day limit
-- ============================================================================

-- ============================================================================
-- STEP 1: Create users_points table (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  weekly_points INTEGER NOT NULL DEFAULT 0 CHECK (weekly_points >= 0),
  monthly_points INTEGER NOT NULL DEFAULT 0 CHECK (monthly_points >= 0),
  today_points INTEGER NOT NULL DEFAULT 0 CHECK (today_points >= 0),
  last_earned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS users_points_user_id_idx ON users_points(user_id);
CREATE INDEX IF NOT EXISTS users_points_total_idx ON users_points(total_points DESC);
CREATE INDEX IF NOT EXISTS users_points_weekly_idx ON users_points(weekly_points DESC);
CREATE INDEX IF NOT EXISTS users_points_monthly_idx ON users_points(monthly_points DESC);
CREATE INDEX IF NOT EXISTS users_points_last_earned_idx ON users_points(last_earned_date);

-- ============================================================================
-- STEP 2: Enable RLS on users_points table
-- ============================================================================
ALTER TABLE users_points ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own points" ON users_points;
DROP POLICY IF EXISTS "Users can only call award_points via RPC" ON users_points;
DROP POLICY IF EXISTS "Award points RPC function" ON users_points;
DROP POLICY IF EXISTS "Allow reading own points for leaderboard" ON users_points;

-- ============================================================================
-- STEP 3: RLS Policies for users_points table
-- ============================================================================

-- Policy 1: Users can SELECT (read) their own points
CREATE POLICY "Users can view own points"
  ON users_points FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can UPDATE their own points (restricted by function logic)
CREATE POLICY "Award points RPC function"
  ON users_points FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: System can INSERT new point records for new users
CREATE POLICY "System can create points records"
  ON users_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 4: Create the award_points RPC function
-- ============================================================================
-- This function handles all points logic securely
-- Drop the function if it exists
DROP FUNCTION IF EXISTS award_points(int);

CREATE OR REPLACE FUNCTION award_points(p_points int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_today_points INT;
  v_new_daily_total INT;
  v_can_award BOOLEAN;
  v_last_earned_date DATE;
  v_is_new_day BOOLEAN;
BEGIN
  -- Get the current user ID from auth
  v_user_id := auth.uid();
  
  -- Validate input
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not authenticated',
      'points_awarded', 0
    );
  END IF;

  IF p_points <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Points must be greater than 0',
      'points_awarded', 0
    );
  END IF;

  -- Upsert: Create row if doesn't exist, or get existing row
  INSERT INTO users_points (user_id, total_points, weekly_points, monthly_points, today_points, last_earned_date)
  VALUES (v_user_id, 0, 0, 0, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current state
  SELECT today_points, last_earned_date 
  INTO v_today_points, v_last_earned_date
  FROM users_points
  WHERE user_id = v_user_id;

  -- Check if it's a new day
  v_is_new_day := (v_last_earned_date < CURRENT_DATE);

  -- If new day, reset today_points counter (but NOT totals)
  IF v_is_new_day THEN
    v_today_points := 0;
  END IF;

  -- Check if user can earn more points today (max 100 per day)
  v_new_daily_total := v_today_points + p_points;
  v_can_award := (v_new_daily_total <= 100);

  -- If can't award, return without updating
  IF NOT v_can_award THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Daily limit of 100 points reached',
      'points_awarded', 0,
      'today_points', v_today_points,
      'daily_limit', 100
    );
  END IF;

  -- Award the points - UPDATE all counters
  UPDATE users_points
  SET 
    total_points = total_points + p_points,           -- Always increases
    weekly_points = weekly_points + p_points,         -- Always increases
    monthly_points = monthly_points + p_points,       -- Always increases
    today_points = CASE 
                     WHEN v_is_new_day THEN p_points  -- Reset if new day
                     ELSE today_points + p_points     -- Add if same day
                   END,
    last_earned_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Points awarded successfully',
    'points_awarded', p_points,
    'total_points', (SELECT total_points FROM users_points WHERE user_id = v_user_id),
    'today_points', (SELECT today_points FROM users_points WHERE user_id = v_user_id),
    'weekly_points', (SELECT weekly_points FROM users_points WHERE user_id = v_user_id),
    'monthly_points', (SELECT monthly_points FROM users_points WHERE user_id = v_user_id)
  );

END;
$$;

-- ============================================================================
-- STEP 5: Grant permissions to authenticated users
-- ============================================================================
GRANT EXECUTE ON FUNCTION award_points(int) TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users_points TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================================================
-- To verify the setup, you can run these queries:

-- 1. Check that the table exists with correct columns:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'users_points';

-- 2. Check that RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE tablename = 'users_points';

-- 3. Check that the function exists:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name = 'award_points';

-- 4. Test the function (after you're logged in as a user):
-- SELECT award_points(10);

-- ============================================================================
-- USAGE IN YOUR APP
-- ============================================================================
-- In your Next.js/React code, import and use like this:
--
-- import { createClient } from '@supabase/supabase-js'
--
-- const supabase = createClient(URL, KEY)
--
-- // Call the function
-- const { data, error } = await supabase.rpc('award_points', { 
--   p_points: 10 
-- })
--
-- if (error) console.error('Error:', error)
-- else console.log('Success:', data)
--
-- Response will be:
-- {
--   "success": true,
--   "message": "Points awarded successfully",
--   "points_awarded": 10,
--   "total_points": 50,
--   "today_points": 10,
--   "weekly_points": 50,
--   "monthly_points": 50
-- }
--
-- If daily limit reached:
-- {
--   "success": false,
--   "message": "Daily limit of 100 points reached",
--   "points_awarded": 0,
--   "today_points": 100,
--   "daily_limit": 100
-- }

-- ============================================================================
