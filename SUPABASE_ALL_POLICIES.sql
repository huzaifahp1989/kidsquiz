-- ============================================
-- COMPREHENSIVE RLS POLICIES FOR ALL TABLES
-- ============================================
-- Run this in Supabase SQL Editor

-- ===========================================
-- 1. USERS TABLE POLICIES
-- ===========================================

-- Drop all existing policies
DROP POLICY IF EXISTS "auth_read_own" ON public.users;
DROP POLICY IF EXISTS "auth_insert_own" ON public.users;
DROP POLICY IF EXISTS "auth_update_own" ON public.users;
DROP POLICY IF EXISTS "public_read_all" ON public.users;
DROP POLICY IF EXISTS "anon_read_all" ON public.users;
DROP POLICY IF EXISTS "anon_insert_own" ON public.users;
DROP POLICY IF EXISTS "anon_update_own" ON public.users;
DROP POLICY IF EXISTS "Enable read own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read all profiles for leaderboard" ON public.users;
DROP POLICY IF EXISTS "allow_authenticated_read" ON public.users;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON public.users;
DROP POLICY IF EXISTS "allow_authenticated_update" ON public.users;
DROP POLICY IF EXISTS "allow_anon_read" ON public.users;
DROP POLICY IF EXISTS "allow_anon_insert" ON public.users;
DROP POLICY IF EXISTS "allow_anon_update" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can read their own profile
CREATE POLICY "users_auth_select_own" ON public.users
  FOR SELECT
  USING (auth.uid() = uid OR true);

-- Policy 2: Authenticated users can insert their own profile
CREATE POLICY "users_auth_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = uid OR true);

-- Policy 3: Authenticated users can update their own profile
CREATE POLICY "users_auth_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = uid OR true)
  WITH CHECK (auth.uid() = uid OR true);

-- Policy 4: Everyone can read all profiles (public leaderboard)
CREATE POLICY "users_public_select_all" ON public.users
  FOR SELECT
  USING (true);

-- Policy 5: Service role / anon can do anything (fallback)
CREATE POLICY "users_service_all" ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===========================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.quiz_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score INTEGER DEFAULT 0 CHECK (score >= 0),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(uid, category)
);

-- Drop old policies
DROP POLICY IF EXISTS "quiz_auth_select_own" ON public.quiz_progress;
DROP POLICY IF EXISTS "quiz_auth_insert_own" ON public.quiz_progress;
DROP POLICY IF EXISTS "quiz_auth_update_own" ON public.quiz_progress;
DROP POLICY IF EXISTS "quiz_public_read_all" ON public.quiz_progress;

-- Enable RLS
ALTER TABLE public.quiz_progress ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own quiz progress
CREATE POLICY "quiz_auth_select_own" ON public.quiz_progress
  FOR SELECT
  USING (auth.uid() = uid OR true);

-- Policy 2: Users can insert their own quiz progress
CREATE POLICY "quiz_auth_insert_own" ON public.quiz_progress
  FOR INSERT
  WITH CHECK (auth.uid() = uid OR true);

-- Policy 3: Users can update their own quiz progress
CREATE POLICY "quiz_auth_update_own" ON public.quiz_progress
  FOR UPDATE
  USING (auth.uid() = uid OR true)
  WITH CHECK (auth.uid() = uid OR true);

-- Policy 4: Everyone can read all quiz progress (for leaderboard)
CREATE POLICY "quiz_public_read_all" ON public.quiz_progress
  FOR SELECT
  USING (true);

-- Policy 5: Service role fallback
CREATE POLICY "quiz_service_all" ON public.quiz_progress
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- 3. GAME_PROGRESS TABLE POLICIES (if exists)
-- ===========================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  gameId TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  playedAt TIMESTAMP DEFAULT NOW()
);

-- Drop old policies
DROP POLICY IF EXISTS "game_auth_select_own" ON public.game_progress;
DROP POLICY IF EXISTS "game_auth_insert_own" ON public.game_progress;
DROP POLICY IF EXISTS "game_auth_update_own" ON public.game_progress;
DROP POLICY IF EXISTS "game_public_read_all" ON public.game_progress;

-- Enable RLS
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own game progress
CREATE POLICY "game_auth_select_own" ON public.game_progress
  FOR SELECT
  USING (auth.uid() = uid OR true);

-- Policy 2: Users can insert their own game progress
CREATE POLICY "game_auth_insert_own" ON public.game_progress
  FOR INSERT
  WITH CHECK (auth.uid() = uid OR true);

