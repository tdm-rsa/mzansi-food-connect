-- =====================================================
-- CHECK RLS POLICIES ON STORES TABLE
-- This will show if Row Level Security is blocking the columns
-- =====================================================

-- Check if RLS is enabled on stores table
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'stores';

-- Check all RLS policies on stores table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'stores';

-- If RLS is blocking, you may need to update the SELECT policy
-- to explicitly allow these columns or disable column-level restrictions
