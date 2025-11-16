-- ================================================
-- ADD PLAN COLUMNS TO EXISTING STORES TABLE
-- Run this in Supabase SQL Editor
-- Use this if you want to keep your existing data
-- ================================================

-- Add plan management columns
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS domain_status TEXT DEFAULT 'none';

-- Add index for plan column (for performance)
CREATE INDEX IF NOT EXISTS idx_stores_plan ON stores(plan);

-- Update existing stores to have default trial plan
UPDATE stores
SET plan = 'trial'
WHERE plan IS NULL;

-- Set plan_started_at for existing stores
UPDATE stores
SET plan_started_at = NOW()
WHERE plan_started_at IS NULL;

-- Set trial expiration for existing trial users (7 days from now)
UPDATE stores
SET plan_expires_at = NOW() + INTERVAL '7 days'
WHERE (plan = 'trial' OR plan IS NULL) AND plan_expires_at IS NULL;

-- Verify the migration
SELECT '✅ Plan columns added successfully!' as status;

-- Show first 10 stores with new columns
SELECT
  id,
  name,
  plan,
  plan_started_at,
  plan_expires_at,
  custom_domain,
  domain_status
FROM stores
LIMIT 10;

-- Show count by plan type
SELECT
  plan,
  COUNT(*) as count
FROM stores
GROUP BY plan;
