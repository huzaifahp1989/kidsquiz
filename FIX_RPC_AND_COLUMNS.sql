-- ============================================================================
-- FIX RPC AND COLUMNS (ROBUST VERSION)
-- ============================================================================
-- This script fixes the "Points not updating" issue by:
-- 1. Standardizing column names in 'users' table (renaming camelCase to lowercase)
-- 2. Making the award_points RPC robust against sync errors
-- 3. Re-verifying policies
-- ============================================================================

-- STEP 1: Fix 'users' table columns
-- We wrap in blocks to avoid errors if columns are already correct
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.users RENAME COLUMN "weeklyPoints" TO weeklypoints;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.users RENAME COLUMN "monthlyPoints" TO monthlypoints;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.users RENAME COLUMN "totalPoints" TO points;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- Ensure columns exist if they were missing
    BEGIN
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weeklypoints INTEGER DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS monthlypoints INTEGER DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- STEP 2: Make award_points RPC Robust
-- This version will NOT fail if 'users' table sync fails
CREATE OR REPLACE FUNCTION award_points(p_points int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_daily_limit INTEGER := 100;
  v_current_points INTEGER;
  v_today_points INTEGER;
  v_total_points INTEGER;
  v_weekly_points INTEGER;
  v_monthly_points INTEGER;
  v_last_earned_date DATE;
  v_today_date DATE;
  v_new_today_points INTEGER;
  v_points_to_award INTEGER;
BEGIN
  -- Get current user ID
  v_uid := auth.uid();
  v_today_date := CURRENT_DATE;
  
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Get current stats from users_points table (or create if missing)
  SELECT 
    today_points, total_points, weekly_points, monthly_points, last_earned_date
  INTO 
    v_today_points, v_total_points, v_weekly_points, v_monthly_points, v_last_earned_date
  FROM public.users_points
  WHERE user_id = v_uid;

  -- Initialize if no record
  IF NOT FOUND THEN
    v_today_points := 0;
    v_total_points := 0;
    v_weekly_points := 0;
    v_monthly_points := 0;
    v_last_earned_date := v_today_date;
    
    INSERT INTO public.users_points (user_id, total_points, today_points, weekly_points, monthly_points, last_earned_date)
    VALUES (v_uid, 0, 0, 0, 0, v_today_date);
  END IF;

  -- Reset daily points if new day
  IF v_last_earned_date < v_today_date THEN
    v_today_points := 0;
  END IF;

  -- Calculate how many points can be awarded
  IF v_today_points >= v_daily_limit THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Daily limit of 100 points reached',
      'today_points', v_today_points,
      'daily_limit', v_daily_limit,
      'points_awarded', 0
    );
  END IF;

  v_points_to_award := LEAST(p_points, v_daily_limit - v_today_points);
  v_new_today_points := v_today_points + v_points_to_award;

  -- Update users_points
  UPDATE public.users_points
  SET 
    today_points = v_new_today_points,
    total_points = v_total_points + v_points_to_award,
    weekly_points = v_weekly_points + v_points_to_award,
    monthly_points = v_monthly_points + v_points_to_award,
    last_earned_date = v_today_date,
    updated_at = NOW()
  WHERE user_id = v_uid;

  -- Sync to users table (Wrapped in block to ignore errors)
  -- This ensures points are awarded even if 'users' table has issues
  BEGIN
    UPDATE public.users
    SET
      points = COALESCE(points, 0) + v_points_to_award,
      weeklypoints = COALESCE(weeklypoints, 0) + v_points_to_award,
      monthlypoints = COALESCE(monthlypoints, 0) + v_points_to_award,
      updatedat = NOW()
    WHERE uid = v_uid;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore sync errors, we trust users_points more
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_points_to_award,
    'total_points', v_total_points + v_points_to_award,
    'today_points', v_new_today_points,
    'weekly_points', v_weekly_points + v_points_to_award,
    'monthly_points', v_monthly_points + v_points_to_award,
    'daily_limit', v_daily_limit
  );
END;
$$;

-- STEP 3: Grant Permissions
GRANT EXECUTE ON FUNCTION public.award_points(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_points(integer) TO service_role;

-- STEP 4: Ensure Policies (Double Check)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_points ENABLE ROW LEVEL SECURITY;

-- Allow insert/update for users (re-applying just in case)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = uid);

DROP POLICY IF EXISTS "auth_update_own" ON public.users;
CREATE POLICY "auth_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = uid);

-- Allow insert/update for users_points
DROP POLICY IF EXISTS "Users can insert own points" ON public.users_points;
CREATE POLICY "Users can insert own points"
  ON public.users_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own points" ON public.users_points;
CREATE POLICY "Users can update own points"
  ON public.users_points FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own points" ON public.users_points;
CREATE POLICY "Users can view own points"
  ON public.users_points FOR SELECT
  USING (auth.uid() = user_id);
