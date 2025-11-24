-- Fix Pro Account Login Issue
-- Run this if you can't log in with your new Pro account

-- 1. First, let's find your account by email
-- Replace 'your-email@example.com' with the email you used to sign up
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'plan' as plan,
  raw_user_meta_data->>'store_name' as store_name
FROM auth.users
WHERE email = 'your-email@example.com'; -- REPLACE WITH YOUR EMAIL

-- 2. If email_confirmed_at is NULL, manually confirm the email
-- Replace 'USER_ID_FROM_ABOVE' with the actual ID from step 1
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
  AND email_confirmed_at IS NULL;

-- 3. Verify the account is now confirmed
SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'plan' as plan
FROM auth.users
WHERE email = 'your-email@example.com'; -- REPLACE WITH YOUR EMAIL

-- 4. Check if tenant record exists
SELECT
  id,
  store_name,
  email,
  plan,
  expires_at,
  created_at
FROM tenants
WHERE email = 'your-email@example.com'; -- REPLACE WITH YOUR EMAIL
