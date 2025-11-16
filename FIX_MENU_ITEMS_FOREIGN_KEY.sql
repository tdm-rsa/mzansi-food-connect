-- ========================================
-- FIX MENU_ITEMS FOREIGN KEY CONSTRAINT
-- Run this in Supabase SQL Editor
-- ========================================

-- Drop the old foreign key constraint that points to "stores"
ALTER TABLE public.menu_items
DROP CONSTRAINT IF EXISTS menu_items_store_id_fkey;

-- Add new foreign key constraint that points to "tenants"
ALTER TABLE public.menu_items
ADD CONSTRAINT menu_items_store_id_fkey
FOREIGN KEY (store_id)
REFERENCES public.tenants(id)
ON DELETE CASCADE;

SELECT '✅ Menu items foreign key updated to point to tenants table!' AS status;
