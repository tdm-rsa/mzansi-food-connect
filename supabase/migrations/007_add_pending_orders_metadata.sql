-- Add metadata column to pending_orders table
-- This will store delivery information for Platinum orders

ALTER TABLE pending_orders
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_orders_metadata ON pending_orders USING gin(metadata);
