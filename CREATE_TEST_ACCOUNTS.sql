-- CREATE THREE TEST ACCOUNTS DIRECTLY IN DATABASE
-- Run this in Supabase SQL Editor

-- IMPORTANT: First create the auth users in Supabase Auth UI:
-- 1. Go to Authentication > Users > Add User
-- 2. Create these three users:
--    - trial@test.com (password: test123)
--    - pro@test.com (password: test123)
--    - premium@test.com (password: test123)

-- After creating the auth users, run this SQL:

-- Get the user IDs (you'll need to replace these with actual IDs from auth.users)
-- First, find the user IDs:
SELECT id, email FROM auth.users WHERE email LIKE '%test.com' ORDER BY email;

-- THEN, manually insert stores with the correct owner_ids:
-- Replace YOUR_TRIAL_USER_ID, YOUR_PRO_USER_ID, YOUR_PREMIUM_USER_ID with actual UUIDs from above query

-- TRIAL STORE
INSERT INTO stores (
  owner_id,
  name,
  plan,
  plan_started_at,
  plan_expires_at,
  is_open,
  banner_text,
  about_text,
  active_template
) VALUES (
  'YOUR_TRIAL_USER_ID',  -- Replace with actual UUID from auth.users
  'Test Trial Store',
  'trial',
  NOW(),
  NOW() + INTERVAL '7 days',
  true,
  'Welcome to Test Trial Store!',
  'Testing the trial plan features',
  'Modern Food'
);

-- PRO STORE
INSERT INTO stores (
  owner_id,
  name,
  plan,
  plan_started_at,
  plan_expires_at,
  is_open,
  banner_text,
  about_text,
  active_template
) VALUES (
  'YOUR_PRO_USER_ID',  -- Replace with actual UUID from auth.users
  'Test Pro Store',
  'pro',
  NOW(),
  NULL,
  true,
  'Welcome to Test Pro Store!',
  'Testing the pro plan features',
  'Modern Food'
);

-- PREMIUM STORE
INSERT INTO stores (
  owner_id,
  name,
  plan,
  plan_started_at,
  plan_expires_at,
  is_open,
  banner_text,
  about_text,
  active_template
) VALUES (
  'YOUR_PREMIUM_USER_ID',  -- Replace with actual UUID from auth.users
  'Test Premium Store',
  'premium',
  NOW(),
  NULL,
  true,
  'Welcome to Test Premium Store!',
  'Testing the premium plan features',
  'Modern Food'
);

-- Verify all three stores were created:
SELECT
  s.id,
  s.name,
  s.plan,
  u.email,
  s.plan_expires_at
FROM stores s
JOIN auth.users u ON u.id = s.owner_id
WHERE u.email LIKE '%test.com'
ORDER BY s.plan;
