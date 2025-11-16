-- ========================================
-- FIX ORDERS RLS POLICIES
-- Run this in Supabase SQL Editor
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can view orders" ON public.orders;

-- Policy: Store owners can view orders for their tenant
CREATE POLICY "Store owners can view orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = orders.store_id
    AND tenants.owner_id = auth.uid()
  )
);

-- Policy: Store owners can update orders for their tenant
CREATE POLICY "Store owners can update orders"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = orders.store_id
    AND tenants.owner_id = auth.uid()
  )
);

-- Policy: Allow anyone (customers) to insert orders
CREATE POLICY "Public can insert orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Policy: Allow anyone to view their own orders (optional - for customer order tracking)
CREATE POLICY "Anyone can view orders"
ON public.orders
FOR SELECT
USING (true);

SELECT '✅ Orders RLS policies fixed!' AS status;
