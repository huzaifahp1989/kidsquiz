UPDATE users_points
SET 
  total_points = 0,
  weekly_points = 0,
  monthly_points = 0,
  today_points = 0,
  last_earned_date = CURRENT_DATE,
  updated_at = NOW();

SELECT COUNT(*) as rows_reset FROM users_points;
