-- ============================================================================
-- Points & Game RPC Functions for Islamic Kids Platform
-- Run in Supabase SQL Editor (project jlqrbbqsuksncrxjcmbc)
-- ============================================================================

BEGIN;

-- 1. Ensure columns exist (Idempotent)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS badges INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS daily_games_played INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_game_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_weekly_reset DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_monthly_reset DATE DEFAULT CURRENT_DATE;

-- 2. Helper: Calculate Level
CREATE OR REPLACE FUNCTION public.calculate_level(p_points integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_points >= 1000 THEN 'Master'
    WHEN p_points >= 500 THEN 'Expert'
    WHEN p_points >= 250 THEN 'Advanced'
    WHEN p_points >= 100 THEN 'Intermediate'
    WHEN p_points >= 25 THEN 'Novice'
    ELSE 'Beginner'
  END;
$$;

-- 3. Main Function: Add Points (with limits & level update)
CREATE OR REPLACE FUNCTION public.add_points(p_uid uuid, p_points_to_add integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_date_val DATE;
  v_games_played INTEGER;
  v_last_game_date DATE;
  v_weekly INTEGER;
  v_monthly INTEGER;
  v_total INTEGER;
  v_badges INTEGER;
  v_role TEXT;
  
  v_new_total INTEGER;
  v_new_weekly INTEGER;
  v_new_monthly INTEGER;
  v_new_badges INTEGER;
  v_new_level TEXT;
  
  weekly_limit INTEGER := 250;
  daily_games_limit INTEGER := 3;
BEGIN
  current_date_val := CURRENT_DATE;

  -- Fetch current state
  SELECT 
    daily_games_played, last_game_date, weeklypoints, monthlypoints, points, badges, role
  INTO 
    v_games_played, v_last_game_date, v_weekly, v_monthly, v_total, v_badges, v_role
  FROM public.users
  WHERE uid = p_uid;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'User not found');
  END IF;

  -- Handle NULLs
  v_games_played := COALESCE(v_games_played, 0);
  v_weekly := COALESCE(v_weekly, 0);
  v_monthly := COALESCE(v_monthly, 0);
  v_total := COALESCE(v_total, 0);
  v_badges := COALESCE(v_badges, 0);

  -- Reset daily counter if date changed
  IF v_last_game_date < current_date_val OR v_last_game_date IS NULL THEN
    v_games_played := 0;
  END IF;

  -- Check daily games limit (skip for admin)
  IF v_role <> 'admin' AND v_games_played >= daily_games_limit THEN
    RETURN json_build_object(
      'success', false, 
      'reason', 'Daily game limit reached (3 games per day)',
      'games_played', v_games_played,
      'games_remaining', 0
    );
  END IF;

  -- Check weekly limit (skip for admin)
  IF v_role <> 'admin' AND v_weekly >= weekly_limit THEN
    RETURN json_build_object(
      'success', false, 
      'reason', 'Weekly point limit reached (250 points per week)',
      'weekly_points', v_weekly,
      'games_remaining', GREATEST(0, daily_games_limit - v_games_played)
    );
  END IF;

  -- Calculate new values
  -- Cap points addition by weekly limit
  IF v_role <> 'admin' THEN
    v_new_weekly := LEAST(v_weekly + p_points_to_add, weekly_limit);
    -- Only add the difference
    v_new_total := v_total + (v_new_weekly - v_weekly);
    v_new_monthly := v_monthly + (v_new_weekly - v_weekly);
  ELSE
    v_new_weekly := v_weekly + p_points_to_add;
    v_new_total := v_total + p_points_to_add;
    v_new_monthly := v_monthly + p_points_to_add;
  END IF;

  -- Calculate Badges (1 per 250 points total)
  v_new_badges := FLOOR(v_new_total / 250);
  
  -- Calculate Level
  v_new_level := public.calculate_level(v_new_total);

  -- Update User
  UPDATE public.users
  SET 
    points = v_new_total,
    weeklypoints = v_new_weekly,
    monthlypoints = v_new_monthly,
    badges = v_new_badges,
    level = v_new_level,
    daily_games_played = v_games_played + 1,
    last_game_date = current_date_val,
    updatedat = NOW()
  WHERE uid = p_uid;

  RETURN json_build_object(
    'success', true,
    'points_awarded', p_points_to_add,
    'total_points', v_new_total,
    'weekly_points', v_new_weekly,
    'monthly_points', v_new_monthly,
    'badges_earned', v_new_badges,
    'games_played_today', v_games_played + 1,
    'games_remaining', GREATEST(0, daily_games_limit - (v_games_played + 1))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_points(uuid, integer) TO authenticated;

-- 4. Mark Game Completed
CREATE OR REPLACE FUNCTION public.mark_game_completed(uid uuid, game_id text, score_val integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.game_progress(uid, gameId, points, playedAt)
  VALUES (uid, game_id, COALESCE(score_val, 0), NOW());
  
  RETURN json_build_object('success', true, 'game_id', game_id);
EXCEPTION WHEN others THEN
  RETURN json_build_object('success', false, 'reason', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_game_completed(uuid, text, integer) TO authenticated;

-- 5. Mark Quiz Completed
CREATE OR REPLACE FUNCTION public.mark_quiz_completed(uid uuid, category text, score_val integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.quiz_progress(uid, category, score, completed_at)
  VALUES (uid, category, COALESCE(score_val, 0), NOW())
  ON CONFLICT (uid, category) 
  DO UPDATE SET 
    score = GREATEST(public.quiz_progress.score, EXCLUDED.score),
    completed_at = NOW();
  
  RETURN json_build_object('success', true, 'category', category);
EXCEPTION WHEN others THEN
  RETURN json_build_object('success', false, 'reason', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_quiz_completed(uuid, text, integer) TO authenticated;

COMMIT;
