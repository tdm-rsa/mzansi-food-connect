-- Fix stores that were created as 'trial' but have pending premium/pro payments
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql

-- First, let's see all pending payments that haven't been processed
SELECT
  pp.id,
  pp.user_id,
  pp.email,
  pp.store_name,
  pp.plan AS payment_plan,
  pp.payment_reference,
  pp.created_at,
  s.id AS store_id,
  s.name AS store_name_in_db,
  s.plan AS current_store_plan
FROM pending_payments pp
LEFT JOIN stores s ON s.owner_id = pp.user_id
WHERE pp.processed_at IS NULL
ORDER BY pp.created_at DESC;

-- Now update stores to match their pending payment plans
UPDATE stores s
SET
  plan = pp.plan,
  plan_started_at = NOW(),
  plan_expires_at = NULL,
  payment_reference = pp.payment_reference
FROM pending_payments pp
WHERE s.owner_id = pp.user_id
  AND pp.processed_at IS NULL
  AND s.plan = 'trial'
  AND pp.plan IN ('pro', 'premium');

-- Mark these payments as processed
UPDATE pending_payments
SET processed_at = NOW()
WHERE processed_at IS NULL
  AND plan IN ('pro', 'premium');

-- Verify the updates
SELECT
  s.id,
  s.name,
  s.plan,
  s.payment_reference,
  s.plan_started_at
FROM stores s
WHERE s.owner_id IN (
  SELECT user_id FROM pending_payments WHERE plan IN ('pro', 'premium')
);

SELECT '✅ Stores updated to match their pending payments!' AS status;
