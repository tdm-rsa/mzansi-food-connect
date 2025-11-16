-- Quick verification query - run this in Supabase SQL Editor
SELECT
  id,
  name,
  plan,
  plan_started_at,
  plan_expires_at,
  LENGTH(plan) as plan_length,
  plan = 'trial' as is_trial,
  plan = 'pro' as is_pro,
  plan = 'premium' as is_premium,
  created_at
FROM stores
ORDER BY created_at DESC;
