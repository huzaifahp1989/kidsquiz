-- Test RPC to verify auth.uid() is working
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION test_uid()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  RETURN jsonb_build_object(
    'auth_uid', v_user_id,
    'is_authenticated', (v_user_id IS NOT NULL),
    'message', CASE 
      WHEN v_user_id IS NULL THEN '❌ No user authenticated - session lost'
      ELSE '✅ User authenticated successfully'
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION test_uid() TO authenticated;
GRANT EXECUTE ON FUNCTION test_uid() TO anon;

-- Test it:
-- SELECT test_uid();
