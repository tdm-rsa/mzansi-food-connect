-- Force Supabase to refresh the stores table schema
-- Run this in Supabase SQL Editor

-- Step 1: Check current columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('show_instructions', 'instructions', 'show_notes', 'notes');

-- Step 2: If they exist, let's make sure there's no RLS blocking them
-- Drop and recreate RLS policies to refresh
DROP POLICY IF EXISTS "Users can view their own store" ON stores;
DROP POLICY IF EXISTS "Users can update their own store" ON stores;

-- Recreate policies
CREATE POLICY "Users can view their own store"
  ON stores FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own store"
  ON stores FOR UPDATE
  USING (auth.uid() = owner_id);

-- Step 3: Make absolutely sure the columns exist
ALTER TABLE stores ADD COLUMN IF NOT EXISTS show_instructions BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS show_notes BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 4: Force a notification to refresh Supabase's cache
NOTIFY pgrst, 'reload schema';

-- Step 5: Verify data is there
SELECT
  id,
  name,
  slug,
  show_instructions,
  instructions,
  show_notes,
  notes
FROM stores
WHERE name = 'KFC';
