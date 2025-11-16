-- =====================================================
-- CREATE ANALYTICS VIEWS FOR MZANSI FOOD CONNECT
-- Run this in Supabase SQL Editor to enable analytics
-- Includes ALL paid orders (test + real payments)
-- =====================================================

-- 1. Daily Analytics View
CREATE OR REPLACE VIEW store_analytics_daily AS
SELECT 
    store_id,
    DATE(created_at) as day,
    COUNT(*) as orders_count,
    SUM(total) as total_revenue,
    COUNT(CASE WHEN payment_method = 'test' THEN 1 END) as test_orders,
    COUNT(CASE WHEN payment_method = 'paystack' THEN 1 END) as real_orders
FROM orders
WHERE payment_status = 'paid' OR payment_method = 'test'
GROUP BY store_id, DATE(created_at)
ORDER BY day DESC;

-- 2. Monthly Analytics View
CREATE OR REPLACE VIEW store_analytics_monthly AS
SELECT 
    store_id,
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*) as orders_count,
    SUM(total) as total_revenue,
    COUNT(CASE WHEN payment_method = 'test' THEN 1 END) as test_orders,
    COUNT(CASE WHEN payment_method = 'paystack' THEN 1 END) as real_orders
FROM orders
WHERE payment_status = 'paid' OR payment_method = 'test'
GROUP BY store_id, TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month DESC;

-- 3. Best Sellers View
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

-- Verify views were created
SELECT 
    schemaname, 
    viewname 
FROM pg_views 
WHERE viewname LIKE 'store_%'
ORDER BY viewname;
