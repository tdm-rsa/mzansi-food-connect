-- SWITCH YOUR CURRENT ACCOUNT TO PREMIUM - RUN THIS NOW!

-- Update ALL stores to Premium (since you likely only have one account)
UPDATE stores
SET
  plan = 'premium',
  plan_expires_at = NULL,
  plan_started_at = NOW()
WHERE TRUE;

-- Verify the update worked
SELECT
  id,
  name,
  plan,
  plan = 'premium' as is_premium_check,
  plan_expires_at
FROM stores;

-- You should see:
-- plan: "premium"
-- is_premium_check: true
-- plan_expires_at: NULL
