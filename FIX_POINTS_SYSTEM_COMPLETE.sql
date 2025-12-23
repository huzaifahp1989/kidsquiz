-- ============================================================================
-- COMPLETE POINTS SYSTEM FIX
-- ============================================================================
-- 1. Resets RLS policies for users_points and users tables
-- 2. Updates award_points function to remove 3-game limit
-- 3. Ensures table structure is correct
-- ============================================================================

-- STEP 1: Ensure users_points table exists and has correct columns
-- Also standardize users table columns to lowercase to prevent sync issues
DO $$
BEGIN
    -- Rename camelCase columns to snake_case/lowercase if they exist (handling quoted identifiers)
    BEGIN
        ALTER TABLE public.users RENAME COLUMN "weeklyPoints" TO weeklypoints;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.users RENAME COLUMN "monthlyPoints" TO monthlypoints;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.users RENAME COLUMN "totalPoints" TO points; -- Handle legacy naming
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

CREATE TABLE IF NOT EXISTS public.users_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  weekly_points INTEGER NOT NULL DEFAULT 0 CHECK (weekly_points >= 0),
  monthly_points INTEGER NOT NULL DEFAULT 0 CHECK (monthly_points >= 0),
  today_points INTEGER NOT NULL DEFAULT 0 CHECK (today_points >= 0),
  last_earned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT users_points_user_id_key UNIQUE (user_id)
);

-- Backfill missing columns if any
DO $$
BEGIN
    ALTER TABLE public.users_points ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE public.users_points ADD COLUMN IF NOT EXISTS weekly_points INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE public.users_points ADD COLUMN IF NOT EXISTS monthly_points INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE public.users_points ADD COLUMN IF NOT EXISTS today_points INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE public.users_points ADD COLUMN IF NOT EXISTS last_earned_date DATE DEFAULT CURRENT_DATE;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'Column already exists';
END $$;

-- STEP 2: Fix RLS Policies
ALTER TABLE public.users_points ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own points" ON public.users_points;
DROP POLICY IF EXISTS "Users can update own points" ON public.users_points;
DROP POLICY IF EXISTS "Users can insert own points" ON public.users_points;
DROP POLICY IF EXISTS "Award points RPC function" ON public.users_points;
DROP POLICY IF EXISTS "System can create points records" ON public.users_points;

-- Create permissive policies for authenticated users
CREATE POLICY "Users can view own points"
  ON public.users_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points"
  ON public.users_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own points"
  ON public.users_points FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also fix policies for public.users table (for sync)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_auth_update_own" ON public.users;
DROP POLICY IF EXISTS "auth_update_own" ON public.users;

CREATE POLICY "auth_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = uid)
  WITH CHECK (auth.uid() = uid);

-- STEP 3: Update award_points function (Unlimited Plays)
DROP FUNCTION IF EXISTS public.award_points(integer);
DROP FUNCTION IF EXISTS public.add_points(uuid, integer);
DROP FUNCTION IF EXISTS public.add_points_with_limits(uuid, integer);

CREATE OR REPLACE FUNCTION public.award_points(p_points integer)
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
      'points_awarded', 0,
      'total_points', v_total_points,
      'weekly_points', v_weekly_points,
      'monthly_points', v_monthly_points
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

  -- Sync to users table for backward compatibility
  UPDATE public.users
  SET
    points = COALESCE(points, 0) + v_points_to_award,
    weeklypoints = COALESCE(weeklypoints, 0) + v_points_to_award,
    monthlypoints = COALESCE(monthlypoints, 0) + v_points_to_award,
    updatedat = NOW()
  WHERE uid = v_uid;

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.award_points(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_points(integer) TO service_role;
GRANT ALL ON TABLE public.users_points TO authenticated;
GRANT ALL ON TABLE public.users_points TO service_role;
