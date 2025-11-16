-- Test what plan values are actually in the database
SELECT
  s.id,
  s.name,
  u.email,
  s.plan as original_plan,
  TRIM(s.plan) as trimmed_plan,
  LOWER(TRIM(s.plan)) as normalized_plan,
  LENGTH(s.plan) as plan_length,
  s.plan = 'trial' as is_trial,
  s.plan = 'pro' as is_pro,
  s.plan = 'premium' as is_premium
FROM stores s
JOIN auth.users u ON u.id = s.owner_id
ORDER BY s.created_at DESC;
