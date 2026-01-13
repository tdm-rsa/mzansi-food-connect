-- Affiliate Program Tables
-- 30% commission for 12 months on all referred Pro/Premium subscriptions

-- ============================================
-- 1. AFFILIATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal Info
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,

  -- Bank Details (for payouts)
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('cheque', 'savings')),

  -- Referral Code (unique)
  referral_code TEXT UNIQUE NOT NULL,

  -- Stats
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0, -- Currently paying customers
  total_earned DECIMAL(10, 2) DEFAULT 0, -- Total all-time earnings
  total_paid DECIMAL(10, 2) DEFAULT 0, -- Total actually paid out
  pending_payout DECIMAL(10, 2) DEFAULT 0, -- Awaiting payment

  -- Metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Notes (admin use)
  notes TEXT
);

-- ============================================
-- 2. REFERRALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link affiliate to store
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Referral Info
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  first_payment_date TIMESTAMPTZ, -- When they first paid (starts commission period)
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'premium')), -- trial doesn't get commission

  -- Commission Tracking
  commission_rate DECIMAL(5, 2) DEFAULT 30.00, -- 30%
  commission_duration_months INTEGER DEFAULT 12, -- 12 months
  commission_months_paid INTEGER DEFAULT 0, -- How many months paid so far
  total_commission_earned DECIMAL(10, 2) DEFAULT 0, -- Total earned from this referral

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'churned', 'cancelled')),
  -- pending: signed up but hasn't paid yet
  -- active: paying customer
  -- churned: stopped paying
  -- cancelled: cancelled subscription

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(affiliate_id, store_id) -- One affiliate can't refer same store twice
);

-- ============================================
-- 3. COMMISSION PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to affiliate and referral
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL, -- Can be null for batch payouts

  -- Payout Details
  amount DECIMAL(10, 2) NOT NULL,
  month_for DATE NOT NULL, -- Which month is this commission for? (YYYY-MM-01)

  -- Payment Info
  payment_method TEXT DEFAULT 'eft' CHECK (payment_method IN ('eft', 'manual', 'payfast', 'other')),
  payment_reference TEXT, -- Bank reference or transaction ID
  payment_date TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Admin notes
  notes TEXT
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON public.affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate_id ON public.referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_store_id ON public.referrals(store_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

CREATE INDEX IF NOT EXISTS idx_payouts_affiliate_id ON public.commission_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.commission_payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_month_for ON public.commission_payouts(month_for);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;

-- Affiliates can read their own data
CREATE POLICY "Affiliates can view own profile"
  ON public.affiliates
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Affiliates can update their own bank details
CREATE POLICY "Affiliates can update own profile"
  ON public.affiliates
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = email);

-- Affiliates can view their own referrals
CREATE POLICY "Affiliates can view own referrals"
  ON public.referrals
  FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Affiliates can view their own payouts
CREATE POLICY "Affiliates can view own payouts"
  ON public.commission_payouts
  FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Admin policies (authenticated users with admin role can do everything)
-- Note: You'll need to set up admin roles in your auth system
CREATE POLICY "Admins can do everything on affiliates"
  ON public.affiliates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE owner_id = auth.uid()
      AND (owner_email LIKE '%@mzansifoodconnect%' OR plan = 'admin')
    )
  );

CREATE POLICY "Admins can do everything on referrals"
  ON public.referrals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE owner_id = auth.uid()
      AND (owner_email LIKE '%@mzansifoodconnect%' OR plan = 'admin')
    )
  );

CREATE POLICY "Admins can do everything on payouts"
  ON public.commission_payouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE owner_id = auth.uid()
      AND (owner_email LIKE '%@mzansifoodconnect%' OR plan = 'admin')
    )
  );

-- Public can insert new affiliates (signup)
CREATE POLICY "Anyone can signup as affiliate"
  ON public.affiliates
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-character code (uppercase letters + numbers)
    code := upper(substring(md5(random()::text) from 1 for 8));

    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM public.affiliates WHERE referral_code = code) INTO exists;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to update affiliate stats when referral changes
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_referrals and active_referrals count
  UPDATE public.affiliates
  SET
    total_referrals = (
      SELECT COUNT(*) FROM public.referrals WHERE affiliate_id = NEW.affiliate_id
    ),
    active_referrals = (
      SELECT COUNT(*) FROM public.referrals
      WHERE affiliate_id = NEW.affiliate_id AND status = 'active'
    ),
    total_earned = (
      SELECT COALESCE(SUM(total_commission_earned), 0)
      FROM public.referrals
      WHERE affiliate_id = NEW.affiliate_id
    ),
    updated_at = NOW()
  WHERE id = NEW.affiliate_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update affiliate stats
CREATE TRIGGER trigger_update_affiliate_stats
AFTER INSERT OR UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_stats();

-- Function to calculate pending payouts for an affiliate
CREATE OR REPLACE FUNCTION calculate_pending_payout(affiliate_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(total_commission_earned), 0) - COALESCE(SUM(total_paid), 0)
    FROM public.affiliates
    WHERE id = affiliate_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.affiliates IS 'Affiliate marketers who promote Mzansi Food Connect';
COMMENT ON TABLE public.referrals IS 'Tracks which affiliates referred which stores - 30% for 12 months';
COMMENT ON TABLE public.commission_payouts IS 'Monthly commission payments to affiliates';

COMMENT ON COLUMN public.referrals.commission_months_paid IS 'Number of monthly commissions paid (max 12)';
COMMENT ON COLUMN public.referrals.first_payment_date IS 'When store first paid - starts 12-month commission clock';
