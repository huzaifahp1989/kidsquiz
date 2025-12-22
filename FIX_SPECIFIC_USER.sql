-- ============================================================================
-- Fix Specific User Account: huzaify786@gmail.com
-- Run this in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Find the user's UID
SELECT 
  uid,
  email,
  name,
  points,
  weeklypoints,
  monthlypoints,
  badges,
  daily_games_played,
  last_game_date,
  level,
  role,
  createdat,
  updatedat
FROM public.users
WHERE email = 'huzaify786@gmail.com';

-- STEP 2: Check auth.users table to ensure account exists
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users
WHERE email = 'huzaify786@gmail.com';

-- STEP 3: If user exists in auth.users but not in public.users, insert them
-- Replace 'USER_UID_HERE' with the actual UID from auth.users
DO $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  -- Get user ID from auth.users
  SELECT id, email INTO v_user_id, v_email
  FROM auth.users
  WHERE email = 'huzaify786@gmail.com'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Insert or update user in public.users
    INSERT INTO public.users (
      uid,
      email,
      name,
      age,
      role,
      points,
      weeklypoints,
      monthlypoints,
      badges,
      daily_games_played,
      last_game_date,
      level,
      createdat,
      updatedat
    ) VALUES (
      v_user_id,
      v_email,
      COALESCE((SELECT name FROM public.users WHERE uid = v_user_id), 'User'),
      COALESCE((SELECT age FROM public.users WHERE uid = v_user_id), 10),
      'kid',
      0,
      0,
      0,
      0,
      0,
      CURRENT_DATE,
      'Beginner',
      NOW(),
      NOW()
    )
    ON CONFLICT (uid) 
    DO UPDATE SET
      points = COALESCE(public.users.points, 0),
      weeklypoints = COALESCE(public.users.weeklypoints, 0),
      monthlypoints = COALESCE(public.users.monthlypoints, 0),
      badges = COALESCE(public.users.badges, 0),
      daily_games_played = COALESCE(public.users.daily_games_played, 0),
      last_game_date = COALESCE(public.users.last_game_date, CURRENT_DATE),
      level = COALESCE(public.users.level, 'Beginner'),
      updatedat = NOW();

    RAISE NOTICE 'User profile fixed for: %', v_email;
  ELSE
    RAISE NOTICE 'User not found in auth.users with email: huzaify786@gmail.com';
  END IF;
END $$;

-- STEP 4: Reset any problematic values for this user
UPDATE public.users
SET
  points = COALESCE(points, 0),
  weeklypoints = COALESCE(weeklypoints, 0),
  monthlypoints = COALESCE(monthlypoints, 0),
  badges = COALESCE(badges, 0),
  daily_games_played = COALESCE(daily_games_played, 0),
  last_game_date = COALESCE(last_game_date, CURRENT_DATE),
  level = COALESCE(level, 'Beginner'),
  updatedat = NOW()
WHERE email = 'huzaify786@gmail.com';

-- STEP 5: Test the add_points function for this user
-- Replace 'USER_UID_HERE' with actual UID
DO $$
DECLARE
  v_user_id uuid;
  v_result json;
BEGIN
  SELECT uid INTO v_user_id
  FROM public.users
  WHERE email = 'huzaify786@gmail.com'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Test adding 10 points
    SELECT public.add_points(v_user_id, 10) INTO v_result;
    RAISE NOTICE 'Test result: %', v_result;
  ELSE
    RAISE NOTICE 'Cannot test: User not found';
  END IF;
END $$;

-- STEP 6: Verify the fix
SELECT 
  uid,
  email,
  name,
  points,
  weeklypoints,
  monthlypoints,
  badges,
  daily_games_played,
  last_game_date,
  level,
  role
FROM public.users
WHERE email = 'huzaify786@gmail.com';

-- STEP 7: Check game and quiz progress for this user
SELECT 
  u.email,
  gp.gameid,
  gp.points,
  gp.playedat
FROM public.users u
LEFT JOIN public.game_progress gp ON u.uid = gp.uid
WHERE u.email = 'huzaify786@gmail.com'
ORDER BY gp.playedat DESC
LIMIT 10;

SELECT 
  u.email,
  qp.category,
  qp.score,
  qp.completed_at
FROM public.users u
LEFT JOIN public.quiz_progress qp ON u.uid = qp.uid
WHERE u.email = 'huzaify786@gmail.com'
ORDER BY qp.completed_at DESC
LIMIT 10;
