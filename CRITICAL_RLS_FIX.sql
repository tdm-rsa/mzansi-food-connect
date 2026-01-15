-- ====================================================================
-- CRITICAL SECURITY FIX - RLS POLICIES FOR AFFILIATE PROGRAM
-- ====================================================================
-- This SQL must be executed in the Supabase SQL Editor to fix the
-- critical security vulnerability where anyone can read all affiliate
-- data including bank account numbers.
--
-- EXECUTE THIS IMMEDIATELY!
-- ====================================================================

-- 1. DROP INSECURE POLICY (allows anyone to read all affiliate data)
DROP POLICY IF EXISTS "Affiliates can view own profile by email" ON public.affiliates;

-- 2. CREATE SECURE SELECT POLICY (requires authentication)
CREATE POLICY "Authenticated affiliates can view own profile"
  ON public.affiliates
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND email = auth.jwt() ->> 'email'
  );

-- 3. UPDATE THE UPDATE POLICY (requires authentication)
DROP POLICY IF EXISTS "Affiliates can update own profile" ON public.affiliates;

CREATE POLICY "Authenticated affiliates can update own profile"
  ON public.affiliates
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND email = auth.jwt() ->> 'email'
  );

-- 4. UPDATE THE INSERT POLICY (requires authentication)
DROP POLICY IF EXISTS "Anyone can signup as affiliate" ON public.affiliates;

CREATE POLICY "Public can create affiliate profile after auth"
  ON public.affiliates
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 5. ENSURE RLS IS ENABLED
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- 6. SECURE REFERRALS TABLE
DROP POLICY IF EXISTS "Affiliates can view own referrals" ON public.referrals;

CREATE POLICY "Authenticated affiliates can view own referrals"
  ON public.referrals
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND affiliate_id IN (
      SELECT id FROM public.affiliates
      WHERE email = auth.jwt() ->> 'email'
    )
  );

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 7. SECURE COMMISSION PAYOUTS TABLE
DROP POLICY IF EXISTS "Affiliates can view own payouts" ON public.commission_payouts;

CREATE POLICY "Authenticated affiliates can view own payouts"
  ON public.commission_payouts
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND affiliate_id IN (
      SELECT id FROM public.affiliates
      WHERE email = auth.jwt() ->> 'email'
    )
  );

ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- VERIFICATION
-- ====================================================================
-- After running this SQL, verify the policies are in place:

SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('affiliates', 'referrals', 'commission_payouts')
ORDER BY tablename, policyname;

-- ====================================================================
-- DONE!
-- ====================================================================
-- After running this, unauthenticated users will NO LONGER be able to
-- read affiliate data. Only authenticated affiliates can see their own
-- data.
-- ====================================================================
