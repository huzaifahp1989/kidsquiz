-- ============================================================================
-- RESET ALL POINTS FOR ALL USERS
-- ============================================================================
-- WARNING: This will reset all point data for every user!
-- Run this ONLY if you're sure you want to reset everything
-- ============================================================================

-- OPTION 1: DELETE ALL ROWS (Complete Reset)
-- This removes all point records. New rows will be created when users earn points.
-- ⚠️ WARNING: This cannot be undone! Make a backup first if needed.
/*
DELETE FROM users_points;
*/

-- OPTION 2: SET ALL POINTS TO 0 (Keep Rows)
-- This keeps the user rows but resets all point values to 0
-- This is safer if you want to preserve user records
UPDATE users_points
SET 
  total_points = 0,
  weekly_points = 0,
  monthly_points = 0,
  today_points = 0,
  last_earned_date = CURRENT_DATE,
  updated_at = NOW();

-- ============================================================================
-- VERIFY THE RESET
-- ============================================================================
-- Run this to confirm all points are reset to 0
SELECT user_id, total_points, weekly_points, monthly_points, today_points
FROM users_points
LIMIT 10;

-- Expected: All point columns should show 0
-- ============================================================================
