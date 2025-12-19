--- Reset All Users and Add Daily Game Limit System

-- Add new columns to users table for badge system and daily game tracking
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS badges INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_games_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_game_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_weekly_reset DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_monthly_reset DATE DEFAULT CURRENT_DATE;

-- Reset all user data
UPDATE public.users
SET 
  points = 0,
  weeklypoints = 0,
  monthlypoints = 0,
  badges = 0,
  daily_games_played = 0,
  last_game_date = CURRENT_DATE,
  level = 'Beginner',
  last_weekly_reset = CURRENT_DATE,
  last_monthly_reset = CURRENT_DATE
WHERE role = 'kid';

-- Create a function to check if daily games limit is reached
CREATE OR REPLACE FUNCTION check_daily_games_limit(p_uid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_date_val DATE;
  games_played INTEGER;
  last_game_date_val DATE;
  current_role TEXT;
BEGIN
  current_date_val := CURRENT_DATE;
  
  -- Fetch current state
  SELECT u.daily_games_played, u.last_game_date, u.role INTO games_played, last_game_date_val, current_role
  FROM public.users u
  WHERE u.uid = p_uid
  LIMIT 1;
  
  -- Admins have no daily limit
  IF current_role = 'admin' THEN
    RETURN 0;
  END IF;
  
  -- If last_game_date is before today, reset counter
  IF last_game_date_val < current_date_val THEN
    UPDATE public.users
    SET daily_games_played = 0, last_game_date = current_date_val
    WHERE uid = p_uid;
    RETURN 0;
  END IF;
  
  RETURN COALESCE(games_played, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dev mode: add points without daily/weekly limits (for testing)
CREATE OR REPLACE FUNCTION add_points_dev(
  p_uid UUID,
  p_points_to_add INTEGER
)
RETURNS JSON AS $$
DECLARE
  current_date_val DATE;
  games_played INTEGER;
  current_weekly INTEGER;
  current_monthly INTEGER;
  current_total INTEGER;
  new_total INTEGER;
  new_weekly INTEGER;
  new_monthly INTEGER;
  new_badges INTEGER;
  response JSON;
BEGIN
  current_date_val := CURRENT_DATE;

  SELECT u.daily_games_played, u.weeklypoints, u.monthlypoints, u.points
  INTO games_played, current_weekly, current_monthly, current_total
  FROM public.users u
  WHERE u.uid = p_uid
  LIMIT 1;

  IF current_total IS NULL THEN
    RETURN json_build_object('success', false, 'reason', 'User not found');
  END IF;

  new_weekly := current_weekly + p_points_to_add;
  new_total := current_total + p_points_to_add;
  new_monthly := current_monthly + p_points_to_add;
  new_badges := FLOOR(new_total / 250);

  UPDATE public.users
  SET
    points = new_total,
    weeklypoints = new_weekly,
    monthlypoints = new_monthly,
    badges = new_badges,
    daily_games_played = COALESCE(games_played, 0) + 1,
    last_game_date = current_date_val,
    level = CASE
      WHEN new_total >= 200 THEN 'Expert'
      WHEN new_total >= 150 THEN 'Advanced'
      WHEN new_total >= 100 THEN 'Intermediate'
      WHEN new_total >= 50 THEN 'Learner'
      ELSE 'Beginner'
    END,
    updatedat = NOW()
  WHERE uid = p_uid;

  response := json_build_object(
    'success', true,
    'points_awarded', p_points_to_add,
    'total_points', new_total,
    'weekly_points', new_weekly,
    'monthly_points', new_monthly,
    'badges_earned', new_badges,
    'games_played_today', COALESCE(games_played, 0) + 1,
    'games_remaining', GREATEST(0, 3 - (COALESCE(games_played, 0) + 1))
  );

  RETURN response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to increment daily games and award badges
CREATE OR REPLACE FUNCTION add_points_with_limits(
  p_uid UUID,
  p_points_to_add INTEGER
)
RETURNS JSON AS $$
DECLARE
  current_date_val DATE;
  games_played INTEGER;
  last_game_date_val DATE;
  current_weekly INTEGER;
  current_monthly INTEGER;
  current_total INTEGER;
  current_badges INTEGER;
  current_role TEXT;
  weekly_limit INTEGER := 250;
  daily_games_limit INTEGER := 3;
  new_total INTEGER;
  new_weekly INTEGER;
  new_monthly INTEGER;
  new_badges INTEGER;
  response JSON;
BEGIN
  current_date_val := CURRENT_DATE;
  
  -- Fetch current state
  SELECT 
    u.daily_games_played, u.last_game_date, u.weeklypoints, u.monthlypoints, 
    u.points, u.badges, u.role
  INTO 
    games_played, last_game_date_val, current_weekly, current_monthly, 
    current_total, current_badges, current_role
  FROM public.users u
  WHERE u.uid = p_uid
  LIMIT 1;
  
  IF current_total IS NULL THEN
    RETURN json_build_object('success', false, 'reason', 'User not found');
  END IF;
  
  -- Reset daily counter if date changed
  IF last_game_date_val < current_date_val THEN
    games_played := 0;
  END IF;
  
  -- Check daily games limit
  IF current_role <> 'admin' AND games_played >= daily_games_limit THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'Daily game limit reached (3 games per day)',
      'games_played', games_played
    );
  END IF;
  
  -- Check weekly limit
  IF current_role <> 'admin' AND current_weekly >= weekly_limit THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'Weekly point limit reached (250 points per week)',
      'weekly_points', current_weekly
    );
  END IF;
  
  -- Calculate points to award (respect limits)
  new_weekly := LEAST(current_weekly + p_points_to_add, weekly_limit);
  new_total := current_total + (new_weekly - current_weekly);
  new_monthly := current_monthly + (new_weekly - current_weekly);
  
  -- Check if badges should be awarded (every 250 points)
  new_badges := FLOOR(new_total / 250);
  
  -- Update user with all new data
  UPDATE public.users
  SET 
    points = new_total,
    weeklypoints = new_weekly,
    monthlypoints = new_monthly,
    badges = new_badges,
    daily_games_played = games_played + 1,
    last_game_date = current_date_val,
    level = CASE
      WHEN new_total >= 200 THEN 'Expert'
      WHEN new_total >= 150 THEN 'Advanced'
      WHEN new_total >= 100 THEN 'Intermediate'
      WHEN new_total >= 50 THEN 'Learner'
      ELSE 'Beginner'
    END,
    updatedat = NOW()
  WHERE uid = p_uid;
  
  response := json_build_object(
    'success', true,
    'points_awarded', new_weekly - current_weekly,
    'total_points', new_total,
    'weekly_points', new_weekly,
    'monthly_points', new_monthly,
    'badges_earned', new_badges,
    'games_played_today', games_played + 1,
    'games_remaining', daily_games_limit - (games_played + 1)
  );
  
  RETURN response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_daily_games_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_points_with_limits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_points_dev(UUID, INTEGER) TO authenticated;

-- Update RLS policies to allow users to call these functions
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own data
DROP POLICY IF EXISTS "authenticated_read_own_users" ON public.users;
CREATE POLICY "authenticated_read_own_users" ON public.users
  FOR SELECT USING (auth.uid() = uid);

-- Allow authenticated users to update their own data through functions
DROP POLICY IF EXISTS "authenticated_update_own_users" ON public.users;
CREATE POLICY "authenticated_update_own_users" ON public.users
  FOR UPDATE USING (auth.uid() = uid);

-- Allow anyone to read public leaderboard data
DROP POLICY IF EXISTS "public_read_leaderboard" ON public.users;
CREATE POLICY "public_read_leaderboard" ON public.users
  FOR SELECT USING (true);

-- Done!
