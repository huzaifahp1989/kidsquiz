-- Fix the weekly reset RPC using the actual legacy users.weeklypoints column.
-- The previous definition referenced users.weekly_points, causing the entire
-- transaction (including the users_points reset) to roll back.
CREATE OR REPLACE FUNCTION public.reset_weekly_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.users_points
  SET weekly_points = 0
  WHERE weekly_points IS DISTINCT FROM 0;

  UPDATE public.users
  SET weeklypoints = 0
  WHERE weeklypoints IS DISTINCT FROM 0;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_weekly_leaderboard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_weekly_leaderboard() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_weekly_leaderboard() TO service_role;
