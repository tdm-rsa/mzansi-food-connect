-- Check what's happening with users and stores

-- 1. Show all auth users
SELECT
  id as user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Show all stores
SELECT
  id as store_id,
  owner_id,
  name,
  plan,
  created_at
FROM stores
ORDER BY created_at DESC;

-- 3. Check if there are orphaned stores (stores without matching users)
SELECT
  s.id as store_id,
  s.owner_id,
  s.name,
  s.plan,
  u.email,
  CASE WHEN u.id IS NULL THEN 'ORPHANED - NO USER!' ELSE 'OK' END as status
FROM stores s
LEFT JOIN auth.users u ON u.id = s.owner_id
ORDER BY s.created_at DESC;

-- 4. Check RLS policies on stores table
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'stores';
