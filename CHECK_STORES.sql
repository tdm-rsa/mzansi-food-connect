-- Check what's actually in the stores table
SELECT
  id,
  name,
  owner_id,
  plan,
  plan_started_at,
  plan_expires_at,
  created_at
FROM stores
ORDER BY created_at DESC;

-- Check the data type of plan column
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stores' AND column_name = 'plan';
