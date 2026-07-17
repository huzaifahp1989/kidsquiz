-- Follow-up for installations that applied the first idempotency migration
-- before pledge logging and point updates were moved into one transaction.

ALTER TABLE public.pledges
  ALTER COLUMN points_awarded DROP NOT NULL,
  ALTER COLUMN points_awarded DROP DEFAULT,
  ALTER COLUMN award_status SET DEFAULT 'legacy';

ALTER TABLE public.pledges
  DROP CONSTRAINT IF EXISTS pledges_award_status_valid;

UPDATE public.pledges
SET points_awarded = NULL,
    award_status = 'legacy'
WHERE submission_id IS NULL;

ALTER TABLE public.pledges
  ADD CONSTRAINT pledges_award_status_valid
  CHECK (award_status IN ('legacy', 'pending', 'completed'));

DROP POLICY IF EXISTS "Users can insert their own pledges" ON public.pledges;
REVOKE INSERT, UPDATE, DELETE ON public.pledges FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_pledge_award(
  p_user_id UUID,
  p_submission_id UUID,
  p_type TEXT,
  p_subtype TEXT,
  p_count INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pledge_id UUID;
  v_existing_status TEXT;
  v_existing_points INTEGER;
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
  v_today_points INTEGER;
  v_requested_points INTEGER;
  v_points_awarded INTEGER;
  v_total_points INTEGER;
  v_weekly_points INTEGER;
  v_monthly_points INTEGER;
  v_badges INTEGER;
  v_level INTEGER;
  v_is_test_mode BOOLEAN := FALSE;
BEGIN
  IF p_user_id IS NULL OR p_submission_id IS NULL THEN
    RAISE EXCEPTION 'user and submission IDs are required';
  END IF;

  IF p_type NOT IN ('durood', 'zikr') THEN
    RAISE EXCEPTION 'invalid pledge type';
  END IF;

  IF (p_type = 'durood' AND p_subtype NOT IN ('short_durood', 'durood_ibrahim', 'jazallah_durood'))
     OR (p_type = 'zikr' AND p_subtype NOT IN (
       'subhanallah',
       'alhamdulillah',
       'allahu_akbar',
       'kalima_tayyiba',
       'astaghfirullah',
       'subhanallah_wb'
     )) THEN
    RAISE EXCEPTION 'invalid pledge selection';
  END IF;

  IF p_count IS NULL OR p_count < 1 OR p_count > 500 THEN
    RAISE EXCEPTION 'count must be a whole number from 1 to 500';
  END IF;

  INSERT INTO public.pledges (
    user_id,
    type,
    subtype,
    count,
    submission_id,
    points_awarded,
    award_status
  )
  VALUES (
    p_user_id,
    p_type,
    p_subtype,
    p_count,
    p_submission_id,
    0,
    'pending'
  )
  ON CONFLICT (user_id, submission_id) WHERE submission_id IS NOT NULL DO NOTHING
  RETURNING id INTO v_pledge_id;

  IF v_pledge_id IS NULL THEN
    SELECT award_status, points_awarded
    INTO v_existing_status, v_existing_points
    FROM public.pledges
    WHERE user_id = p_user_id
      AND submission_id = p_submission_id;

    IF COALESCE(v_existing_status, 'pending') <> 'completed' THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'This pledge needs manual reconciliation before it can be retried.'
      );
    END IF;

    SELECT total_points, weekly_points, monthly_points, today_points, last_earned_date
    INTO v_points_total, v_points_weekly, v_points_monthly, v_points_today, v_points_last_date
    FROM public.users_points
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
      'success', TRUE,
      'already_submitted', TRUE,
      'points_awarded', COALESCE(v_existing_points, 0),
      'award_status', v_existing_status,
      'total_points', COALESCE(v_points_total, 0),
      'weekly_points', COALESCE(v_points_weekly, 0),
      'monthly_points', COALESCE(v_points_monthly, 0),
      'today_points', CASE
        WHEN v_points_last_date = CURRENT_DATE THEN COALESCE(v_points_today, 0)
        ELSE 0
      END
    );
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
  VALUES (p_user_id, 0, 0, 0, 0, CURRENT_DATE, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT total_points, weekly_points, monthly_points, today_points, last_earned_date
  INTO v_points_total, v_points_weekly, v_points_monthly, v_points_today, v_points_last_date
  FROM public.users_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  SELECT
    COALESCE(points, 0),
    COALESCE(weeklypoints, 0),
    COALESCE(monthlypoints, 0),
    LOWER(COALESCE(email, '')) = 'huzaify786@gmail.com'
  INTO v_user_total, v_user_weekly, v_user_monthly, v_is_test_mode
  FROM public.users
  WHERE uid = p_user_id;

  v_base_total := GREATEST(COALESCE(v_points_total, 0), COALESCE(v_user_total, 0));
  v_base_weekly := GREATEST(COALESCE(v_points_weekly, 0), COALESCE(v_user_weekly, 0));
  v_base_monthly := GREATEST(COALESCE(v_points_monthly, 0), COALESCE(v_user_monthly, 0));
  v_today_points := CASE
    WHEN v_points_last_date = CURRENT_DATE THEN COALESCE(v_points_today, 0)
    ELSE 0
  END;
  v_requested_points := p_count / 5;
  v_points_awarded := CASE
    WHEN v_is_test_mode THEN 0
    ELSE GREATEST(0, LEAST(v_requested_points, 400 - v_base_weekly))
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

  UPDATE public.pledges
  SET points_awarded = v_points_awarded,
      award_status = 'completed'
  WHERE id = v_pledge_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'already_submitted', FALSE,
    'points_awarded', v_points_awarded,
    'total_points', v_total_points,
    'weekly_points', v_weekly_points,
    'monthly_points', v_monthly_points,
    'today_points', v_today_points
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_pledge_award(UUID, UUID, TEXT, TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_pledge_award(UUID, UUID, TEXT, TEXT, INTEGER)
  TO service_role;
