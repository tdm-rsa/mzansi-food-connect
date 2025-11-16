-- ========================================
-- FIX MENU_ITEMS RLS POLICIES
-- Run this in Supabase SQL Editor
-- ========================================

-- Drop existing policies that are blocking inserts
DROP POLICY IF EXISTS "Users can view own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can insert own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can update own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can delete own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;

-- Policy: Users can insert menu items for their own tenant
CREATE POLICY "Users can insert own menu items"
ON public.menu_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = menu_items.store_id
    AND tenants.owner_id = auth.uid()
  )
);

-- Policy: Users can view menu items for their own tenant
CREATE POLICY "Users can view own menu items"
ON public.menu_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = menu_items.store_id
    AND tenants.owner_id = auth.uid()
  )
);

-- Policy: Users can update menu items for their own tenant
CREATE POLICY "Users can update own menu items"
ON public.menu_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = menu_items.store_id
    AND tenants.owner_id = auth.uid()
  )
);

-- Policy: Users can delete menu items for their own tenant
CREATE POLICY "Users can delete own menu items"
ON public.menu_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = menu_items.store_id
    AND tenants.owner_id = auth.uid()
  )
);

-- Policy: Allow public to view menu items (for customer stores)
CREATE POLICY "Public can view menu items"
ON public.menu_items
FOR SELECT
USING (true);

SELECT '✅ Menu items RLS policies fixed!' AS status;
