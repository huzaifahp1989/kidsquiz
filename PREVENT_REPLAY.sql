-- Track Completed Quizzes and Games to Prevent Replaying

-- Create quiz_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.quiz_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  category TEXT NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  score INTEGER DEFAULT 0,
  UNIQUE(uid, category)
);

-- Create game_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  score INTEGER DEFAULT 0,
  UNIQUE(uid, game_id)
);

-- Enable RLS on quiz_progress
ALTER TABLE public.quiz_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_quiz_progress" ON public.quiz_progress;
CREATE POLICY "users_read_own_quiz_progress" ON public.quiz_progress
  FOR SELECT USING (auth.uid() = uid);

DROP POLICY IF EXISTS "users_insert_own_quiz_progress" ON public.quiz_progress;
CREATE POLICY "users_insert_own_quiz_progress" ON public.quiz_progress
  FOR INSERT WITH CHECK (auth.uid() = uid);

-- Enable RLS on game_progress
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_game_progress" ON public.game_progress;
CREATE POLICY "users_read_own_game_progress" ON public.game_progress
  FOR SELECT USING (auth.uid() = uid);

DROP POLICY IF EXISTS "users_insert_own_game_progress" ON public.game_progress;
CREATE POLICY "users_insert_own_game_progress" ON public.game_progress
  FOR INSERT WITH CHECK (auth.uid() = uid);

-- Function to check if user completed a quiz
CREATE OR REPLACE FUNCTION is_quiz_completed(uid UUID, category TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.quiz_progress
    WHERE quiz_progress.uid = uid AND quiz_progress.category = category
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user completed a game
CREATE OR REPLACE FUNCTION is_game_completed(uid UUID, game_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.game_progress
    WHERE game_progress.uid = uid AND game_progress.game_id = game_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark quiz as completed
CREATE OR REPLACE FUNCTION mark_quiz_completed(uid UUID, category TEXT, score_val INTEGER DEFAULT 0)
RETURNS JSON AS $$
DECLARE
  response JSON;
BEGIN
  INSERT INTO public.quiz_progress (uid, category, score)
  VALUES (uid, category, score_val)
  ON CONFLICT (uid, category) DO UPDATE
  SET completed_at = NOW(), score = score_val;
  
  response := json_build_object(
    'success', true,
    'message', 'Quiz marked as completed',
    'category', category
  );
  
  RETURN response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark game as completed
CREATE OR REPLACE FUNCTION mark_game_completed(uid UUID, game_id TEXT, score_val INTEGER DEFAULT 0)
RETURNS JSON AS $$
DECLARE
  response JSON;
BEGIN
  INSERT INTO public.game_progress (uid, game_id, score)
  VALUES (uid, game_id, score_val)
  ON CONFLICT (uid, game_id) DO UPDATE
  SET completed_at = NOW(), score = score_val;
  
  response := json_build_object(
    'success', true,
    'message', 'Game marked as completed',
    'game_id', game_id
  );
  
  RETURN response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_quiz_completed(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_game_completed(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_quiz_completed(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_game_completed(UUID, TEXT, INTEGER) TO authenticated;

-- Done!
