-- =====================================================
-- COMPREHENSIVE RLS POLICY VERIFICATION
-- Checks all critical tables for proper tenant isolation
-- =====================================================

-- 1. CHECK RLS STATUS ON ALL CRITICAL TABLES
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('tenants', 'orders', 'menu_items', 'notifications', 'pending_payments', 'pending_orders')
ORDER BY tablename;

-- 2. CHECK ALL RLS POLICIES ON TENANTS TABLE
SELECT
  '=== TENANTS TABLE ===' as section,
  policyname,
  cmd as operation,
  CASE
    WHEN roles::text = '{public}' THEN 'PUBLIC'
    ELSE roles::text
  END as roles,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'tenants'
ORDER BY cmd, policyname;

-- 3. CHECK ALL RLS POLICIES ON ORDERS TABLE
SELECT
  '=== ORDERS TABLE ===' as section,
  policyname,
  cmd as operation,
  CASE
    WHEN roles::text = '{public}' THEN 'PUBLIC'
    ELSE roles::text
  END as roles,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY cmd, policyname;

-- 4. CHECK ALL RLS POLICIES ON MENU_ITEMS TABLE
SELECT
  '=== MENU_ITEMS TABLE ===' as section,
  policyname,
  cmd as operation,
  CASE
    WHEN roles::text = '{public}' THEN 'PUBLIC'
    ELSE roles::text
  END as roles,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'menu_items'
ORDER BY cmd, policyname;

-- 5. CHECK ALL RLS POLICIES ON NOTIFICATIONS TABLE
SELECT
  '=== NOTIFICATIONS TABLE ===' as section,
  policyname,
  cmd as operation,
  CASE
    WHEN roles::text = '{public}' THEN 'PUBLIC'
    ELSE roles::text
  END as roles,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- 6. CHECK ALL RLS POLICIES ON PENDING_PAYMENTS TABLE
SELECT
  '=== PENDING_PAYMENTS TABLE ===' as section,
  policyname,
  cmd as operation,
  CASE
    WHEN roles::text = '{public}' THEN 'PUBLIC'
    ELSE roles::text
  END as roles,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'pending_payments'
ORDER BY cmd, policyname;

-- 7. CHECK ALL RLS POLICIES ON PENDING_ORDERS TABLE
SELECT
  '=== PENDING_ORDERS TABLE ===' as section,
  policyname,
  cmd as operation,
  CASE
    WHEN roles::text = '{public}' THEN 'PUBLIC'
    ELSE roles::text
  END as roles,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'pending_orders'
ORDER BY cmd, policyname;

-- 8. IDENTIFY POTENTIAL SECURITY ISSUES
SELECT
  '=== SECURITY ISSUES ===' as section,
  'Tables without RLS enabled' as issue_type,
  tablename
FROM pg_tables
WHERE tablename IN ('tenants', 'orders', 'menu_items', 'notifications', 'pending_payments', 'pending_orders')
  AND rowsecurity = false

UNION ALL

SELECT
  '=== SECURITY ISSUES ===' as section,
  'Tables with overly permissive policies' as issue_type,
  tablename
FROM pg_policies
WHERE tablename IN ('tenants', 'orders', 'menu_items', 'notifications', 'pending_payments', 'pending_orders')
  AND (
    qual::text ILIKE '%true%'
    OR with_check::text ILIKE '%true%'
  )
  AND policyname NOT LIKE '%service_role%'
  AND policyname NOT LIKE '%anon%'
  AND policyname NOT LIKE '%public_read%';

-- 9. CHECK FOR MISSING STORE_ID FOREIGN KEYS
SELECT
  '=== MISSING FOREIGN KEYS ===' as section,
  c.table_name,
  c.column_name
FROM information_schema.columns c
LEFT JOIN information_schema.table_constraints tc
  ON tc.table_name = c.table_name
  AND tc.constraint_type = 'FOREIGN KEY'
LEFT JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
  AND kcu.column_name = c.column_name
WHERE c.table_name IN ('orders', 'menu_items', 'notifications', 'pending_payments', 'pending_orders')
  AND c.column_name = 'store_id'
  AND kcu.column_name IS NULL;
