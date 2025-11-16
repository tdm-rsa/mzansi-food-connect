-- =====================================================
-- TEST: Create accounts with different plans
-- Run this AFTER running MASTER_DATABASE.sql
-- =====================================================

-- First, verify stores table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'stores' AND column_name IN ('plan', 'plan_started_at', 'plan_expires_at')
ORDER BY column_name;

-- Check current stores (should be empty after MASTER_DATABASE.sql)
SELECT id, name, plan, plan_started_at, plan_expires_at FROM stores;

-- If you see stores with 'trial' plan, you can update them:
-- Update existing stores to PRO
UPDATE stores SET plan = 'pro', plan_expires_at = NULL WHERE plan = 'trial';

-- Verify the update
SELECT id, name, plan, plan_started_at, plan_expires_at FROM stores;

-- Check exact plan values (to see if there are any hidden characters)
SELECT
  id,
  name,
  plan,
  LENGTH(plan) as plan_length,
  ASCII(SUBSTRING(plan FROM 1 FOR 1)) as first_char_ascii,
  plan = 'trial' as is_trial,
  plan = 'pro' as is_pro,
  plan = 'premium' as is_premium
FROM stores;