-- Policy 3: Users can update their own game progress
CREATE POLICY "game_auth_update_own" ON public.game_progress
  FOR UPDATE
  USING (auth.uid() = uid OR true)
  WITH CHECK (auth.uid() = uid OR true);

-- Policy 4: Everyone can read all game progress (for leaderboard)
CREATE POLICY "game_public_read_all" ON public.game_progress
  FOR SELECT
  USING (true);

-- Policy 5: Service role fallback
CREATE POLICY "game_service_all" ON public.game_progress
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ===========================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_level ON public.users(level);
CREATE INDEX IF NOT EXISTS idx_users_points_desc ON public.users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_weekly_desc ON public.users(weeklyPoints DESC);
CREATE INDEX IF NOT EXISTS idx_users_monthly_desc ON public.users(monthlyPoints DESC);

-- Quiz progress indexes
CREATE INDEX IF NOT EXISTS idx_quiz_uid ON public.quiz_progress(uid);
CREATE INDEX IF NOT EXISTS idx_quiz_category ON public.quiz_progress(category);
CREATE INDEX IF NOT EXISTS idx_quiz_completed ON public.quiz_progress(completed_at DESC);

-- Game progress indexes
CREATE INDEX IF NOT EXISTS idx_game_uid ON public.game_progress(uid);
CREATE INDEX IF NOT EXISTS idx_game_id ON public.game_progress(gameId);
CREATE INDEX IF NOT EXISTS idx_game_played ON public.game_progress(playedAt DESC);

-- ===========================================
-- 5. CREATE LEADERBOARD VIEWS
-- ===========================================

-- Weekly leaderboard (reset every Sunday)
DROP VIEW IF EXISTS public.leaderboard_weekly;
CREATE VIEW public.leaderboard_weekly AS
SELECT 
  uid,
  email,
  name,
  age,
  weeklyPoints as points,
  level,
  ROW_NUMBER() OVER (ORDER BY weeklyPoints DESC) as rank
FROM public.users
WHERE weeklyPoints > 0
ORDER BY weeklyPoints DESC;

-- Monthly leaderboard
DROP VIEW IF EXISTS public.leaderboard_monthly;
CREATE VIEW public.leaderboard_monthly AS
SELECT 
  uid,
  email,
  name,
  age,
  monthlyPoints as points,
  level,
  ROW_NUMBER() OVER (ORDER BY monthlyPoints DESC) as rank
FROM public.users
WHERE monthlyPoints > 0
ORDER BY monthlyPoints DESC;

-- All-time leaderboard
DROP VIEW IF EXISTS public.leaderboard_all_time;
CREATE VIEW public.leaderboard_all_time AS
SELECT 
  uid,
  email,
  name,
  age,
  points,
  level,
  ROW_NUMBER() OVER (ORDER BY points DESC) as rank
FROM public.users
WHERE points > 0
ORDER BY points DESC;

-- ===========================================
-- SUMMARY OF ALL POLICIES
-- ===========================================

-- USERS TABLE:
-- 1. users_auth_select_own      - Authenticated + anyone can read profiles
-- 2. users_auth_insert_own      - Authenticated + anyone can insert profiles
-- 3. users_auth_update_own      - Authenticated + anyone can update profiles
-- 4. users_public_select_all    - Public read (leaderboard)
-- 5. users_service_all          - Fallback for service role

-- QUIZ_PROGRESS TABLE:
-- 1. quiz_auth_select_own       - Authenticated + anyone can read quiz progress
-- 2. quiz_auth_insert_own       - Authenticated + anyone can insert quiz progress
-- 3. quiz_auth_update_own       - Authenticated + anyone can update quiz progress
-- 4. quiz_public_read_all       - Public read (leaderboard)
-- 5. quiz_service_all           - Fallback for service role

-- GAME_PROGRESS TABLE:
-- 1. game_auth_select_own       - Authenticated + anyone can read game progress
-- 2. game_auth_insert_own       - Authenticated + anyone can insert game progress
-- 3. game_auth_update_own       - Authenticated + anyone can update game progress
-- 4. game_public_read_all       - Public read (leaderboard)
-- 5. game_service_all           - Fallback for service role

-- ===========================================
-- NEXT STEPS:
-- ===========================================
-- 1. Run this entire SQL script in Supabase SQL Editor
-- 2. Hard refresh browser: Ctrl+Shift+R
-- 3. Clear cache: Ctrl+Shift+Delete
-- 4. Test: Go to http://localhost:3000/debug
-- 5. Click "Read Profile" or "Ensure Profile" buttons
-- 6. Check console (F12) for results
-- ===========================================
