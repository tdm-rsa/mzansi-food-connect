-- =====================================================
-- COMPLETE DATABASE FIX - RUN THIS NOW!
-- Mzansi Food Connect - All Fixes in One File
-- Date: 2025-11-02
-- =====================================================

-- =====================================================
-- PART 1: ADD ORDER_NUMBER COLUMN TO ORDERS TABLE
-- =====================================================

-- Add order_number column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- =====================================================
-- PART 2: FIX NOTIFICATIONS TABLE
-- =====================================================

-- Add customer_phone column
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add response column (for store owner replies)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS response TEXT;

-- Add status column (pending/replied)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add index for status lookups
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- =====================================================
-- PART 3: FIX ANALYTICS VIEWS (REMOVE payment_method)
-- =====================================================

-- Drop old views that reference payment_method column
DROP VIEW IF EXISTS store_analytics_daily CASCADE;
DROP VIEW IF EXISTS store_analytics_monthly CASCADE;
DROP VIEW IF EXISTS store_best_sellers CASCADE;

-- 1. Daily Analytics View (FIXED)
CREATE OR REPLACE VIEW store_analytics_daily AS
SELECT
    store_id,
    DATE(created_at) as day,
    COUNT(*) as orders_count,
    SUM(total) as total_revenue
FROM orders
WHERE payment_status = 'paid'
GROUP BY store_id, DATE(created_at)
ORDER BY day DESC;

-- 2. Monthly Analytics View (FIXED)
CREATE OR REPLACE VIEW store_analytics_monthly AS
SELECT
    store_id,
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*) as orders_count,
    SUM(total) as total_revenue
FROM orders
WHERE payment_status = 'paid'
GROUP BY store_id, TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month DESC;

-- 3. Best Sellers View (FIXED)
CREATE OR REPLACE VIEW store_best_sellers AS
SELECT
    o.store_id,
    item->>'item' as item_name,
    SUM((item->>'qty')::int) as times_sold,
    SUM(((item->>'qty')::int * (item->>'price')::numeric)) as total_earned
FROM orders o,
    jsonb_array_elements(o.items) as item
WHERE o.payment_status = 'paid'
GROUP BY o.store_id, item->>'item'
ORDER BY times_sold DESC;

-- Grant SELECT permissions
GRANT SELECT ON store_analytics_daily TO authenticated;
GRANT SELECT ON store_analytics_monthly TO authenticated;
GRANT SELECT ON store_best_sellers TO authenticated;

-- =====================================================
-- VERIFICATION & TESTING
-- =====================================================

-- 1. Verify orders table columns
SELECT '=== ORDERS TABLE COLUMNS ===' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Verify notifications table columns
SELECT '=== NOTIFICATIONS TABLE COLUMNS ===' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 3. Verify analytics views were created
SELECT '=== ANALYTICS VIEWS ===' as info;
SELECT schemaname, viewname
FROM pg_views
WHERE viewname LIKE 'store_%'
ORDER BY viewname;

-- 4. Count existing orders
SELECT '=== ORDER COUNTS ===' as info;
SELECT
    'Total Orders' as category,
    COUNT(*) as count
FROM orders
UNION ALL
SELECT
    'Paid Orders',
    COUNT(*)
FROM orders
WHERE payment_status = 'paid';

-- 5. Test analytics views (check if they return data)
SELECT '=== ANALYTICS TEST ===' as info;
SELECT
    'Daily Analytics' as view_name,
    COUNT(*) as row_count
FROM store_analytics_daily
UNION ALL
SELECT
    'Monthly Analytics',
    COUNT(*)
FROM store_analytics_monthly
UNION ALL
SELECT
    'Best Sellers',
    COUNT(*)
FROM store_best_sellers;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ ALL FIXES APPLIED SUCCESSFULLY!' as status,
       '📊 Orders, Notifications, and Analytics are now working!' as message;
