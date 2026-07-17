-- ============================================================================
-- FIX POINTS SYNC: dual-table desync + robust award_points + pending manual grants
-- ============================================================================
-- Fixes "points not updating for some users" by:
-- 1. Standardizing users column names (camelCase -> lowercase)
-- 2. Making award_points robust when users sync fails
-- 3. Backfilling users_points from users when behind/missing
-- 4. Applying Sara/Husnain one-time grants only if not already applied
-- ============================================================================

-- STEP 1: Fix 'users' table columns
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

    BEGIN
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weeklypoints INTEGER DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS monthlypoints INTEGER DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS badges INTEGER DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- STEP 2: Tracking table for one-time manual adjustments (idempotency)
CREATE TABLE IF NOT EXISTS public.points_manual_adjustments (
  id BIGSERIAL PRIMARY KEY,
  adjustment_key TEXT NOT NULL,
  user_id UUID NOT NULL,
  points_added INTEGER NOT NULL DEFAULT 0,
  badges_added INTEGER NOT NULL DEFAULT 0,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (adjustment_key, user_id)
);

ALTER TABLE public.points_manual_adjustments ENABLE ROW LEVEL SECURITY;

-- STEP 3: Robust award_points — users_points is source of truth; users sync cannot roll back awards
-- Drop first: CREATE OR REPLACE cannot change return type (e.g. json -> jsonb)
DROP FUNCTION IF EXISTS public.award_points(integer);
DROP FUNCTION IF EXISTS public.award_points(int);
DROP FUNCTION IF EXISTS award_points(integer);
DROP FUNCTION IF EXISTS award_points(int);

