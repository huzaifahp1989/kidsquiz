-- Claim the daily referral share reward and update every related total in one
-- transaction. The API calls this function with the service role after
-- authenticating the request.

CREATE OR REPLACE FUNCTION public.claim_referral_share_reward(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward_id UUID;
  v_reward_date DATE := (timezone('utc'::text, now()))::date;
  v_points_total INTEGER := 0;
  v_points_weekly INTEGER := 0;
  v_points_monthly INTEGER := 0;
  v_points_today INTEGER := 0;
  v_points_last_date DATE;
  v_user_total INTEGER := 0;
  v_user_weekly INTEGER := 0;
  v_user_monthly INTEGER := 0;
  v_user_email TEXT;
  v_base_total INTEGER;
  v_base_weekly INTEGER;
  v_base_monthly INTEGER;
  v_today_points INTEGER;
  v_points_awarded INTEGER;
  v_total_points INTEGER;
  v_weekly_points INTEGER;
  v_monthly_points INTEGER;
  v_badges INTEGER;
  v_level INTEGER;
  v_rows_updated INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user ID is required';
  END IF;

  INSERT INTO public.referral_share_rewards (
    user_id,
    reward_date,
    tokens_awarded,
    points_awarded
  )
  VALUES (p_user_id, v_reward_date, 0, 0)
  ON CONFLICT (user_id, reward_date) DO NOTHING
  RETURNING id INTO v_reward_id;

  IF v_reward_id IS NULL THEN
    SELECT
      GREATEST(COALESCE(up.total_points, 0), COALESCE(u.points, 0)),
      GREATEST(COALESCE(up.weekly_points, 0), COALESCE(u.weeklypoints, 0)),
      GREATEST(COALESCE(up.monthly_points, 0), COALESCE(u.monthlypoints, 0)),
      CASE
        WHEN up.last_earned_date = v_reward_date THEN COALESCE(up.today_points, 0)
        ELSE 0
      END,
      FLOOR(GREATEST(COALESCE(up.total_points, 0), COALESCE(u.points, 0)) / 100.0),
      1 + FLOOR(
        FLOOR(GREATEST(COALESCE(up.total_points, 0), COALESCE(u.points, 0)) / 100.0) / 5.0
      )
    INTO
      v_total_points,
      v_weekly_points,
      v_monthly_points,
      v_today_points,
      v_badges,
      v_level
    FROM public.users u
    LEFT JOIN public.users_points up ON up.user_id = u.uid
    WHERE u.uid = p_user_id;

    RETURN jsonb_build_object(
      'success', TRUE,
      'already_claimed_today', TRUE,
      'tokens_awarded', 0,
      'points_awarded', 0,
      'total_points', COALESCE(v_total_points, 0),
      'weekly_points', COALESCE(v_weekly_points, 0),
      'monthly_points', COALESCE(v_monthly_points, 0),
      'today_points', COALESCE(v_today_points, 0),
      'badges', COALESCE(v_badges, 0),
      'level', COALESCE(v_level, 1)
    );
  END IF;

  SELECT
    COALESCE(u.points, 0),
    COALESCE(u.weeklypoints, 0),
    COALESCE(u.monthlypoints, 0),
    LOWER(COALESCE(u.email, ''))
  INTO v_user_total, v_user_weekly, v_user_monthly, v_user_email
  FROM public.users u
  WHERE u.uid = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user profile not found';
  END IF;

  INSERT INTO public.users_points (
    user_id,
    total_points,
    weekly_points,
    monthly_points,
    today_points,
    last_earned_date,
    badges,
    level
  )
  VALUES (
    p_user_id,
    v_user_total,
    v_user_weekly,
    v_user_monthly,
    0,
    v_reward_date,
    FLOOR(v_user_total / 100.0),
    1 + FLOOR(FLOOR(v_user_total / 100.0) / 5.0)
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT
    COALESCE(up.total_points, 0),
    COALESCE(up.weekly_points, 0),
    COALESCE(up.monthly_points, 0),
    COALESCE(up.today_points, 0),
    up.last_earned_date
  INTO
    v_points_total,
    v_points_weekly,
    v_points_monthly,
    v_points_today,
    v_points_last_date
  FROM public.users_points up
  WHERE up.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'points row could not be created';
  END IF;

  v_base_total := GREATEST(v_points_total, v_user_total);
  v_base_weekly := GREATEST(v_points_weekly, v_user_weekly);
  v_base_monthly := GREATEST(v_points_monthly, v_user_monthly);
  v_today_points := CASE
    WHEN v_points_last_date = v_reward_date THEN v_points_today
    ELSE 0
  END;
  v_points_awarded := CASE
    WHEN v_user_email = 'huzaify786@gmail.com' THEN 0
    ELSE GREATEST(0, LEAST(2, 400 - v_base_weekly))
  END;
  v_total_points := v_base_total + v_points_awarded;
  v_weekly_points := v_base_weekly + v_points_awarded;
  v_monthly_points := v_base_monthly + v_points_awarded;
  v_badges := FLOOR(v_total_points / 100.0);
  v_level := 1 + FLOOR(v_badges / 5.0);

  UPDATE public.users_points
  SET total_points = v_total_points,
      weekly_points = v_weekly_points,
      monthly_points = v_monthly_points,
      badges = v_badges,
      level = v_level
  WHERE user_id = p_user_id;

  UPDATE public.users
  SET points = v_total_points,
      weeklypoints = v_weekly_points,
      monthlypoints = v_monthly_points
  WHERE uid = p_user_id;

  UPDATE public.referral_profiles
  SET tokens_earned = tokens_earned + 5,
      shares_count = shares_count + 1,
      points_earned = points_earned + v_points_awarded,
      last_share_reward_date = v_reward_date
  WHERE user_id = p_user_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  IF v_rows_updated <> 1 THEN
    RAISE EXCEPTION 'referral profile not found';
  END IF;

  UPDATE public.referral_share_rewards
  SET tokens_awarded = 5,
      points_awarded = v_points_awarded
  WHERE id = v_reward_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'already_claimed_today', FALSE,
    'tokens_awarded', 5,
    'points_awarded', v_points_awarded,
    'total_points', v_total_points,
    'weekly_points', v_weekly_points,
    'monthly_points', v_monthly_points,
    'today_points', v_today_points,
    'badges', v_badges,
    'level', v_level
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_referral_share_reward(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral_share_reward(UUID)
  TO service_role;
