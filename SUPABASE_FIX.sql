-- FAIL-SAFE DATABASE FIX
-- Run this in Supabase SQL Editor

-- 1. Fix Columns
DO $$ BEGIN
  ALTER TABLE public.users RENAME COLUMN "weeklyPoints" TO weeklypoints;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.users RENAME COLUMN "monthlyPoints" TO monthlypoints;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.users RENAME COLUMN "totalPoints" TO points;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weeklypoints INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS monthlypoints INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'kid';

-- 2. Fix Permissions
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = uid);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = uid);

-- 3. Fix Trigger (Swallow Errors)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (uid, email, name, age, role, points, weeklypoints, monthlypoints, level)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'Learner'), COALESCE((new.raw_user_meta_data->>'age')::int, 10), 'kid', 0, 0, 0, 'Beginner')
    ON CONFLICT (uid) DO NOTHING;
    INSERT INTO public.users_points (user_id) VALUES (new.id) ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
