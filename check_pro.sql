-- Check exact plan values and look for issues
SELECT
  id,
  name,
  plan,
  LENGTH(plan) as plan_length,
  plan = 'pro' as exact_match_pro,
  plan LIKE '%pro%' as contains_pro,
  ASCII(SUBSTRING(plan FROM 1 FOR 1)) as first_char,
  plan::bytea as plan_bytes
FROM stores
WHERE plan LIKE '%pro%' OR plan = 'pro';
