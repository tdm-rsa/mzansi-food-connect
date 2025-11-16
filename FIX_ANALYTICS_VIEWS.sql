-- =====================================================
-- FIX ANALYTICS VIEWS FOR NEW ORDER SCHEMA
-- Run this in Supabase SQL Editor to fix analytics
-- Date: 2025-11-02
-- =====================================================

-- Drop old views
DROP VIEW IF EXISTS store_analytics_daily CASCADE;
DROP VIEW IF EXISTS store_analytics_monthly CASCADE;
DROP VIEW IF EXISTS store_best_sellers CASCADE;

-- 1. Daily Analytics View (FIXED - no payment_method column)
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

-- 2. Monthly Analytics View (FIXED - no payment_method column)
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

-- 3. Best Sellers View (FIXED - no payment_method column)
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

-- 4. Grant SELECT permissions to authenticated users
GRANT SELECT ON store_analytics_daily TO authenticated;
GRANT SELECT ON store_analytics_monthly TO authenticated;
GRANT SELECT ON store_best_sellers TO authenticated;

-- Verify views were created
SELECT
    schemaname,
    viewname
FROM pg_views
WHERE viewname LIKE 'store_%'
ORDER BY viewname;

-- Test the views with sample data
SELECT 'Daily Analytics', COUNT(*) as row_count FROM store_analytics_daily
UNION ALL
SELECT 'Monthly Analytics', COUNT(*) FROM store_analytics_monthly
UNION ALL
SELECT 'Best Sellers', COUNT(*) FROM store_best_sellers;
