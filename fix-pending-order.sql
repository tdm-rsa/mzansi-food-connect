-- Fix pending order that was paid but webhook didn't fire
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/editor

-- First, check what pending orders exist
SELECT 
  id,
  order_number,
  customer_name,
  phone,
  total,
  payment_reference,
  status,
  created_at
FROM pending_orders
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;

-- After you identify the correct order_number, uncomment and run this:
-- Replace 'A123' with your actual order number

/*
-- Move pending order to orders table
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
  estimated_time
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
  0 as estimated_time
FROM pending_orders
WHERE order_number = 'A123'  -- Replace with your order number
AND NOT EXISTS (
  SELECT 1 FROM orders WHERE order_number = 'A123'  -- Prevent duplicates
);

-- Mark pending order as completed
UPDATE pending_orders
SET status = 'completed'
WHERE order_number = 'A123';  -- Replace with your order number

-- Verify the order was created
SELECT 
  order_number,
  customer_name,
  total,
  payment_status,
  status,
  created_at
FROM orders
WHERE order_number = 'A123'  -- Replace with your order number
ORDER BY created_at DESC;
*/
