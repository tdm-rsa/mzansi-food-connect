-- =====================================================
-- RESTORE ORIGINAL WORKING RLS POLICIES
-- This will restore your stores table to working state
-- =====================================================

-- Step 1: Drop the policies we just created
DROP POLICY IF EXISTS "stores_select_own" ON stores;
DROP POLICY IF EXISTS "stores_select_public" ON stores;
DROP POLICY IF EXISTS "stores_update_own" ON stores;
DROP POLICY IF EXISTS "stores_insert_own" ON stores;

-- Step 2: Recreate the ORIGINAL working policies
-- (These are the standard policies that were working before)

CREATE POLICY "Enable read access for all users"
  ON stores FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own store"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own store"
  ON stores FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own store"
  ON stores FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Step 3: Verify stores are visible again
SELECT
  id,
  name,
  slug,
  banner_text,
  is_open
FROM stores
LIMIT 5;

-- Success
SELECT '✅ Original RLS policies restored!' as status;
