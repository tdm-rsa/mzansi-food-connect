-- ========================================
-- FIX ALL FOREIGN KEY CONSTRAINTS TO USE TENANTS
-- Run this in Supabase SQL Editor
-- ========================================

-- Fix orders table foreign key
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_store_id_fkey;

ALTER TABLE public.orders
ADD CONSTRAINT orders_store_id_fkey
FOREIGN KEY (store_id)
REFERENCES public.tenants(id)
ON DELETE CASCADE;

-- Fix analytics table foreign key (if it exists)
ALTER TABLE public.analytics
DROP CONSTRAINT IF EXISTS analytics_store_id_fkey;

ALTER TABLE public.analytics
ADD CONSTRAINT analytics_store_id_fkey
FOREIGN KEY (store_id)
REFERENCES public.tenants(id)
ON DELETE CASCADE;

-- Fix notifications table foreign key (if it exists)
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_store_id_fkey;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_store_id_fkey
FOREIGN KEY (store_id)
REFERENCES public.tenants(id)
ON DELETE CASCADE;

SELECT '✅ All foreign keys updated to point to tenants table!' AS status;
