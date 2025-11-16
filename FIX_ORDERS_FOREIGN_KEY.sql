-- ========================================
-- FIX ORDERS FOREIGN KEY CONSTRAINT
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

-- Fix notifications table foreign key (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notifications' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.notifications
        DROP CONSTRAINT IF EXISTS notifications_store_id_fkey;
        
        ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_store_id_fkey
        FOREIGN KEY (store_id)
        REFERENCES public.tenants(id)
        ON DELETE CASCADE;
    END IF;
END $$;

SELECT '✅ Orders and notifications foreign keys updated!' AS status;
