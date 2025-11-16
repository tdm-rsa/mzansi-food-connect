-- Fix Premium Account Plan
-- Run this in Supabase SQL Editor to manually set your account to Premium

-- First, let's see all stores and their plans
SELECT id, name, owner_id, plan, created_at
FROM stores
ORDER BY created_at DESC
LIMIT 10;

-- Update the most recent store to premium plan
-- (Replace 'YOUR_EMAIL_HERE' with your actual email if you want to be specific)
UPDATE stores
SET
  plan = 'premium',
  plan_started_at = NOW(),
  plan_expires_at = NULL
WHERE id = (
  SELECT id FROM stores
  ORDER BY created_at DESC
  LIMIT 1
);

-- Verify the update
SELECT id, name, plan, plan_started_at, plan_expires_at
FROM stores
ORDER BY created_at DESC
LIMIT 5;

-- Success message
SELECT 'Premium plan activated! ✅ Refresh your browser to see the Premium dashboard.' AS status;
