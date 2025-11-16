-- Set your current store to PREMIUM plan for testing
-- Run this in Supabase SQL Editor

-- First, let's see what stores exist
SELECT id, name, owner_id, plan, plan_started_at FROM stores;

-- Update ALL stores to PREMIUM plan (change this to specific owner_id if you have multiple stores)
UPDATE stores
SET
  plan = 'premium',
  plan_started_at = NOW(),
  plan_expires_at = NULL
WHERE TRUE;

-- Verify the update
SELECT id, name, plan, plan_started_at, plan_expires_at FROM stores;

-- You should see plan = 'premium' now
