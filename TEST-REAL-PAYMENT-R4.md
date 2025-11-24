# Real Payment Testing Guide - Pro Plan R4

## Prerequisites Checklist
- ✅ Pricing updated: Pro = R4, Premium = R6
- ✅ LIVE Yoco keys configured in .env.local
- ⚠️ Edge Functions environment variables need verification (see VERIFY-YOCO-KEYS.md)
- ⏳ Test accounts need cleanup (run delete-test-accounts.sql)

## Step 1: Clean Database
1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql
2. Open `delete-test-accounts.sql` file
3. Copy contents and paste into SQL Editor
4. **Review carefully** - this deletes ALL tenant data
5. Click "Run" to execute
6. Verify results show 0 records remaining in all tables

## Step 2: Verify Edge Functions Have LIVE Keys
1. Go to: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/settings/functions
2. Check/Add these secrets:
   - `VITE_YOCO_SECRET_KEY` = `sk_live_8b6c5680nmD8Ae6b21149a39eeb5`
   - `YOCO_WEBHOOK_SECRET` = `whsec_QkI5RTBCMThCRjBGQUQ4MDg1NUIwQ0M5Njg5QkI4NTI=`
3. If you added/updated any, redeploy functions:
   ```bash
   npx supabase functions deploy yoco-webhook
   npx supabase functions deploy create-yoco-checkout
   ```

## Step 3: Deploy Latest Changes
If git push failed due to connection, retry:
```bash
cd "c:\Users\nqube\OneDrive - University of Cape Town\MzanziFoodConnect\mzansi-food-connect"
git push
```

Or build and deploy manually:
```bash
npm run build
```
Then upload to your hosting provider.

## Step 4: Test Real R4 Payment
### What You'll Need:
- Real credit card (NOT test card 4111 1111 1111 1111)
- R4 in your bank account (will be charged for real)
- WhatsApp Business number ready for notifications

### Testing Steps:
1. **Navigate to signup page**: https://app.mzansifoodconnect.app/signup

2. **Select Pro Plan**:
   - Should show "R4 / month"
   - Click "Get Started"

3. **Fill registration form**:
   - Store name: "Test Real Payment Store"
   - Owner name: Your real name
   - Email: Your real email
   - Password: Strong password
   - Phone: Your real SA number (format: 27XXXXXXXXX)

4. **Proceed to payment**:
   - Click "Create Account & Pay"
   - Should redirect to Yoco checkout page

5. **Complete payment with REAL card**:
   - Enter your real credit card details
   - Confirm payment of R4
   - **You will be charged real money**

6. **Verify webhook processing**:
   - Should redirect to success page
   - Check your email for confirmation
   - Check database: new record in `tenants` table with `plan: 'pro'`

7. **Verify dashboard access**:
   - Login with your credentials
   - Dashboard should show Pro features unlocked:
     - ✅ Analytics visible
     - ✅ 2 templates available
     - ✅ Payment settings visible (Yoco Integration section)
     - ✅ Unlimited products
     - ✅ "Pro" badge on dashboard header

8. **Verify payment in Yoco**:
   - Login to https://portal.yoco.com/
   - Check transactions - should see R4 payment
   - Verify it's marked as "Successful"

## What Success Looks Like:
- ✅ R4 charged to your card
- ✅ Bank SMS received confirming payment
- ✅ Yoco portal shows transaction
- ✅ New tenant created in database with `plan = 'pro'`
- ✅ Plan expiry set to 30 days from now
- ✅ Dashboard shows Pro features unlocked
- ✅ No errors in browser console
- ✅ No errors in Supabase Edge Functions logs

## If Something Goes Wrong:

### Payment succeeds but no dashboard access:
1. Check Supabase Edge Functions logs: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/functions
2. Look for errors in `yoco-webhook` function
3. Verify webhook was called by checking logs for recent requests
4. Check `pending_orders` table - is there a stuck record?

### Payment fails:
1. Verify you're using LIVE keys, not test keys
2. Check Yoco portal for declined reason
3. Ensure card has sufficient funds (R4)
4. Check network connection

### Webhook not firing:
1. Verify webhook registered in Yoco dashboard
2. Check webhook URL is correct: `https://iuuckvthpmttrsutmvga.supabase.co/functions/v1/yoco-webhook`
3. Verify webhook secret matches in Edge Function environment variables

## Test Plan Expiry (Optional - After 30 Days)
To test plan expiry fallback to trial:
1. Wait 30 days OR manually update `plan_expires_at` in database to a past date
2. Logout and login again
3. Dashboard should now show Trial features (test payments only)
4. Upgrade buttons should appear prompting renewal

## Next: Test Premium Plan (R6)
Repeat this entire process but select Premium plan instead of Pro.
Expected: R6 charged, Premium features unlocked (5 templates, advanced analytics, custom domain).
