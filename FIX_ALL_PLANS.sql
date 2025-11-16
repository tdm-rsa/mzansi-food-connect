-- Fix all test accounts to correct plans
-- Run this in Supabase SQL Editor

-- First, let's see all stores
SELECT id, name, owner_id, plan, created_at, payment_reference
FROM stores
ORDER BY created_at DESC;

-- Update the most recent store to 'pro' (your latest signup)
UPDATE stores
SET plan = 'pro', plan_started_at = NOW(), plan_expires_at = NULL
WHERE id = '974f5f65-dbbe-4264-897e-35bbbc52e1dd';

-- Verify the update
SELECT id, name, plan, created_at FROM stores ORDER BY created_at DESC LIMIT 5;

SELECT '✅ Store updated to Pro plan! Refresh your browser.' AS status;
