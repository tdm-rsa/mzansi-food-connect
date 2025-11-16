-- ====================================================================
-- QUICK FIX - Set different plans for your existing accounts
-- ====================================================================

-- First, see what accounts you have
SELECT
  s.id,
  s.name,
  u.email,
  s.plan,
  s.created_at
FROM stores s
JOIN auth.users u ON u.id = s.owner_id
ORDER BY s.created_at;

-- Now update them to different plans:

-- Make the FIRST account TRIAL
UPDATE stores
SET plan = 'trial', plan_expires_at = NOW() + INTERVAL '7 days'
WHERE id = (SELECT id FROM stores ORDER BY created_at LIMIT 1 OFFSET 0);

-- Make the SECOND account PRO
UPDATE stores
SET plan = 'pro', plan_expires_at = NULL
WHERE id = (SELECT id FROM stores ORDER BY created_at LIMIT 1 OFFSET 1);

-- Make the THIRD account PREMIUM
UPDATE stores
SET plan = 'premium', plan_expires_at = NULL
WHERE id = (SELECT id FROM stores ORDER BY created_at LIMIT 1 OFFSET 2);

-- Verify the changes
SELECT
  s.name,
  u.email,
  s.plan,
  LOWER(TRIM(s.plan)) as normalized_plan
FROM stores s
JOIN auth.users u ON u.id = s.owner_id
ORDER BY s.created_at;
