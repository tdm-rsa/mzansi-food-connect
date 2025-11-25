-- =====================================================
-- FIX RLS POLICIES FOR PROPER TENANT ISOLATION
-- This ensures all tables properly isolate data between stores
-- =====================================================

-- =====================================================
-- 1. TENANTS TABLE RLS
-- =====================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can insert own tenants" ON tenants;

-- Public can view basic tenant info (for customer-facing stores)
CREATE POLICY "Public can view tenants"
  ON tenants
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can view their own tenants
CREATE POLICY "Users can view own tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Users can update only their own tenants
CREATE POLICY "Users can update own tenants"
  ON tenants
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users can insert their own tenants (signup)
CREATE POLICY "Users can insert own tenants"
  ON tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- 2. MENU_ITEMS TABLE RLS
-- =====================================================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_can_insert_own_menu_items" ON menu_items;
DROP POLICY IF EXISTS "users_can_select_own_menu_items" ON menu_items;
DROP POLICY IF EXISTS "users_can_update_own_menu_items" ON menu_items;
DROP POLICY IF EXISTS "users_can_delete_own_menu_items" ON menu_items;
DROP POLICY IF EXISTS "public_can_view_menu_items" ON menu_items;

-- Store owners can manage their menu items
CREATE POLICY "Store owners can insert menu items"
  ON menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can view their menu items"
  ON menu_items
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update their menu items"
  ON menu_items
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can delete their menu items"
  ON menu_items
  FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Public (anonymous customers) can view all menu items
CREATE POLICY "Public can view menu items"
  ON menu_items
  FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- 3. ORDERS TABLE RLS
-- =====================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "store_owners_can_view_orders" ON orders;
DROP POLICY IF EXISTS "store_owners_can_update_orders" ON orders;
DROP POLICY IF EXISTS "store_owners_can_delete_orders" ON orders;
DROP POLICY IF EXISTS "anyone_can_create_orders" ON orders;
DROP POLICY IF EXISTS "authenticated_can_create_orders" ON orders;
DROP POLICY IF EXISTS "Store owners can view orders" ON orders;
DROP POLICY IF EXISTS "Store owners can update orders" ON orders;

-- Store owners can view only their orders
CREATE POLICY "Store owners can view orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Store owners can update only their orders
CREATE POLICY "Store owners can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Store owners can delete only their orders
CREATE POLICY "Store owners can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Anyone (customers) can create orders
CREATE POLICY "Anyone can create orders"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- =====================================================
-- 4. NOTIFICATIONS TABLE RLS
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "store_owners_can_view_notifications" ON notifications;
DROP POLICY IF EXISTS "store_owners_can_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "store_owners_can_delete_notifications" ON notifications;

-- Store owners can view only their notifications
CREATE POLICY "Store owners can view notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Store owners can create notifications
CREATE POLICY "Store owners can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Store owners can delete only their notifications
CREATE POLICY "Store owners can delete notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- 5. PENDING_PAYMENTS TABLE RLS
-- =====================================================
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_can_view_own_pending_payments" ON pending_payments;
DROP POLICY IF EXISTS "service_can_insert_pending_payments" ON pending_payments;
DROP POLICY IF EXISTS "service_can_update_pending_payments" ON pending_payments;

-- Users can view only their own pending payments
CREATE POLICY "Users can view own pending payments"
  ON pending_payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can insert pending payments (from edge functions)
CREATE POLICY "Service role can insert pending payments"
  ON pending_payments
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role can update pending payments (webhooks)
CREATE POLICY "Service role can update pending payments"
  ON pending_payments
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- =====================================================
-- 6. PENDING_ORDERS TABLE RLS
-- =====================================================
ALTER TABLE pending_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Service role can insert pending orders" ON pending_orders;
DROP POLICY IF EXISTS "Service role can update pending orders" ON pending_orders;
DROP POLICY IF EXISTS "Store owners can view their pending orders" ON pending_orders;

-- Service role ONLY can insert (no OR true)
CREATE POLICY "Service role can insert pending orders"
  ON pending_orders
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role ONLY can update (no OR true)
CREATE POLICY "Service role can update pending orders"
  ON pending_orders
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Store owners can view their pending orders
CREATE POLICY "Store owners can view pending orders"
  ON pending_orders
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the policies are correct:

-- Check RLS is enabled on all tables
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('tenants', 'orders', 'menu_items', 'notifications', 'pending_payments', 'pending_orders')
ORDER BY tablename;

-- Check for overly permissive policies (should return 0 rows except for anon public access)
SELECT
  tablename,
  policyname,
  cmd,
  qual::text
FROM pg_policies
WHERE tablename IN ('tenants', 'orders', 'menu_items', 'notifications', 'pending_payments', 'pending_orders')
  AND (qual::text ILIKE '%OR true%' OR with_check::text ILIKE '%OR true%')
ORDER BY tablename, policyname;