CREATE OR REPLACE FUNCTION public.award_points(p_points int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_daily_limit INTEGER := 100;
  v_today_points INTEGER;
  v_total_points INTEGER;
  v_weekly_points INTEGER;
  v_monthly_points INTEGER;
  v_last_earned_date DATE;
  v_today_date DATE;
  v_new_today_points INTEGER;
  v_points_to_award INTEGER;
  v_user_total INTEGER := 0;
  v_user_weekly INTEGER := 0;
  v_user_monthly INTEGER := 0;
BEGIN
  v_uid := auth.uid();
  v_today_date := CURRENT_DATE;

  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Seed from users when users_points is missing/behind
  BEGIN
    SELECT COALESCE(points, 0), COALESCE(weeklypoints, 0), COALESCE(monthlypoints, 0)
    INTO v_user_total, v_user_weekly, v_user_monthly
    FROM public.users
    WHERE uid = v_uid;
  EXCEPTION WHEN OTHERS THEN
    v_user_total := 0;
    v_user_weekly := 0;
    v_user_monthly := 0;
  END;

  SELECT
    today_points, total_points, weekly_points, monthly_points, last_earned_date
  INTO
    v_today_points, v_total_points, v_weekly_points, v_monthly_points, v_last_earned_date
  FROM public.users_points
  WHERE user_id = v_uid;

  IF NOT FOUND THEN
    v_today_points := 0;
    v_total_points := v_user_total;
    v_weekly_points := v_user_weekly;
    v_monthly_points := v_user_monthly;
    v_last_earned_date := v_today_date;

    INSERT INTO public.users_points (user_id, total_points, today_points, weekly_points, monthly_points, last_earned_date)
    VALUES (v_uid, v_total_points, 0, v_weekly_points, v_monthly_points, v_today_date);
  ELSE
    v_total_points := GREATEST(COALESCE(v_total_points, 0), v_user_total);
    v_weekly_points := GREATEST(COALESCE(v_weekly_points, 0), v_user_weekly);
    v_monthly_points := GREATEST(COALESCE(v_monthly_points, 0), v_user_monthly);
  END IF;

  IF v_last_earned_date IS NULL OR v_last_earned_date < v_today_date THEN
    v_today_points := 0;
  END IF;

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

  UPDATE public.users_points
  SET
    today_points = v_new_today_points,
    total_points = v_total_points + v_points_to_award,
    weekly_points = v_weekly_points + v_points_to_award,
    monthly_points = v_monthly_points + v_points_to_award,
    last_earned_date = v_today_date,
    updated_at = NOW()
  WHERE user_id = v_uid;

  -- Sync to users table (never fail the award if this sync errors)
  BEGIN
    UPDATE public.users
    SET
      points = v_total_points + v_points_to_award,
      weeklypoints = v_weekly_points + v_points_to_award,
      monthlypoints = v_monthly_points + v_points_to_award,
      updatedat = NOW()
    WHERE uid = v_uid;
  EXCEPTION WHEN OTHERS THEN
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

GRANT EXECUTE ON FUNCTION public.award_points(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_points(integer) TO service_role;

-- STEP 4: Backfill users_points from users when behind/missing
UPDATE public.users_points up
SET
  total_points = GREATEST(COALESCE(up.total_points, 0), COALESCE(u.points, 0)),
  weekly_points = GREATEST(COALESCE(up.weekly_points, 0), COALESCE(u.weeklypoints, 0)),
  monthly_points = GREATEST(COALESCE(up.monthly_points, 0), COALESCE(u.monthlypoints, 0)),
  badges = GREATEST(COALESCE(up.badges, 0), COALESCE(u.badges, 0)),
  level = 1 + FLOOR(GREATEST(COALESCE(up.badges, 0), COALESCE(u.badges, 0)) / 5)
FROM public.users u
WHERE up.user_id = u.uid
  AND (
    COALESCE(u.points, 0) > COALESCE(up.total_points, 0)
    OR COALESCE(u.weeklypoints, 0) > COALESCE(up.weekly_points, 0)
    OR COALESCE(u.monthlypoints, 0) > COALESCE(up.monthly_points, 0)
    OR COALESCE(u.badges, 0) > COALESCE(up.badges, 0)
  );

INSERT INTO public.users_points (user_id, total_points, weekly_points, monthly_points, today_points, badges, level, last_earned_date)
SELECT
  u.uid,
  COALESCE(u.points, 0),
  COALESCE(u.weeklypoints, 0),
  COALESCE(u.monthlypoints, 0),
  0,
  COALESCE(u.badges, 0),
  1 + FLOOR(COALESCE(u.badges, 0) / 5),
  CURRENT_DATE
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.users_points up WHERE up.user_id = u.uid
);

-- Also lift users up when users_points is ahead
UPDATE public.users u
SET
  points = GREATEST(COALESCE(u.points, 0), COALESCE(up.total_points, 0)),
  weeklypoints = GREATEST(COALESCE(u.weeklypoints, 0), COALESCE(up.weekly_points, 0)),
  monthlypoints = GREATEST(COALESCE(u.monthlypoints, 0), COALESCE(up.monthly_points, 0)),
  badges = GREATEST(COALESCE(u.badges, 0), COALESCE(up.badges, 0)),
  updatedat = NOW()
FROM public.users_points up
WHERE up.user_id = u.uid
  AND (
    COALESCE(up.total_points, 0) > COALESCE(u.points, 0)
    OR COALESCE(up.weekly_points, 0) > COALESCE(u.weeklypoints, 0)
    OR COALESCE(up.monthly_points, 0) > COALESCE(u.monthlypoints, 0)
    OR COALESCE(up.badges, 0) > COALESCE(u.badges, 0)
  );

-- STEP 5: Apply Sara/Husnain one-time grants only if not already applied
DO $$
DECLARE
    v_sara_id UUID;
    v_husnain_id UUID;
BEGIN
    SELECT uid INTO v_sara_id FROM public.users WHERE name ILIKE '%Sara%' LIMIT 1;
    IF v_sara_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.points_manual_adjustments
      WHERE adjustment_key = 'sara_manual_388' AND user_id = v_sara_id
    ) THEN
        UPDATE public.users
        SET
            weeklypoints = COALESCE(weeklypoints, 0) + 388,
            points = COALESCE(points, 0) + 388,
            badges = COALESCE(badges, 0) + 3,
            updatedat = NOW()
        WHERE uid = v_sara_id;

        INSERT INTO public.users_points (user_id, weekly_points, total_points, badges, level, today_points, last_earned_date)
        VALUES (v_sara_id, 388, 388, 3, 1, 0, CURRENT_DATE)
        ON CONFLICT (user_id) DO UPDATE SET
            weekly_points = users_points.weekly_points + 388,
            total_points = users_points.total_points + 388,
            badges = users_points.badges + 3,
            level = 1 + FLOOR((users_points.badges + 3) / 5);

        INSERT INTO public.points_manual_adjustments (adjustment_key, user_id, points_added, badges_added)
        VALUES ('sara_manual_388', v_sara_id, 388, 3);

        RAISE NOTICE 'Applied Sara manual adjustment';
    ELSE
        RAISE NOTICE 'Sara manual adjustment skipped (missing or already applied)';
    END IF;

    SELECT uid INTO v_husnain_id FROM public.users WHERE name ILIKE '%Husnain%' LIMIT 1;
    IF v_husnain_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.points_manual_adjustments
      WHERE adjustment_key = 'husnain_manual_243' AND user_id = v_husnain_id
    ) THEN
        UPDATE public.users
        SET
            weeklypoints = COALESCE(weeklypoints, 0) + 243,
            points = COALESCE(points, 0) + 243,
            badges = COALESCE(badges, 0) + 2,
            updatedat = NOW()
        WHERE uid = v_husnain_id;

        INSERT INTO public.users_points (user_id, weekly_points, total_points, badges, level, today_points, last_earned_date)
        VALUES (v_husnain_id, 243, 243, 2, 1, 0, CURRENT_DATE)
        ON CONFLICT (user_id) DO UPDATE SET
            weekly_points = users_points.weekly_points + 243,
            total_points = users_points.total_points + 243,
            badges = users_points.badges + 2,
            level = 1 + FLOOR((users_points.badges + 2) / 5);

        INSERT INTO public.points_manual_adjustments (adjustment_key, user_id, points_added, badges_added)
        VALUES ('husnain_manual_243', v_husnain_id, 243, 2);

        RAISE NOTICE 'Applied Husnain manual adjustment';
    ELSE
        RAISE NOTICE 'Husnain manual adjustment skipped (missing or already applied)';
    END IF;
END $$;

-- STEP 6: Ensure RLS policies for points updates
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = uid);

DROP POLICY IF EXISTS "auth_update_own" ON public.users;
CREATE POLICY "auth_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = uid);

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

-- Verify
SELECT count(*) AS users_points_rows FROM public.users_points;
SELECT adjustment_key, user_id, points_added, badges_added, applied_at
FROM public.points_manual_adjustments
ORDER BY applied_at DESC;
