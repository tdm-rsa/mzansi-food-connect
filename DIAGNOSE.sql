-- DIAGNOSTIC SQL - Run this to see what's wrong
-- Copy and paste into Supabase SQL Editor

-- 1. Check if stores table exists and what columns it has
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'stores'
ORDER BY ordinal_position;

-- 2. Check current stores and their plan values
SELECT id, name, owner_id, plan, plan_started_at, plan_expires_at
FROM stores;

-- 3. Check if plan column exists specifically
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'stores' AND column_name = 'plan'
) as plan_column_exists;

-- 4. Show all tables in your database
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
