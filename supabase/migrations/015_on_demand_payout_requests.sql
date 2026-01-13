-- On-Demand Payout Request System
-- Affiliates can request payouts anytime, sends email to admin

-- Add available_balance column to affiliates table
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(10, 2) DEFAULT 0;

-- Add requested_payout column (amount currently being processed)
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS requested_payout DECIMAL(10, 2) DEFAULT 0;

-- Add payout request metadata to commission_payouts table
ALTER TABLE public.commission_payouts
ADD COLUMN IF NOT EXISTS requested_by_affiliate BOOLEAN DEFAULT false;

ALTER TABLE public.commission_payouts
ADD COLUMN IF NOT EXISTS admin_email TEXT;

-- Update commission_payouts status to include 'requested'
-- Status flow: pending → requested → processing → paid

-- Function to calculate available balance (earned but not yet requested/paid)
CREATE OR REPLACE FUNCTION calculate_available_balance(affiliate_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT
      COALESCE(SUM(total_commission_earned), 0) -
      COALESCE((SELECT total_paid FROM affiliates WHERE id = affiliate_uuid), 0) -
      COALESCE((SELECT requested_payout FROM affiliates WHERE id = affiliate_uuid), 0)
    FROM public.referrals
    WHERE affiliate_id = affiliate_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update available_balance when referral earnings change
CREATE OR REPLACE FUNCTION update_affiliate_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate and update available balance
  UPDATE public.affiliates
  SET
    available_balance = calculate_available_balance(NEW.affiliate_id),
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

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_affiliate_balance ON public.referrals;
CREATE TRIGGER trigger_update_affiliate_balance
AFTER INSERT OR UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_balance();

-- Function to process payout request
CREATE OR REPLACE FUNCTION request_payout(
  affiliate_uuid UUID,
  payout_amount DECIMAL,
  admin_email_address TEXT
)
RETURNS JSON AS $$
DECLARE
  available DECIMAL;
  result JSON;
BEGIN
  -- Get current available balance
  SELECT available_balance INTO available
  FROM public.affiliates
  WHERE id = affiliate_uuid;

  -- Check if enough balance
  IF payout_amount > available THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient balance'
    );
  END IF;

  -- Update affiliate's requested_payout
  UPDATE public.affiliates
  SET requested_payout = requested_payout + payout_amount
  WHERE id = affiliate_uuid;

  -- Create payout request record
  INSERT INTO public.commission_payouts (
    affiliate_id,
    amount,
    status,
    requested_by_affiliate,
    admin_email,
    month_for,
    payment_method
  ) VALUES (
    affiliate_uuid,
    payout_amount,
    'requested',
    true,
    admin_email_address,
    DATE_TRUNC('month', NOW()),
    'eft'
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Payout request submitted'
  );
END;
$$ LANGUAGE plpgsql;

-- Update status check constraint to include 'requested'
ALTER TABLE public.commission_payouts
DROP CONSTRAINT IF EXISTS commission_payouts_status_check;

ALTER TABLE public.commission_payouts
ADD CONSTRAINT commission_payouts_status_check
CHECK (status IN ('pending', 'requested', 'processing', 'paid', 'failed', 'cancelled'));

-- Comments
COMMENT ON COLUMN public.affiliates.available_balance IS 'Amount available to withdraw (earned - paid - requested)';
COMMENT ON COLUMN public.affiliates.requested_payout IS 'Amount currently being processed for payout';
COMMENT ON COLUMN public.commission_payouts.requested_by_affiliate IS 'True if affiliate requested this payout (vs admin batch)';
COMMENT ON COLUMN public.commission_payouts.admin_email IS 'Email address to notify for payout approval';
