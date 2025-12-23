-- ============================================================================
-- FIX DATA SYNC AND MIGRATION
-- ============================================================================
-- 1. Syncs points from legacy 'users' table to new 'users_points' table
-- 2. Ensures column names are correct
-- 3. Grants permissions
-- ============================================================================

-- STEP 1: Sync Legacy Points
-- If a user has points in 'users' but 0 in 'users_points', copy them over.
UPDATE public.users_points up
SET 
  total_points = u.points,
  weekly_points = COALESCE(u.weeklypoints, 0),
  monthly_points = COALESCE(u.monthlypoints, 0)
FROM public.users u
WHERE up.user_id = u.uid
AND up.total_points = 0
AND u.points > 0;

-- STEP 2: Create Missing Records
-- If a user exists in 'users' but not in 'users_points', create the record.
INSERT INTO public.users_points (user_id, total_points, weekly_points, monthly_points, today_points, last_earned_date)
SELECT 
  uid, 
  COALESCE(points, 0), 
  COALESCE(weeklypoints, 0), 
  COALESCE(monthlypoints, 0), 
  0, 
  CURRENT_DATE
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.users_points up WHERE up.user_id = u.uid
);

-- STEP 3: Handle CamelCase Columns in users_points (Migration)
-- If totalPoints exists in users_points (from old schema), copy to total_points
DO $$
BEGIN
    -- Check if totalPoints column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users_points' AND column_name='totalPoints') THEN
        -- Copy data
        EXECUTE 'UPDATE public.users_points SET total_points = "totalPoints" WHERE total_points = 0 AND "totalPoints" > 0';
    END IF;
END $$;

-- STEP 4: Force Refresh of Policies
ALTER TABLE public.users_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own points" ON public.users_points;
CREATE POLICY "Users can view own points"
  ON public.users_points FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own points" ON public.users_points;
CREATE POLICY "Users can insert own points"
  ON public.users_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own points" ON public.users_points;
CREATE POLICY "Users can update own points"
  ON public.users_points FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify
SELECT count(*) as migrated_users FROM public.users_points;
