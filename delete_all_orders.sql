-- Delete all orders from the orders table
-- Run this in Supabase SQL Editor

DELETE FROM orders;

-- Verify deletion
SELECT COUNT(*) as remaining_orders FROM orders;
