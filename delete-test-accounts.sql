-- SQL Script to Delete All Test Accounts
-- WARNING: This will permanently delete ALL tenant data
-- Run this in Supabase SQL Editor

-- SAFETY: Uncomment the BEGIN/COMMIT lines to make this a transaction (can rollback if needed)
-- BEGIN;

-- Step 1: Delete all notifications
DELETE FROM notifications;

-- Step 2: Delete all pending orders
DELETE FROM pending_orders;

-- Step 3: Delete all completed orders
DELETE FROM orders;

-- Step 4: Delete all menu items
DELETE FROM menu_items;

-- Step 5: Delete all tenants (stores)
DELETE FROM tenants;

-- SAFETY: If you want to test first, uncomment ROLLBACK instead of COMMIT
-- ROLLBACK;
-- COMMIT;

-- Verify deletion
SELECT 'tenants' as table_name, COUNT(*) as remaining_records FROM tenants
UNION ALL
SELECT 'menu_items', COUNT(*) FROM menu_items
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'pending_orders', COUNT(*) FROM pending_orders
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;
