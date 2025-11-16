-- ====================================================================
-- COMPLETE DEBUG - Find out exactly what's happening
-- ====================================================================

-- 1. Show ALL users
SELECT
  id as user_id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Show ALL stores with their plans
SELECT
  s.id as store_id,
  s.name as store_name,
  s.owner_id,
  u.email as owner_email,
  s.plan,
  s.plan_started_at,
  s.plan_expires_at,
  s.created_at
FROM stores s
LEFT JOIN auth.users u ON u.id = s.owner_id
ORDER BY s.created_at DESC;

-- 3. Check if there are multiple stores per user
SELECT
  owner_id,
  COUNT(*) as store_count,
  STRING_AGG(plan, ', ') as plans
FROM stores
GROUP BY owner_id
HAVING COUNT(*) > 1;

-- 4. Force update ALL stores to premium
UPDATE stores
SET
  plan = 'premium',
  plan_expires_at = NULL,
  plan_started_at = NOW();

-- 5. Verify the update
SELECT
  s.id,
  s.name,
  u.email,
  s.plan,
  LENGTH(s.plan) as plan_length,
  s.plan = 'premium' as is_premium
FROM stores s
LEFT JOIN auth.users u ON u.id = s.owner_id;

-- 6. If you see plan is STILL not premium, there might be a trigger or something resetting it
-- Check for any triggers on the stores table:
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'stores';
