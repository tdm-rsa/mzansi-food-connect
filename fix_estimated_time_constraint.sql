-- Step 1: Drop any existing constraint on estimated_time
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_estimated_time_check;

-- Step 2: Add the column if it doesn't exist (safe to run multiple times)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS estimated_time INTEGER;

-- Step 3: Allow NULL values and any positive integer
-- No constraint needed - we'll handle validation in the app

-- Step 4: Verify the column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'estimated_time';

-- Expected result:
-- column_name      | data_type | is_nullable | column_default
-- -----------------|-----------|-------------|----------------
-- estimated_time   | integer   | YES         | NULL
