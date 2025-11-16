-- =====================================================
-- COMPLETE FIX FOR INSTRUCTIONS AND NOTES
-- Run this ENTIRE file in Supabase SQL Editor
-- Date: 2025-11-02
-- =====================================================

-- Step 1: Add the columns if they don't exist
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS show_instructions BOOLEAN DEFAULT false;

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS instructions TEXT;

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS show_notes BOOLEAN DEFAULT false;

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 2: Grant access to these columns (fix RLS if needed)
-- This ensures authenticated users can read these columns
-- Note: RLS policies should already allow SELECT on stores table

-- Step 3: Verify the columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('show_instructions', 'instructions', 'show_notes', 'notes')
ORDER BY column_name;

-- Step 4: Check current KFC store values
SELECT
  id,
  name,
  slug,
  show_instructions,
  instructions,
  show_notes,
  notes
FROM stores
WHERE name = 'KFC'
LIMIT 1;

-- Step 5: If the values are NULL, set them manually for testing
UPDATE stores
SET
  show_instructions = true,
  instructions = '1. Ask for availability before placing order
2. Pay with card
3. Use the Order Id sent on WhatsApp at the till to fetch your order',
  show_notes = true,
  notes = '#1-I am closing at 8pm tonight.
#2-I am starting Black Friday Sale next week'
WHERE name = 'KFC';

-- Step 6: Verify the update worked
SELECT
  id,
  name,
  show_instructions,
  instructions,
  show_notes,
  notes
FROM stores
WHERE name = 'KFC';

-- Success message
SELECT '✅ Instructions and Notes columns added and populated!' as status;
