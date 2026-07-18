-- Allow the two documented daily attempts to cover different quiz topics.
-- Existing rows are retained under a non-reusable legacy topic.

ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS topic TEXT;

UPDATE public.quiz_attempts
SET topic = 'legacy'
WHERE topic IS NULL OR btrim(topic) = '';

ALTER TABLE public.quiz_attempts
  ALTER COLUMN topic SET DEFAULT 'all',
  ALTER COLUMN topic SET NOT NULL;

ALTER TABLE public.quiz_attempts
  DROP CONSTRAINT IF EXISTS quiz_attempts_user_id_quiz_id_key;

ALTER TABLE public.quiz_attempts
  DROP CONSTRAINT IF EXISTS quiz_attempts_topic_check;

ALTER TABLE public.quiz_attempts
  ADD CONSTRAINT quiz_attempts_topic_check
  CHECK (topic IN ('quran', 'hajj', 'salah', 'hadith', 'seerah', 'sahabah', 'all', 'legacy'));

CREATE UNIQUE INDEX IF NOT EXISTS quiz_attempts_user_quiz_topic_key
  ON public.quiz_attempts (user_id, quiz_id, topic);

-- Serialize attempts for the same user and UTC day before counting them. The
-- application check provides friendly feedback; this trigger is the atomic
-- backstop for concurrent requests and direct inserts.
CREATE OR REPLACE FUNCTION public.enforce_daily_quiz_attempt_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_completed_at TIMESTAMPTZ := COALESCE(NEW.completed_at, now());
  v_utc_day DATE := (v_completed_at AT TIME ZONE 'UTC')::DATE;
  v_attempt_count INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW.user_id::TEXT || ':' || v_utc_day::TEXT, 0)
  );

  SELECT count(*)
  INTO v_attempt_count
  FROM public.quiz_attempts
  WHERE user_id = NEW.user_id
    AND completed_at >= (v_utc_day::TIMESTAMP AT TIME ZONE 'UTC')
    AND completed_at < ((v_utc_day + 1)::TIMESTAMP AT TIME ZONE 'UTC');

  IF v_attempt_count >= 2 THEN
    RAISE EXCEPTION 'daily_quiz_attempt_limit_reached'
      USING ERRCODE = 'P0001';
  END IF;

  NEW.completed_at := v_completed_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_daily_quiz_attempt_limit_trigger
  ON public.quiz_attempts;

CREATE TRIGGER enforce_daily_quiz_attempt_limit_trigger
BEFORE INSERT ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_daily_quiz_attempt_limit();

-- Keep the attempt and its capped point award in the same transaction. The
-- insert trigger's advisory lock remains held until both point mirrors commit.
CREATE OR REPLACE FUNCTION public.submit_daily_topic_quiz_attempt(
  p_user_id UUID,
  p_quiz_id UUID,
  p_topic TEXT,
  p_score INTEGER,
  p_max_score INTEGER,
  p_duration_seconds INTEGER,
  p_is_flagged BOOLEAN,
  p_is_test_mode BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'UTC')::DATE;
  v_attempt_id UUID;
  v_points_total INTEGER;
  v_points_weekly INTEGER;
  v_points_monthly INTEGER;
  v_points_today INTEGER;
  v_last_earned_date DATE;
  v_user_total INTEGER;
  v_user_weekly INTEGER;
  v_user_monthly INTEGER;
  v_base_total INTEGER;
  v_base_weekly INTEGER;
  v_base_monthly INTEGER;
  v_current_today INTEGER;
  v_points_awarded INTEGER;
  v_new_total INTEGER;
  v_new_weekly INTEGER;
  v_new_monthly INTEGER;
  v_new_today INTEGER;
  v_reason TEXT;
BEGIN
  IF p_topic NOT IN ('quran', 'hajj', 'salah', 'hadith', 'seerah', 'sahabah')
     OR p_max_score <> 50
     OR p_score < 0
     OR p_score > p_max_score
     OR (p_duration_seconds IS NOT NULL AND p_duration_seconds < 0) THEN
    RAISE EXCEPTION 'invalid_daily_topic_quiz_attempt'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.daily_quizzes
    WHERE id = p_quiz_id
      AND quiz_date = v_today
  ) THEN
    RAISE EXCEPTION 'daily_topic_quiz_not_current'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.quiz_attempts (
    user_id,
    quiz_id,
    topic,
    score,
    max_score,
    duration_seconds,
    is_perfect_score,
    is_flagged,
    completed_at
  )
  VALUES (
    p_user_id,
    p_quiz_id,
    p_topic,
    p_score,
    p_max_score,
    p_duration_seconds,
    p_score = p_max_score,
    p_is_flagged,
    now()
  )
  RETURNING id INTO v_attempt_id;

  IF p_is_test_mode THEN
    RETURN jsonb_build_object(
      'attempt_id', v_attempt_id,
      'points_awarded', 0,
      'reason', 'test_mode',
      'today_points', 0,
      'daily_limit', 100
    );
  END IF;

  INSERT INTO public.users_points (
    user_id,
    total_points,
    weekly_points,
    monthly_points,
    today_points,
    last_earned_date
  )
  VALUES (p_user_id, 0, 0, 0, 0, v_today)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT
    total_points,
    weekly_points,
    monthly_points,
    today_points,
    last_earned_date
  INTO
    v_points_total,
    v_points_weekly,
    v_points_monthly,
    v_points_today,
    v_last_earned_date
  FROM public.users_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  SELECT points, weeklypoints, monthlypoints
  INTO v_user_total, v_user_weekly, v_user_monthly
  FROM public.users
  WHERE uid = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'quiz_user_profile_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  v_base_total := GREATEST(COALESCE(v_points_total, 0), COALESCE(v_user_total, 0));
  v_base_weekly := GREATEST(COALESCE(v_points_weekly, 0), COALESCE(v_user_weekly, 0));
  v_base_monthly := GREATEST(COALESCE(v_points_monthly, 0), COALESCE(v_user_monthly, 0));
  v_current_today := CASE
    WHEN v_last_earned_date = v_today THEN COALESCE(v_points_today, 0)
    ELSE 0
  END;

  v_points_awarded := GREATEST(
    0,
    LEAST(50, 100 - v_current_today, 400 - v_base_weekly)
  );
  v_new_total := v_base_total + v_points_awarded;
  v_new_weekly := v_base_weekly + v_points_awarded;
  v_new_monthly := v_base_monthly + v_points_awarded;
  v_new_today := v_current_today + v_points_awarded;
  v_reason := CASE
    WHEN v_points_awarded > 0 THEN 'awarded'
    WHEN v_current_today >= 100 THEN 'daily_limit_reached'
    ELSE 'weekly_limit_reached'
  END;

  UPDATE public.users_points
  SET
    total_points = v_new_total,
    weekly_points = v_new_weekly,
    monthly_points = v_new_monthly,
    today_points = v_new_today,
    last_earned_date = v_today
  WHERE user_id = p_user_id;

  UPDATE public.users
  SET
    points = v_new_total,
    weeklypoints = v_new_weekly,
    monthlypoints = v_new_monthly
  WHERE uid = p_user_id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'points_awarded', v_points_awarded,
    'reason', v_reason,
    'today_points', v_new_today,
    'daily_limit', 100
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_daily_topic_quiz_attempt(
  UUID, UUID, TEXT, INTEGER, INTEGER, INTEGER, BOOLEAN, BOOLEAN
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_daily_topic_quiz_attempt(
  UUID, UUID, TEXT, INTEGER, INTEGER, INTEGER, BOOLEAN, BOOLEAN
) TO service_role;
