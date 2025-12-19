-- ============================================================================
-- Migration: Align quiz_progress schema to category-based model + RPC functions
-- Run in Supabase SQL Editor
-- ============================================================================

BEGIN;

-- Ensure we operate on the public schema
SET search_path TO public;

-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.quiz_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE
);

-- Add required columns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quiz_progress' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.quiz_progress ADD COLUMN category TEXT NOT NULL DEFAULT 'Unknown';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quiz_progress' AND column_name = 'score'
  ) THEN
    ALTER TABLE public.quiz_progress ADD COLUMN score INTEGER DEFAULT 0 CHECK (score >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quiz_progress' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.quiz_progress ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Drop legacy columns if present
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quiz_progress' AND column_name = 'quizid'
  ) THEN
    ALTER TABLE public.quiz_progress DROP COLUMN quizid;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quiz_progress' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE public.quiz_progress DROP COLUMN difficulty;
  END IF;
END $$;

-- Cleanup duplicates before applying UNIQUE
DELETE FROM public.quiz_progress qp
USING (
  SELECT id, uid, category,
         ROW_NUMBER() OVER (PARTITION BY uid, category ORDER BY completed_at DESC NULLS LAST) AS rn
  FROM public.quiz_progress
) d
WHERE qp.id = d.id AND d.rn > 1;

-- Unique constraint on (uid, category)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_progress_uid_category_key'
  ) THEN
    ALTER TABLE public.quiz_progress ADD CONSTRAINT quiz_progress_uid_category_key UNIQUE (uid, category);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_uid ON public.quiz_progress(uid);
CREATE INDEX IF NOT EXISTS idx_quiz_category ON public.quiz_progress(category);
CREATE INDEX IF NOT EXISTS idx_quiz_completed ON public.quiz_progress(completed_at DESC);

-- RLS
ALTER TABLE public.quiz_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_auth_select_own" ON public.quiz_progress;
CREATE POLICY "quiz_auth_select_own" ON public.quiz_progress
  FOR SELECT USING (auth.uid() = uid);

DROP POLICY IF EXISTS "quiz_auth_insert_own" ON public.quiz_progress;
CREATE POLICY "quiz_auth_insert_own" ON public.quiz_progress
  FOR INSERT WITH CHECK (auth.uid() = uid);

-- ============================================================================
-- RPC Functions used by the app
-- ============================================================================

-- Check if quiz completed
CREATE OR REPLACE FUNCTION public.is_quiz_completed(p_uid uuid, p_category text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quiz_progress qp
    WHERE qp.uid = p_uid AND qp.category = p_category
  );
$$;

-- Mark quiz as completed (idempotent via ON CONFLICT)
CREATE OR REPLACE FUNCTION public.mark_quiz_completed(uid uuid, category text, score_val integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
BEGIN
  INSERT INTO public.quiz_progress(uid, category, score)
  VALUES (uid, category, COALESCE(score_val, 0))
  ON CONFLICT (uid, category)
  DO UPDATE SET score = EXCLUDED.score, completed_at = NOW();

  RETURN json_build_object(
    'success', true,
    'category', category,
    'points_awarded', COALESCE(score_val, 0)
  );
EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false,
    'reason', SQLERRM,
    'category', category
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_quiz_completed(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_quiz_completed(uuid, text, integer) TO authenticated;

COMMIT;
