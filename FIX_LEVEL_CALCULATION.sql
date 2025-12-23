-- ============================================================================
-- FIX LEVEL CALCULATION
-- Run this in Supabase SQL Editor to fix the "violates check constraint" error
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_level(p_points integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_points >= 500 THEN 'Young Scholar'
    WHEN p_points >= 250 THEN 'Explorer'
    WHEN p_points >= 25 THEN 'Learner'
    ELSE 'Beginner'
  END;
$$;
