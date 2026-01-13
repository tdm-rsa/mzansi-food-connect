# Mzansi Food Connect - Affiliate Program Documentation

## Overview

The aggressive 30% for 12 months affiliate program allows anyone to earn passive income by referring food vendors to Mzansi Food Connect.

## Commission Structure

- **Rate**: 30% of subscription price
- **Duration**: 12 months per referral
- **Eligible Plans**: Pro (R159/mo) and Premium (R215/mo)
- **Not eligible**: Trial/free plans

### Earnings Per Referral

| Plan | Monthly Price | Commission/Month | Total Over 12 Months |
|------|---------------|------------------|----------------------|
| Pro | R159 | R47.70 | **R572.40** |
| Premium | R215 | R64.50 | **R774.00** |

**Example**: 10 Premium referrals = R7,740 per year passive income

---

## How It Works

### For Affiliates:

1. **Sign up** at `/become-affiliate`
   - Provide name, email, phone, and bank details
   - Get a unique referral code (e.g., `JOHN2026`)
   - Receive referral link: `https://mzansifoodconnect.app/signup?ref=JOHN2026`

2. **Share** the link with food vendors
   - Via WhatsApp, social media, email, etc.
   - Anyone who signs up via your link is tracked

3. **Earn commissions**
   - When vendors sign up for Pro/Premium, you earn 30% monthly
   - Commissions tracked automatically for 12 months
   - View all stats in your dashboard at `/affiliate-dashboard`

4. **Get paid**
   - Monthly EFT payments to your bank account
   - Track pending and paid commissions in dashboard

---

## Technical Implementation

### Database Tables

**1. `affiliates` Table**
- Stores affiliate profile and bank details
- Tracks total earnings and payouts
- Auto-generated unique referral codes

**2. `referrals` Table**
- Links affiliates to referred stores
- Tracks commission status (pending, active, churned)
- Counts months paid (max 12)
- Stores commission rate and duration

**3. `commission_payouts` Table**
- Records all commission payments
- Status: pending → processing → paid
- Links to specific referral and month

---

## Setup Instructions

### 1. Run Database Migration

```bash
# Navigate to your Supabase project
cd supabase

# Apply the migration
npx supabase db push
```

The migration file `014_create_affiliate_program.sql` will:
- Create all 3 tables
- Set up Row Level Security (RLS)
- Add triggers to auto-update affiliate stats
- Create helper functions

### 2. Routes Already Added

The following routes are now active:
- `/become-affiliate` - Affiliate signup page
- `/affiliate-dashboard` - Affiliate dashboard (login with email)

### 3. Referral Tracking

Referral tracking is automatically handled:
- URL parameter `?ref=CODE` is captured in `Signup.jsx`
- Stored through payment flow in `localStorage`
- Passed to `complete-signup` edge function
- Creates referral record after successful signup

---

## Admin Management

### Accessing Admin Panel

Add the `AffiliateAdminPanel` component to your admin dashboard:

```jsx
import AffiliateAdminPanel from "./components/AffiliateAdminPanel";

// In your admin dashboard
<AffiliateAdminPanel />
```

### Admin Features

1. **Overview Dashboard**
   - Total affiliates and referrals
   - Total earned, paid, and pending
   - Quick stats

2. **Affiliate Management**
   - View all affiliates with bank details
   - See referral counts and earnings
   - Monitor activity

3. **Referral Tracking**
   - See all referrals with status
   - Track commission months paid (X/12)
   - View store and plan details

4. **Payout Management**
   - Generate monthly payouts (automated)
   - View pending payouts
   - Mark payouts as paid (manual EFT tracking)

---

## Monthly Payout Process

### Automated (Recommended)

1. **Generate Payouts** (click button in admin)
   - Calculates commissions for all active referrals
   - Creates payout records with status "pending"
   - Updates `commission_months_paid` counter

2. **Process Payments**
   - Export list of pending payouts
   - Process EFTs via your business banking
   - Mark each as "paid" in admin panel

### Manual Calculation

