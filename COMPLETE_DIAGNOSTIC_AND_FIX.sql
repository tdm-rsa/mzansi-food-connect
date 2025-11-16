-- =====================================================
-- COMPLETE DIAGNOSTIC AND FIX FOR INSTRUCTIONS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Check if columns exist
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('show_instructions', 'instructions', 'show_notes', 'notes')
ORDER BY column_name;

-- If the above returns 0 rows, columns don't exist. Let's add them:

-- Step 2: Add columns
ALTER TABLE stores ADD COLUMN IF NOT EXISTS show_instructions BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS show_notes BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 3: Verify columns were added
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('show_instructions', 'instructions', 'show_notes', 'notes')
ORDER BY column_name;

-- Step 4: Check RLS policies (this might be blocking the columns)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'stores';

-- Step 5: Update your KFC store with test data
UPDATE stores
SET
  show_instructions = true,
  instructions = '1. Ask for availability before placing order
2. Pay with card
3. Use the Order Id sent on WhatsApp at the till to fetch your order',
  show_notes = true,
  notes = '🔥 Black Friday Sale starts next week!
⏰ Closing at 8pm tonight'
WHERE name = 'KFC';

-- Step 6: Verify the update
SELECT
  id,
  name,
  show_instructions,
  LEFT(instructions, 50) as instructions_preview,
  show_notes,
  LEFT(notes, 50) as notes_preview
FROM stores
WHERE name = 'KFC';

-- Step 7: Check ALL columns being returned for KFC
SELECT *
FROM stores
WHERE name = 'KFC';

-- If you see the columns in Step 7 but they're still not appearing in JavaScript,
-- the issue is likely with Supabase client caching or RLS policies
