-- Manually convert pending order O988 to actual order
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql/new

-- First, check if order already exists
SELECT * FROM orders WHERE order_number = 'O988';

-- If no results, insert the order from pending_orders
INSERT INTO orders (
  store_id, customer_name, phone, items, total,
  payment_status, payment_reference, order_number, status, estimated_time, created_at
)
SELECT
  store_id, customer_name, phone, items, total,
  'paid',
  payment_reference,
  order_number,
  'pending',
  0,
  created_at
FROM pending_orders
WHERE order_number = 'O988'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'O988');

-- Mark pending order as completed
UPDATE pending_orders
SET status = 'completed'
WHERE order_number = 'O988';

-- Verify it worked
SELECT * FROM orders WHERE order_number = 'O988';
