-- Set your current store to PRO plan for testing
-- Run this in Supabase SQL Editor

-- First, let's see what stores exist
SELECT id, name, owner_id, plan, plan_started_at FROM stores;

-- Update ALL stores to PRO plan (change this to specific owner_id if you have multiple stores)
UPDATE stores
SET
  plan = 'pro',
  plan_started_at = NOW(),
  plan_expires_at = NULL
WHERE plan = 'trial' OR plan IS NULL;

-- Verify the update
SELECT id, name, plan, plan_started_at, plan_expires_at FROM stores;

-- You should see plan = 'pro' now
