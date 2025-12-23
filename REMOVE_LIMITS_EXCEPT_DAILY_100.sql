-- ============================================================================
-- REMOVE LIMITS (EXCEPT DAILY 100 POINTS)
-- ============================================================================
-- 1. Updates award_points to remove weekly/game limits
-- 2. Ensures daily limit of 100 points is kept
-- 3. Fixes level calculation
-- 4. Syncs users_points and users tables
-- ============================================================================

CREATE OR REPLACE FUNCTION public.award_points(p_points integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_today_points INTEGER;
  v_total_points INTEGER;
  v_weekly_points INTEGER;
  v_monthly_points INTEGER;
  v_last_earned_date DATE;
  v_is_new_day BOOLEAN;
  v_can_award BOOLEAN;
  v_new_daily_total INTEGER;
  v_new_level TEXT;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not authenticated');
  END IF;

  -- Upsert: Create row if doesn't exist, or get existing row in users_points
  INSERT INTO users_points (user_id, total_points, weekly_points, monthly_points, today_points, last_earned_date)
  VALUES (v_user_id, 0, 0, 0, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current state
  SELECT today_points, last_earned_date, total_points, weekly_points, monthly_points
  INTO v_today_points, v_last_earned_date, v_total_points, v_weekly_points, v_monthly_points
  FROM users_points
  WHERE user_id = v_user_id;

  -- Check if it's a new day
  v_is_new_day := (v_last_earned_date < CURRENT_DATE);

  -- If new day, reset today_points counter
  IF v_is_new_day THEN
    v_today_points := 0;
  END IF;

  -- Check daily limit (max 100 per day)
  v_new_daily_total := v_today_points + p_points;
  v_can_award := (v_new_daily_total <= 100);

  -- If can't award due to daily limit
  IF NOT v_can_award THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Daily limit of 100 points reached',
      'points_awarded', 0,
      'today_points', v_today_points,
      'daily_limit', 100
    );
  END IF;

  -- Calculate new level (using the fixed logic)
  SELECT CASE
    WHEN (v_total_points + p_points) >= 500 THEN 'Young Scholar'
    WHEN (v_total_points + p_points) >= 250 THEN 'Explorer'
    WHEN (v_total_points + p_points) >= 25 THEN 'Learner'
    ELSE 'Beginner'
  END INTO v_new_level;

  -- Award the points - UPDATE users_points
  UPDATE users_points
  SET 
    total_points = total_points + p_points,
    weekly_points = weekly_points + p_points,
    monthly_points = monthly_points + p_points,
    today_points = CASE 
                     WHEN v_is_new_day THEN p_points
                     ELSE today_points + p_points
                   END,
    last_earned_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  -- Sync to users table (legacy table support)
  UPDATE users
  SET
    points = (v_total_points + p_points),
    weeklypoints = (v_weekly_points + p_points),
    monthlypoints = (v_monthly_points + p_points),
    level = v_new_level,
    updatedat = NOW()
  WHERE uid = v_user_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Points awarded successfully',
    'points_awarded', p_points,
    'total_points', v_total_points + p_points,
    'today_points', CASE WHEN v_is_new_day THEN p_points ELSE v_today_points + p_points END,
    'weekly_points', v_weekly_points + p_points,
    'monthly_points', v_monthly_points + p_points,
    'level', v_new_level
  );

END;
$$;

GRANT EXECUTE ON FUNCTION award_points(integer) TO authenticated;
