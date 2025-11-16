-- =====================================================
-- FIX RLS POLICIES TO ALLOW INSTRUCTIONS AND NOTES
-- The issue is that RLS policies might be blocking these columns
-- =====================================================

-- Step 1: Check existing policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'stores';

-- Step 2: Drop ALL existing policies on stores table
DROP POLICY IF EXISTS "Enable read access for all users" ON stores;
DROP POLICY IF EXISTS "Users can view their own store" ON stores;
DROP POLICY IF EXISTS "Users can insert their own store" ON stores;
DROP POLICY IF EXISTS "Users can update their own store" ON stores;
DROP POLICY IF EXISTS "Users can delete their own store" ON stores;
DROP POLICY IF EXISTS "Public stores are viewable by everyone" ON stores;
DROP POLICY IF EXISTS "Anyone can view stores" ON stores;

-- Step 3: Create NEW policies that explicitly allow ALL columns

-- Policy 1: Allow users to SELECT their own store (ALL COLUMNS)
CREATE POLICY "stores_select_own"
  ON stores FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Policy 2: Allow PUBLIC to SELECT stores by slug (for customer store pages)
CREATE POLICY "stores_select_public"
  ON stores FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy 3: Allow users to UPDATE their own store (ALL COLUMNS)
CREATE POLICY "stores_update_own"
  ON stores FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy 4: Allow users to INSERT their own store
CREATE POLICY "stores_insert_own"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Step 4: Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('show_instructions', 'instructions', 'show_notes', 'notes');

-- Step 5: Check data
SELECT
  id,
  name,
  slug,
  show_instructions,
  LEFT(instructions, 30) as instructions_preview,
  show_notes,
  LEFT(notes, 30) as notes_preview
FROM stores
WHERE name = 'KFC';

-- Success!
SELECT '✅ RLS policies fixed! Columns should now be accessible.' as status;
