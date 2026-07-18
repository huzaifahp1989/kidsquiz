-- Make App Store and Google Play feedback rewards exactly-once.
-- The claim marker and point updates now commit in the same transaction.

CREATE TABLE IF NOT EXISTS public.one_time_reward_claims (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_key TEXT NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, reward_key)
);

ALTER TABLE public.one_time_reward_claims ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.one_time_reward_claims FROM anon, authenticated;
GRANT ALL ON public.one_time_reward_claims TO service_role;

-- Preserve claims recorded by the previous implementation so deploying this
-- migration cannot make an already-claimed reward available again.
DO $$
BEGIN
  IF to_regclass('public.game_activity_logs') IS NOT NULL THEN
    EXECUTE $backfill$
      INSERT INTO public.one_time_reward_claims (
        user_id,
        reward_key,
        points_awarded,
        claimed_at
      )
      SELECT
        logs.user_id,
        logs.game_id,
        GREATEST(MAX(COALESCE(logs.points_earned, 0)), 0),
        MIN(COALESCE(logs.played_at, NOW()))
      FROM public.game_activity_logs AS logs
      JOIN auth.users AS auth_user ON auth_user.id = logs.user_id
      WHERE logs.game_id IN ('feedback-review-ios', 'feedback-review-android')
      GROUP BY logs.user_id, logs.game_id
      ON CONFLICT (user_id, reward_key) DO NOTHING
    $backfill$;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_feedback_reward(
  p_user_id UUID,
  p_platform TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward_key TEXT;
  v_platform_label TEXT;
  v_claim_inserted UUID;
  v_user_email TEXT;
  v_points_total INTEGER := 0;
  v_points_weekly INTEGER := 0;
  v_points_monthly INTEGER := 0;
  v_points_today INTEGER := 0;
  v_points_last_date DATE;
  v_user_total INTEGER := 0;
  v_user_weekly INTEGER := 0;
  v_user_monthly INTEGER := 0;
  v_base_total INTEGER;
  v_base_weekly INTEGER;
  v_base_monthly INTEGER;
  v_points_awarded INTEGER;
  v_total_points INTEGER;
  v_weekly_points INTEGER;
  v_monthly_points INTEGER;
BEGIN
  IF p_platform NOT IN ('ios', 'android') THEN
    RAISE EXCEPTION 'platform must be "ios" or "android"'
      USING ERRCODE = '22023';
  END IF;

  v_reward_key := 'feedback-review-' || p_platform;
  v_platform_label := CASE WHEN p_platform = 'ios' THEN 'App Store' ELSE 'Google Play' END;

  -- This insert is the concurrency gate. ON CONFLICT waits for an in-flight
  -- claimant and only one transaction can proceed to the point update.
  INSERT INTO public.one_time_reward_claims (user_id, reward_key)
  VALUES (p_user_id, v_reward_key)
  ON CONFLICT (user_id, reward_key) DO NOTHING
  RETURNING user_id INTO v_claim_inserted;

  IF v_claim_inserted IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'already_claimed', true,
      'points_awarded', 0,
      'message', 'You have already claimed the ' || v_platform_label || ' review reward.'
    );
  END IF;

  SELECT LOWER(TRIM(COALESCE(profile.email, auth_user.email, '')))
  INTO v_user_email
  FROM auth.users AS auth_user
  LEFT JOIN public.users AS profile ON profile.uid = auth_user.id
  WHERE auth_user.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  -- Test accounts record the one-time claim without changing leaderboards.
  IF v_user_email = 'huzaify786@gmail.com' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_claimed', false,
      'points_awarded', 0,
      'total_points', 0,
      'message', 'Test mode active for this account. Reward claimed without adding leaderboard points.'
    );
  END IF;

  SELECT
    COALESCE(points, 0),
    COALESCE(weeklypoints, 0),
    COALESCE(monthlypoints, 0)
  INTO v_user_total, v_user_weekly, v_user_monthly
  FROM public.users
  WHERE uid = p_user_id
  FOR UPDATE;

  v_user_total := COALESCE(v_user_total, 0);
  v_user_weekly := COALESCE(v_user_weekly, 0);
  v_user_monthly := COALESCE(v_user_monthly, 0);

  -- Seed a missing canonical row from the legacy users snapshot. Never seed
  -- from zero when the other table contains earned points.
  INSERT INTO public.users_points (
    user_id,
    total_points,
    weekly_points,
    monthly_points,
    today_points,
    last_earned_date
  )
  VALUES (
    p_user_id,
    v_user_total,
    v_user_weekly,
    v_user_monthly,
    0,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT
    COALESCE(total_points, 0),
    COALESCE(weekly_points, 0),
    COALESCE(monthly_points, 0),
    COALESCE(today_points, 0),
    last_earned_date
  INTO
    v_points_total,
    v_points_weekly,
    v_points_monthly,
    v_points_today,
    v_points_last_date
  FROM public.users_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_base_total := GREATEST(v_points_total, v_user_total);
  v_base_weekly := GREATEST(v_points_weekly, v_user_weekly);
  v_base_monthly := GREATEST(v_points_monthly, v_user_monthly);
  v_points_awarded := GREATEST(0, LEAST(30, 400 - v_base_weekly));
  v_total_points := v_base_total + v_points_awarded;
  v_weekly_points := v_base_weekly + v_points_awarded;
  v_monthly_points := v_base_monthly + v_points_awarded;

  UPDATE public.users_points
  SET total_points = v_total_points,
      weekly_points = v_weekly_points,
      monthly_points = v_monthly_points,
      -- Feedback is a bonus and must not consume the daily quiz allowance.
      today_points = v_points_today,
      last_earned_date = v_points_last_date,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE public.users
  SET points = v_total_points,
      weeklypoints = v_weekly_points,
      monthlypoints = v_monthly_points
  WHERE uid = p_user_id;

  UPDATE public.one_time_reward_claims
  SET points_awarded = v_points_awarded
  WHERE user_id = p_user_id
    AND reward_key = v_reward_key;

  -- Keep the existing activity audit when that optional table is installed.
  BEGIN
    INSERT INTO public.game_activity_logs (
      user_id,
      game_id,
      game_title,
      points_earned,
      played_at
    )
    VALUES (
      p_user_id,
      v_reward_key,
      v_platform_label || ' Review Reward',
      v_points_awarded,
      NOW()
    );
  EXCEPTION
    WHEN undefined_table THEN NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'points_awarded', v_points_awarded,
    'total_points', v_total_points,
    'weekly_points', v_weekly_points,
    'monthly_points', v_monthly_points,
    'today_points', v_points_today,
    'message', CASE
      WHEN v_points_awarded > 0
        THEN '+' || v_points_awarded || ' points for leaving a ' || v_platform_label || ' review!'
      ELSE 'Reward claimed, but no points were added because the weekly limit is reached.'
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_feedback_reward(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_feedback_reward(UUID, TEXT)
  TO service_role;
