-- 1. FIX COLUMNS (Ignore errors if columns don't exist)
DO $$ BEGIN
  ALTER TABLE public.users RENAME COLUMN "weeklyPoints" TO weeklypoints;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.users RENAME COLUMN "monthlyPoints" TO monthlypoints;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.users RENAME COLUMN "totalPoints" TO points;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. CREATE TABLES IF MISSING
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  age INTEGER,
  role TEXT DEFAULT 'kid',
  points INTEGER DEFAULT 0,
  weeklypoints INTEGER DEFAULT 0,
  monthlypoints INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Beginner',
  badges INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users_points (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    weekly_points INTEGER DEFAULT 0,
    monthly_points INTEGER DEFAULT 0,
    today_points INTEGER DEFAULT 0,
    last_earned_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENSURE COLUMNS EXIST
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weeklypoints INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS monthlypoints INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'kid';

-- 4. FIX PERMISSIONS (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = uid);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = uid);

DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
CREATE POLICY "Users can read their own profile" ON public.users FOR SELECT USING (auth.uid() = uid);

DROP POLICY IF EXISTS "Users can read own points" ON public.users_points;
CREATE POLICY "Users can read own points" ON public.users_points FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own points" ON public.users_points;
CREATE POLICY "Users can insert own points" ON public.users_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. CREATE FAIL-SAFE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (uid, email, name, age, role, points, weeklypoints, monthlypoints, level)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'Learner'), COALESCE((new.raw_user_meta_data->>'age')::int, 10), 'kid', 0, 0, 0, 'Beginner')
    ON CONFLICT (uid) DO NOTHING;
    
    INSERT INTO public.users_points (user_id, total_points) 
    VALUES (new.id, 0) 
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN 
    NULL; -- Swallow errors to allow signup to proceed
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ATTACH TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. GRANT PERMISSIONS
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.users_points TO authenticated;
GRANT ALL ON TABLE public.users_points TO service_role;
