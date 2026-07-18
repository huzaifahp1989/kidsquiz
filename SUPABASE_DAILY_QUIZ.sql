-- ============================================================================
-- DAILY QUIZ SYSTEM TABLES
-- ============================================================================

-- 1. QUESTIONS POOL
-- Stores all available questions to be picked for daily quizzes
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('Quran Basics', 'Duas', 'Salah & Wudu', 'Seerah', 'Islamic Manners', 'Hadith', 'Prophets', 'Quran Stories', 'Akhlaq')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of strings
  correct_answer_index INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT DEFAULT 'Medium',
  reference TEXT, -- e.g., "Talimul Haq"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS questions_category_idx ON questions(category);
CREATE INDEX IF NOT EXISTS questions_last_used_idx ON questions(last_used_at);

-- 2. DAILY QUIZZES
-- Stores the generated quiz for each day
CREATE TABLE IF NOT EXISTS daily_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  question_ids JSONB NOT NULL, -- Array of UUIDs from questions table
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS daily_quizzes_date_idx ON daily_quizzes(quiz_date);

-- 3. QUIZ ATTEMPTS (Daily Quiz Specific)
-- Tracks user attempts for the daily quiz
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES daily_quizzes(id) ON DELETE CASCADE,
  topic TEXT NOT NULL DEFAULT 'all' CHECK (topic IN ('quran', 'hajj', 'salah', 'hadith', 'seerah', 'sahabah', 'all', 'legacy')),
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  is_perfect_score BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE, -- Anti-cheat flag
  UNIQUE(user_id, quiz_id, topic) -- One attempt per topic in the daily quiz
);

CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_idx ON quiz_attempts(quiz_id);

-- Atomically enforce the two-attempt UTC daily limit under concurrency
CREATE OR REPLACE FUNCTION enforce_daily_quiz_attempt_limit()
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
  FROM quiz_attempts
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
  ON quiz_attempts;

CREATE TRIGGER enforce_daily_quiz_attempt_limit_trigger
BEFORE INSERT ON quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION enforce_daily_quiz_attempt_limit();

-- Atomically record a topic attempt and apply its capped 50-point reward
CREATE OR REPLACE FUNCTION submit_daily_topic_quiz_attempt(
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
    FROM daily_quizzes
    WHERE id = p_quiz_id
      AND quiz_date = v_today
  ) THEN
    RAISE EXCEPTION 'daily_topic_quiz_not_current'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO quiz_attempts (
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

  INSERT INTO users_points (
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
  FROM users_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  SELECT points, weeklypoints, monthlypoints
  INTO v_user_total, v_user_weekly, v_user_monthly
  FROM users
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

  UPDATE users_points
  SET
    total_points = v_new_total,
    weekly_points = v_new_weekly,
    monthly_points = v_new_monthly,
    today_points = v_new_today,
    last_earned_date = v_today
  WHERE user_id = p_user_id;

  UPDATE users
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

REVOKE ALL ON FUNCTION submit_daily_topic_quiz_attempt(
  UUID, UUID, TEXT, INTEGER, INTEGER, INTEGER, BOOLEAN, BOOLEAN
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION submit_daily_topic_quiz_attempt(
  UUID, UUID, TEXT, INTEGER, INTEGER, INTEGER, BOOLEAN, BOOLEAN
) TO service_role;

-- 4. POINTS LEDGER
-- Detailed transaction log for points (as requested)
CREATE TABLE IF NOT EXISTS points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'quiz_attempt', 'streak_bonus', 'completion_bonus'
  reference_id UUID, -- Link to quiz_attempts.id or other source
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS points_ledger_user_idx ON points_ledger(user_id);

-- 5. WEEKLY WINNERS
-- Stores the selected winner for each week
CREATE TABLE IF NOT EXISTS weekly_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  winner_user_id UUID REFERENCES auth.users(id),
  selection_seed TEXT,
  eligible_participants JSONB, -- List of user IDs who were eligible
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Add Streak columns to users if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_streak_update DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_winners ENABLE ROW LEVEL SECURITY;

-- Questions: Everyone can read, only service role/admin can write
CREATE POLICY "Everyone can read questions" ON questions FOR SELECT USING (true);

-- Daily Quizzes: Everyone can read, only service role/admin can write
CREATE POLICY "Everyone can read daily quizzes" ON daily_quizzes FOR SELECT USING (true);

-- Quiz Attempts: Users can read/insert their own
CREATE POLICY "Users can read own attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Points Ledger: Users can read their own
CREATE POLICY "Users can read own ledger" ON points_ledger FOR SELECT USING (auth.uid() = user_id);

-- Weekly Winners: Everyone can read
CREATE POLICY "Everyone can read winners" ON weekly_winners FOR SELECT USING (true);

