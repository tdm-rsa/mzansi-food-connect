-- Fix stemfactory27@gmail.com Pro Account Login

-- 1. Check if account exists
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'plan' as plan,
  raw_user_meta_data->>'store_name' as store_name
FROM auth.users
WHERE email = 'stemfactory27@gmail.com';

-- 2. Confirm the email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'stemfactory27@gmail.com'
  AND email_confirmed_at IS NULL;

-- 3. Verify it's confirmed
SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'plan' as plan
FROM auth.users
WHERE email = 'stemfactory27@gmail.com';

-- 4. Check if tenant exists (correct column names)
SELECT
  id,
  name,
  owner_email,
  contact_email,
  plan,
  plan_expires_at,
  created_at
FROM tenants
WHERE owner_email = 'stemfactory27@gmail.com'
   OR contact_email = 'stemfactory27@gmail.com';
