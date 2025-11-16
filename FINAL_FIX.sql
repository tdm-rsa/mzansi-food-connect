-- ✅ FINAL FIX - Run this to fix BOTH errors at once

-- Fix 1: Allow 'confirmed' status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'ready', 'completed'));

-- Fix 2: Remove estimated_time constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_estimated_time_check;

-- Fix 3: Add estimated_time column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_time INTEGER;

-- ✅ Done! Your errors should be fixed now.
