-- ============================================================================
-- Points & Game RPC Functions for Islamic Kids Platform
-- Run in Supabase SQL Editor (project jlqrbbqsuksncrxjcmbc)
-- ============================================================================

BEGIN;
SET search_path TO public;

-- Helper: ensure user exists
CREATE OR REPLACE FUNCTION public._user_exists(p_uid uuid)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE uid = p_uid);
$$;

-- Add points (no limits)
CREATE OR REPLACE FUNCTION public.add_points(p_uid uuid, p_points_to_add integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists boolean;
  v_new_points integer;
  v_weekly integer;
  v_monthly integer;
  v_badges integer := 0;
BEGIN
  SELECT public._user_exists(p_uid) INTO v_exists;
  IF NOT v_exists THEN
    RETURN json_build_object('success', false, 'reason', 'Profile missing for uid', 'points_awarded', 0);
  END IF;

  -- Add points unconditionally
  UPDATE public.users
  SET points = COALESCE(points, 0) + COALESCE(p_points_to_add, 0),
      weeklypoints = COALESCE(weeklypoints, 0) + COALESCE(p_points_to_add, 0),
      monthlypoints = COALESCE(monthlypoints, 0) + COALESCE(p_points_to_add, 0),
      updatedat = NOW()
  WHERE uid = p_uid
  RETURNING points, weeklypoints, monthlypoints INTO v_new_points, v_weekly, v_monthly;

  RETURN json_build_object(
    'success', true,
    'points_awarded', COALESCE(p_points_to_add, 0),
    'games_remaining', NULL,
    'badges_earned', v_badges
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_points(uuid, integer) TO authenticated;

-- Game completion tracker (used by Games page)
CREATE OR REPLACE FUNCTION public.mark_game_completed(uid uuid, game_id text, score_val integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
BEGIN
  INSERT INTO public.game_progress(uid, gameId, points, playedAt)
  VALUES (uid, game_id, COALESCE(score_val, 0), NOW());

  RETURN json_build_object(
    'success', true,
    'game_id', game_id,
    'points', COALESCE(score_val, 0)
  );
EXCEPTION WHEN others THEN
  RETURN json_build_object('success', false, 'reason', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_game_completed(uuid, text, integer) TO authenticated;

COMMIT;
