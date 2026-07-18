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
