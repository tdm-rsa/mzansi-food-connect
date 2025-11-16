-- Fix the status constraint to allow 'confirmed' status

-- Step 1: Check what the current constraint allows
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass AND conname = 'orders_status_check';

-- Step 2: Drop the old constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 3: Add new constraint with all required statuses
ALTER TABLE orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'ready', 'completed'));

-- Step 4: Also drop and fix estimated_time constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_estimated_time_check;

-- Step 5: Add estimated_time column if missing
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS estimated_time INTEGER;

-- Step 6: Verify both constraints
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass 
AND conname IN ('orders_status_check', 'orders_estimated_time_check');

-- Expected results:
-- conname                    | definition
-- ---------------------------|----------------------------------------------------------
-- orders_status_check        | CHECK (status IN ('pending', 'confirmed', 'ready', 'completed'))
-- (no estimated_time_check)  | (should not appear - we removed it)
