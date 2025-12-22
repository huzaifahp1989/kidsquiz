-- ============================================================================
-- FIX: Ensure award_points RPC function exists (safe to run multiple times)
-- ============================================================================

-- Drop old version if exists (with CASCADE to avoid policy conflicts)
DROP FUNCTION IF EXISTS award_points(int) CASCADE;

-- Recreate users_points table if needed
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

-- Enable RLS
ALTER TABLE users_points ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (so we can recreate them cleanly)
DROP POLICY IF EXISTS "Users can view own points" ON users_points;
DROP POLICY IF EXISTS "Award points RPC function" ON users_points;
DROP POLICY IF EXISTS "System can create points records" ON users_points;

-- Recreate policies
CREATE POLICY "Users can view own points"
  ON users_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Award points RPC function"
  ON users_points FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create points records"
  ON users_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_points_user_id_idx ON users_points(user_id);
CREATE INDEX IF NOT EXISTS users_points_total_idx ON users_points(total_points DESC);
CREATE INDEX IF NOT EXISTS users_points_weekly_idx ON users_points(weekly_points DESC);
CREATE INDEX IF NOT EXISTS users_points_monthly_idx ON users_points(monthly_points DESC);
CREATE INDEX IF NOT EXISTS users_points_last_earned_idx ON users_points(last_earned_date);

-- Create the award_points function
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
  -- STEP 1: Authenticate user
  v_user_id := auth.uid();
  
  -- Validate: User must be authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not authenticated',
      'points_awarded', 0
    );
  END IF;

  -- STEP 2: Validate input
  -- Validate: Points must be positive
  IF p_points <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Points must be greater than 0',
      'points_awarded', 0
    );
  END IF;

  -- STEP 3: Create user row if doesn't exist
  -- Purpose: Initialize points for new users
  INSERT INTO users_points (user_id, total_points, weekly_points, monthly_points, today_points, last_earned_date)
  VALUES (v_user_id, 0, 0, 0, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  -- STEP 4: Get current state
  SELECT today_points, last_earned_date 
  INTO v_today_points, v_last_earned_date
  FROM users_points
  WHERE user_id = v_user_id;

  -- STEP 5: Check if it's a new day
  -- Purpose: Reset daily counter when date changes
  v_is_new_day := (v_last_earned_date < CURRENT_DATE);

  -- STEP 6: Reset today_points if new day
  -- Purpose: Start fresh 100-point allowance each day
  IF v_is_new_day THEN
    v_today_points := 0;
  END IF;

  -- STEP 7: Check if can award more points today
  -- Purpose: Enforce 100 points per day limit
  v_new_daily_total := v_today_points + p_points;
  v_can_award := (v_new_daily_total <= 100);

  -- STEP 8: Return error if daily limit exceeded
  -- Purpose: Prevent earning more than 100 points per day
  IF NOT v_can_award THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Daily limit of 100 points reached',
      'points_awarded', 0,
      'today_points', v_today_points,
      'daily_limit', 100
    );
  END IF;

  -- STEP 9: Award points - UPDATE all columns atomically
  -- Purpose: Update all point balances in one transaction
  UPDATE users_points
  SET 
    -- ALWAYS increase totals
    total_points = total_points + p_points,
    weekly_points = weekly_points + p_points,
    monthly_points = monthly_points + p_points,
    -- Handle today_points (reset if new day, else accumulate)
    today_points = CASE 
                     WHEN v_is_new_day THEN p_points
                     ELSE today_points + p_points
                   END,
    last_earned_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  -- STEP 10: Return success response with updated values
  -- Purpose: Provide complete feedback to client
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION award_points(int) TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users_points TO authenticated;

-- Verify
SELECT 'award_points function created/updated successfully' as status;
SELECT COUNT(*) as user_count FROM users_points;
