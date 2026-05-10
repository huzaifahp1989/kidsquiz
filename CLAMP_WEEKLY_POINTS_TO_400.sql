-- Normalize leaderboard weekly points.
-- Policy: if weekly points are at or above 400, set them to 300
-- so users still have 100 points left to achieve this week.
-- Run once in Supabase SQL editor.

begin;

-- users_points is the primary source used by leaderboard queries.
update users_points
set weekly_points = 300
where coalesce(weekly_points, 0) >= 400;

-- Keep legacy mirror in sync.
update users
set weeklypoints = 300
where coalesce(weeklypoints, 0) >= 400;

commit;

-- Verify: should return 0 rows after running.
select count(*) as users_points_at_or_above_400
from users_points
where coalesce(weekly_points, 0) >= 400;

select count(*) as users_at_or_above_400
from users
where coalesce(weeklypoints, 0) >= 400;