For each active referral (where `commission_months_paid < 12`):
```
Monthly commission = Plan price × 30%
- Pro: R159 × 30% = R47.70
- Premium: R215 × 30% = R64.50
```

---

## Commission Lifecycle

1. **Vendor signs up** via affiliate link → Status: `pending`
2. **Vendor pays first month** → Status: `active`, starts 12-month clock
3. **Each month vendor stays** → Commission accrued (max 12 months)
4. **Vendor cancels** → Status: `churned`, no more commissions
5. **12 months reached** → Referral complete, affiliate earned full amount

---

## API/Edge Function Changes

### `complete-signup` Edge Function

Updated to accept `referralCode` parameter and create referral linkage:

```typescript
{
  email,
  password,
  storeName,
  plan,
  referralCode // Optional - for affiliate tracking
}
```

**Logic**:
1. Creates user and store as usual
2. If `referralCode` provided and plan is Pro/Premium:
   - Looks up affiliate by code
   - Creates referral record
   - Sets status to "active" (since payment confirmed)
   - Records first payment date

---

## Security & RLS Policies

**Affiliates can:**
- View their own profile
- Update their own bank details
- View their own referrals
- View their own payouts

**Admins can:**
- View and manage all data
- Create/update/delete records
- Process payouts

**Public can:**
- Sign up as new affiliate (insert only)

---

## Promotional Materials

### Affiliate Pitch

> **Earn passive income with Mzansi Food Connect**
>
> Refer food vendors and earn 30% monthly commission for 12 months.
>
> - Pro referrals: R572 per year
> - Premium referrals: R774 per year
> - 10 referrals = R7,740/year passive income
>
> Sign up free at: mzansifoodconnect.app/become-affiliate

### Email Template for Recruits

```
Subject: Earn R7,740/year by referring food vendors

Hi [Name],

I wanted to share an opportunity with you. Mzansi Food Connect has a
generous affiliate program where you can earn 30% monthly commission
for every food vendor you refer.

- Earn R47-R64 per month per referral
- Paid for 12 full months
- No limits on referrals
- Monthly EFT payouts

Example: Refer 10 vendors = R7,740/year

Sign up here: [your referral link]

Let me know if you have questions!
```

---

## Troubleshooting

### Referral not tracking

1. Check referral code exists in `affiliates` table
2. Verify `?ref=CODE` in signup URL
3. Check browser console for "Referral code captured" log
4. Ensure vendor selected Pro/Premium (not trial)
5. Check `referrals` table after signup completes

### Commission not calculating

1. Verify `first_payment_date` is set
2. Check `commission_months_paid < 12`
3. Ensure referral status is "active"
4. Run "Generate Monthly Payouts" in admin

### Payout not showing

1. Check `commission_payouts` table
2. Verify month_for date is correct
3. Ensure status is "pending"
4. Reload admin dashboard

---

## Future Enhancements (Optional)

1. **Automated Payouts**
   - Integrate PayFast/Stitch API
   - Automatic EFT processing
   - Reduces manual work

2. **Tiered Commissions**
   - 1-5 referrals: 30%
   - 6-15 referrals: 35%
   - 16+ referrals: 40%

3. **Bonus Incentives**
   - Refer 5 in one month: +R500 bonus
   - First to 10 referrals: +R1000 bonus

4. **Email Notifications**
   - New referral signup
   - Monthly earnings summary
   - Payout confirmation

5. **Affiliate Portal Enhancements**
   - Marketing materials download
   - Social media share buttons
   - Performance charts/graphs

---

## Support

For questions or issues:
- Email: support@mzansifoodconnect.app
- Admin: Check logs in Supabase edge functions
- Database: Query directly via Supabase dashboard

---

## Summary

Your aggressive 30% for 12 months affiliate program is now fully implemented and ready to launch! The system handles:

✅ Affiliate signups with bank details
✅ Unique referral code generation
✅ Automatic referral tracking
✅ Commission calculation (30% × 12 months)
✅ Payout management dashboard
✅ Admin oversight and controls

**Go promote it and start growing your platform!** 🚀
