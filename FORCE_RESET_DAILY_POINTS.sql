-- FORCE RESET DAILY POINTS LIMIT
-- Run this script in the Supabase SQL Editor to reset the daily points counter for testing.

-- OPTION 1: Reset for ALL users
UPDATE public.users_points
SET today_points = 0,
    last_earned_date = CURRENT_DATE;

-- OPTION 2: Reset for a specific user (uncomment and replace UID)
-- UPDATE public.users_points
-- SET today_points = 0
-- WHERE user_id = 'YOUR_USER_ID_HERE';

-- OPTION 3: Reset only if they have reached the limit
-- UPDATE public.users_points
-- SET today_points = 0
-- WHERE today_points >= 100;

SELECT 'Daily points have been reset.' as status;
