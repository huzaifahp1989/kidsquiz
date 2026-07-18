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
