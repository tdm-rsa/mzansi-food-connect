-- =====================================================
-- FIX ANALYTICS TO SHOW ALL PAID ORDERS
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop existing views
DROP VIEW IF EXISTS store_analytics_daily;
DROP VIEW IF EXISTS store_analytics_monthly;
DROP VIEW IF EXISTS store_best_sellers;

-- Step 2: Create Daily Analytics View (includes test orders)
CREATE OR REPLACE VIEW store_analytics_daily AS
SELECT 
    store_id,
    DATE(created_at) as day,
    COUNT(*) as orders_count,
    COALESCE(SUM(total), 0) as total_revenue,
    COUNT(CASE WHEN payment_method = 'test' THEN 1 END) as test_orders,
    COUNT(CASE WHEN payment_method = 'paystack' THEN 1 END) as real_orders
FROM orders
WHERE payment_status = 'paid' OR payment_method = 'test'
GROUP BY store_id, DATE(created_at)
ORDER BY day DESC;

-- Step 3: Create Monthly Analytics View (includes test orders)
CREATE OR REPLACE VIEW store_analytics_monthly AS
SELECT 
    store_id,
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*) as orders_count,
    COALESCE(SUM(total), 0) as total_revenue,
    COUNT(CASE WHEN payment_method = 'test' THEN 1 END) as test_orders,
    COUNT(CASE WHEN payment_method = 'paystack' THEN 1 END) as real_orders
FROM orders
WHERE payment_status = 'paid' OR payment_method = 'test'
GROUP BY store_id, TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month DESC;

-- Step 4: Create Best Sellers View (includes test orders)
CREATE OR REPLACE VIEW store_best_sellers AS
SELECT 
    o.store_id,
    item->>'item' as item_name,
    SUM((item->>'qty')::int) as times_sold,
    SUM(((item->>'qty')::int * (item->>'price')::numeric)) as total_earned
FROM orders o,
    jsonb_array_elements(o.items) as item
WHERE o.payment_status = 'paid' OR o.payment_method = 'test'
GROUP BY o.store_id, item->>'item'
ORDER BY times_sold DESC;

-- Step 5: Verify views were created
SELECT 
    schemaname, 
    viewname,
    viewowner
FROM pg_views 
WHERE viewname LIKE 'store_%'
ORDER BY viewname;

-- Step 6: Check your current orders
SELECT 
    id,
    customer,
    total,
    payment_status,
    payment_method,
    status,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Step 7: Test Daily Analytics (should show data)
SELECT * FROM store_analytics_daily
LIMIT 10;

-- Step 8: Test Monthly Analytics (should show data)
SELECT * FROM store_analytics_monthly
LIMIT 10;

-- Step 9: Test Best Sellers (should show products)
SELECT * FROM store_best_sellers
LIMIT 10;

-- Step 10: Summary of all orders
SELECT 
    COUNT(*) as total_orders,
    SUM(total) as total_revenue,
    COUNT(CASE WHEN payment_method = 'test' THEN 1 END) as test_orders,
    COUNT(CASE WHEN payment_method = 'paystack' THEN 1 END) as paystack_orders
FROM orders
WHERE payment_status = 'paid' OR payment_method = 'test';
