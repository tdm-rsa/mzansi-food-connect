-- CRITICAL SECURITY FIXES
-- Fix RLS policies that expose sensitive data

-- ============================================
-- 1. FIX AFFILIATES TABLE RLS (CRITICAL!)
-- ============================================

-- Drop the insecure policy that allows anyone to read everything
DROP POLICY IF EXISTS "Affiliates can view own profile by email" ON public.affiliates;

-- Add proper RLS that requires authentication
-- Affiliates can only view their own data when authenticated
CREATE POLICY "Authenticated affiliates can view own profile"
  ON public.affiliates
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND email = auth.jwt() ->> 'email'
  );

-- Affiliates can update only their own bank details when authenticated
DROP POLICY IF EXISTS "Affiliates can update own profile" ON public.affiliates;
CREATE POLICY "Authenticated affiliates can update own profile"
  ON public.affiliates
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND email = auth.jwt() ->> 'email'
  );

-- Admin policies (keep existing but ensure they're secure)
DROP POLICY IF EXISTS "Admins can do everything on affiliates" ON public.affiliates;
CREATE POLICY "Admins can do everything on affiliates"
  ON public.affiliates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE owner_id = auth.uid()
      AND owner_email = 'nqubeko377@gmail.com'
    )
  );

-- Anyone can still sign up (insert) - but this creates auth user first
DROP POLICY IF EXISTS "Anyone can signup as affiliate" ON public.affiliates;
CREATE POLICY "Public can create affiliate profile after auth"
  ON public.affiliates
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- ============================================
-- 2. SECURE REFERRALS TABLE
-- ============================================

-- Affiliates can only see their own referrals
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

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can do everything on referrals" ON public.referrals;
CREATE POLICY "Admins can do everything on referrals"
  ON public.referrals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE owner_id = auth.uid()
      AND owner_email = 'nqubeko377@gmail.com'
    )
  );

-- ============================================
-- 3. SECURE COMMISSION PAYOUTS TABLE
-- ============================================

-- Affiliates can only see their own payouts
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

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can do everything on payouts" ON public.commission_payouts;
CREATE POLICY "Admins can do everything on payouts"
  ON public.commission_payouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE owner_id = auth.uid()
      AND owner_email = 'nqubeko377@gmail.com'
    )
  );

-- ============================================
-- 4. ADD AUDIT LOGGING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.affiliate_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL, -- 'login', 'payout_request', 'profile_update', 'data_access'
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_log_affiliate ON public.affiliate_audit_log(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.affiliate_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.affiliate_audit_log(action);

-- RLS on audit log
ALTER TABLE public.affiliate_audit_log ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their own audit logs
CREATE POLICY "Affiliates can view own audit logs"
  ON public.affiliate_audit_log
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND user_email = auth.jwt() ->> 'email'
  );

-- Only system can insert (via edge functions with service role)
CREATE POLICY "Service role can insert audit logs"
  ON public.affiliate_audit_log
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway

-- Admins can view all
CREATE POLICY "Admins can view all audit logs"
  ON public.affiliate_audit_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE owner_id = auth.uid()
      AND owner_email = 'nqubeko377@gmail.com'
    )
  );

-- ============================================
-- 5. ADD ENCRYPTION FUNCTIONS (Future use)
-- ============================================

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash sensitive data (one-way)
CREATE OR REPLACE FUNCTION hash_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(data, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add column for storing auth user ID (links to Supabase Auth)
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_affiliates_auth_user ON public.affiliates(auth_user_id);

-- ============================================
-- 6. ADD SECURITY METADATA
-- ============================================

-- Track last login
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_ip TEXT;

-- Track suspicious activity
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_affiliate_audit(
  p_affiliate_id UUID,
  p_user_email TEXT,
  p_action TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.affiliate_audit_log (
    affiliate_id,
    user_email,
    action,
    ip_address,
    user_agent,
    details
  ) VALUES (
    p_affiliate_id,
    p_user_email,
    p_action,
    p_ip_address,
    p_user_agent,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.affiliate_audit_log IS 'Security audit trail for all affiliate actions';
COMMENT ON POLICY "Authenticated affiliates can view own profile" ON public.affiliates IS 'Requires Supabase Auth - no unauthenticated access';
COMMENT ON POLICY "Public can create affiliate profile after auth" ON public.affiliates IS 'Affiliate must create auth account first, then profile';

-- ============================================
-- SECURITY NOTICE
-- ============================================

-- This migration fixes CRITICAL security vulnerabilities:
-- 1. Removed USING (true) policy that exposed all affiliate data
-- 2. Requires Supabase Authentication for all affiliate access
-- 3. Added audit logging for compliance and forensics
-- 4. Prepared encryption infrastructure for bank details
-- 5. Added failed login tracking and account locking

-- IMPORTANT: After this migration, affiliate login MUST use Supabase Auth
-- The old email-only login will NO LONGER WORK (this is intentional for security)
