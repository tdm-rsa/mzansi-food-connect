-- Migration: Add order_number column to orders table
-- Date: 2025-11-02
-- Purpose: Add simple order numbers like C056 instead of UUIDs

-- Add order_number column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'order_number';
