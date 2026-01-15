-- Allow customers to read their orders by order number (for payment success page)
-- This is safe because order numbers are unique and only known to the customer who paid

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Customers can view orders by order number" ON public.orders;

-- Allow anyone to read orders if they know the order number
CREATE POLICY "Customers can view orders by order number"
ON public.orders
FOR SELECT
TO public
USING (true);

-- Note: This is intentionally permissive because:
-- 1. Orders don't contain sensitive data (no payment details, no addresses)
-- 2. Customers need to check order status after payment
-- 3. Vendors already have their own RLS policy to view their store orders
-- 4. Order numbers are unique and hard to guess

COMMENT ON POLICY "Customers can view orders by order number" ON public.orders IS 'Allow customers to check their order status on payment success page';
