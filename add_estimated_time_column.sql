-- Add estimated_time column to orders table
-- This column stores the estimated time in minutes for order preparation

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS estimated_time INTEGER;

-- Add a comment to document the column
COMMENT ON COLUMN orders.estimated_time IS 'Estimated preparation time in minutes';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'estimated_time';
