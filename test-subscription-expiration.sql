-- Test Subscription Expiration Scenarios
-- Use this script to manually test grace period and expiration flows

-- 1. Get your current store info first
SELECT id, name, slug, plan, plan_expires_at, plan_started_at
FROM tenants
ORDER BY created_at DESC
LIMIT 1;

-- Copy your store ID from above and use it in the commands below
-- Replace 'YOUR_STORE_ID' with your actual store ID

-- ========================================
-- SCENARIO 1: Test Grace Period (Day 1)
-- Plan expired 1 day ago
-- ========================================
UPDATE tenants
SET
  plan = 'pro',
  plan_expires_at = NOW() - INTERVAL '1 day',
  plan_started_at = NOW() - INTERVAL '31 days'
WHERE id = 'YOUR_STORE_ID';

-- You should see: Grace Period Banner showing "3 days left"


-- ========================================
-- SCENARIO 2: Test Grace Period (Day 2)
-- Plan expired 2 days ago
-- ========================================
UPDATE tenants
SET
  plan = 'pro',
  plan_expires_at = NOW() - INTERVAL '2 days',
  plan_started_at = NOW() - INTERVAL '32 days'
WHERE id = 'YOUR_STORE_ID';

-- You should see: Grace Period Banner showing "2 days left"


-- ========================================
-- SCENARIO 3: Test Grace Period (Final Day)
-- Plan expired 3 days ago (last day of grace)
-- ========================================
UPDATE tenants
SET
  plan = 'premium',
  plan_expires_at = NOW() - INTERVAL '3 days',
  plan_started_at = NOW() - INTERVAL '33 days'
WHERE id = 'YOUR_STORE_ID';

-- You should see: Grace Period Banner showing "1 day left" (urgent)


-- ========================================
-- SCENARIO 4: Test Complete Expiration
-- Plan expired 4 days ago (grace period over)
-- ========================================
UPDATE tenants
SET
  plan = 'pro',
  plan_expires_at = NOW() - INTERVAL '4 days',
  plan_started_at = NOW() - INTERVAL '34 days'
WHERE id = 'YOUR_STORE_ID';

-- You should see: Complete dashboard block / Plan Expired Modal


-- ========================================
-- SCENARIO 5: Test Expiring Soon (7 days left)
-- Plan expires in 7 days
-- ========================================
UPDATE tenants
SET
  plan = 'premium',
  plan_expires_at = NOW() + INTERVAL '7 days',
  plan_started_at = NOW() - INTERVAL '23 days'
WHERE id = 'YOUR_STORE_ID';

-- You should see: Warning notification about renewal in 7 days


-- ========================================
-- SCENARIO 6: Test Active Subscription
-- Plan expires in 20 days (healthy)
-- ========================================
UPDATE tenants
SET
  plan = 'pro',
  plan_expires_at = NOW() + INTERVAL '20 days',
  plan_started_at = NOW() - INTERVAL '10 days'
WHERE id = 'YOUR_STORE_ID';

-- You should see: Normal dashboard, no warnings


-- ========================================
-- RESET TO FRESH 30-DAY SUBSCRIPTION
-- Use this to reset after testing
-- ========================================
UPDATE tenants
SET
  plan = 'pro',
  plan_expires_at = NOW() + INTERVAL '30 days',
  plan_started_at = NOW()
WHERE id = 'YOUR_STORE_ID';

-- Dashboard should be completely normal


-- ========================================
-- Verify Changes
-- ========================================
SELECT
  id,
  name,
  plan,
  plan_started_at,
  plan_expires_at,
  -- Calculate days until expiration
  EXTRACT(DAY FROM (plan_expires_at - NOW())) as days_until_expiry,
  -- Check if in grace period
  CASE
    WHEN plan_expires_at < NOW() AND plan_expires_at > NOW() - INTERVAL '3 days' THEN 'GRACE PERIOD'
    WHEN plan_expires_at < NOW() - INTERVAL '3 days' THEN 'EXPIRED (BLOCKED)'
    WHEN plan_expires_at < NOW() + INTERVAL '7 days' THEN 'EXPIRING SOON'
    ELSE 'ACTIVE'
  END as status
FROM tenants
WHERE id = 'YOUR_STORE_ID';


-- ========================================
-- TESTING CHECKLIST
-- ========================================
/*
Test each scenario and verify:

✅ SCENARIO 1 (Grace Day 1):
   - [ ] Grace period banner appears at top of dashboard
   - [ ] Shows "3 days remaining"
   - [ ] Can still access dashboard
   - [ ] Renew button shows correct price (R2.50 or R3.00)

✅ SCENARIO 2 (Grace Day 2):
   - [ ] Grace period banner appears
   - [ ] Shows "2 days remaining"
   - [ ] Urgency increases (different color?)

✅ SCENARIO 3 (Grace Final Day):
   - [ ] Grace period banner appears
   - [ ] Shows "1 day remaining"
   - [ ] Maximum urgency warning

✅ SCENARIO 4 (Fully Expired):
   - [ ] Dashboard is blocked or shows expired modal
   - [ ] Cannot create orders
   - [ ] Cannot edit products
   - [ ] Renew button still available

✅ SCENARIO 5 (Expiring in 7 days):
   - [ ] Small reminder notification (not banner)
   - [ ] Dashboard fully functional
   - [ ] Reminder about upcoming renewal

✅ SCENARIO 6 (Active/Healthy):
   - [ ] No warnings
   - [ ] Full dashboard access
   - [ ] All features working

After testing, RESET to 30-day subscription!
*/
