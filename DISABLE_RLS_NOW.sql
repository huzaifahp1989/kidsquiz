-- ============================================
-- DISABLE RLS ON USERS TABLE (QUICK FIX)
-- ============================================
-- Run this in Supabase SQL Editor NOW

-- Disable RLS completely on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT * FROM pg_tables WHERE tablename = 'users';
