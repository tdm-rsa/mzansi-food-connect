-- Migration: Set expiration dates for existing Pro/Premium stores
-- Gives all current paying customers 30 days from today

-- Update all Pro/Premium stores that don't have expiration dates
UPDATE tenants
SET
  plan_expires_at = NOW() + INTERVAL '30 days',
  plan_started_at = COALESCE(plan_started_at, NOW())
WHERE
  plan IN ('pro', 'premium')
  AND plan_expires_at IS NULL;

-- Show affected stores
SELECT
  id,
  name,
  plan,
  plan_started_at,
  plan_expires_at,
  owner_id
FROM tenants
WHERE plan IN ('pro', 'premium')
ORDER BY plan_expires_at ASC;

COMMENT ON COLUMN tenants.plan_expires_at IS 'Date when the current plan expires. Pro/Premium plans must renew monthly.';
