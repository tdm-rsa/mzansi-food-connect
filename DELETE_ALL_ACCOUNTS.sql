-- ====================================================================
-- DELETE ALL USER ACCOUNTS - COMPLETE RESET
-- ====================================================================
-- This will delete EVERYTHING and give you a fresh start
-- Run this in Supabase SQL Editor
-- ====================================================================

-- Step 1: Delete all users (this cascades to stores and everything else)
DELETE FROM auth.users;

-- Step 2: Verify everything is gone
SELECT 'Users deleted' as status, COUNT(*) as remaining_users FROM auth.users;
SELECT 'Stores deleted' as status, COUNT(*) as remaining_stores FROM stores;
SELECT 'Menu items deleted' as status, COUNT(*) as remaining_items FROM menu_items;
SELECT 'Orders deleted' as status, COUNT(*) as remaining_orders FROM orders;
SELECT 'Notifications deleted' as status, COUNT(*) as remaining_notifications FROM notifications;

-- ====================================================================
-- RESULT: All accounts deleted, ready for fresh start
-- ====================================================================
-- Now you can create new accounts via the Signup page with different plans
