-- STEP 1: Find your pending order
-- Copy and paste this into Supabase SQL Editor
-- https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/editor

SELECT 
  order_number,
  customer_name,
  phone,
  total,
  payment_reference,
  created_at,
  store_id
FROM pending_orders
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- STEP 2: After finding your order, copy the order_number
-- Then uncomment the lines below and replace 'YOUR_ORDER_NUMBER' with the actual order number
-- Example: If order_number is 'A123', replace all instances of 'YOUR_ORDER_NUMBER' with 'A123'

/*
-- Move the order from pending_orders to orders table
INSERT INTO orders (
  store_id,
  customer_name,
  phone,
  items,
  total,
  payment_status,
  payment_reference,
  order_number,
  status,
  estimated_time,
  created_at
)
SELECT 
  store_id,
  customer_name,
  phone,
  items,
  total,
  'paid' as payment_status,
  payment_reference,
  order_number,
  'pending' as status,
  0 as estimated_time,
  created_at
FROM pending_orders
WHERE order_number = 'YOUR_ORDER_NUMBER'
AND NOT EXISTS (
  SELECT 1 FROM orders WHERE order_number = 'YOUR_ORDER_NUMBER'
)
RETURNING *;

-- Mark the pending order as completed
UPDATE pending_orders
SET status = 'completed'
WHERE order_number = 'YOUR_ORDER_NUMBER';

-- Verify the order is now in the orders table
SELECT 
  order_number,
  customer_name,
  phone,
  total,
  payment_status,
  status,
  created_at
FROM orders
WHERE order_number = 'YOUR_ORDER_NUMBER';
*/
