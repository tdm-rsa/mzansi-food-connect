-- Check recent payments and pending upgrades
-- Run this in Supabase SQL Editor to see what needs updating

-- Show current plan status
SELECT id, name, slug, plan, plan_started_at, plan_expires_at, payment_reference
FROM tenants
WHERE owner = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
LIMIT 1;
