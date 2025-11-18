# Yoco Payment Migration Guide

## ✅ Migration Complete!

Your app has been successfully migrated from Paystack to Yoco for payment processing.

---

## What Changed:

### 1. **Payment Provider**
- ❌ **Removed**: Paystack (Nigeria-focused)
- ✅ **Added**: Yoco (South Africa-focused, ZAR native)

### 2. **Code Updates**
- [Checkout.jsx](src/Checkout.jsx) - Now uses Yoco SDK for customer payments
- [UpgradePayment.jsx](src/components/UpgradePayment.jsx) - Uses Yoco for subscription upgrades
- [App.jsx](src/App.jsx) - Settings UI updated for Yoco keys
- [.env](.env) - Your live Yoco keys are configured

### 3. **Database Changes**
- Columns renamed: `paystack_*` → `yoco_*`
- Run [UPDATE_TO_YOCO.sql](UPDATE_TO_YOCO.sql) in Supabase SQL Editor

### 4. **Webhook Handler**
- Created: [yoco-webhook/index.ts](supabase/functions/yoco-webhook/index.ts)
- Handles subscription events from Yoco

---

## Next Steps to Go Live:

### Step 1: Update Supabase Database (5 minutes)
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/sql)
2. Open file: `UPDATE_TO_YOCO.sql`
3. Copy contents and paste in SQL Editor
4. Click **Run**
5. Verify success message: "Database migrated to Yoco successfully! ✅"

### Step 2: Deploy Yoco Webhook to Supabase (10 minutes)

**Install Supabase CLI (if not already installed):**
```bash
npm install -g supabase
```

**Login and Deploy:**
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref iuuckvthpmttrsutmvga

# Deploy webhook function
supabase functions deploy yoco-webhook

# Set your Yoco secret key
supabase secrets set YOCO_SECRET_KEY=sk_live_8b6c5680nmD8Ae6b21149a39eeb5
```

**Get Webhook URL:**
After deployment, your webhook URL will be:
```
https://iuuckvthpmttrsutmvga.supabase.co/functions/v1/yoco-webhook
```

### Step 3: Configure Yoco Webhooks (5 minutes)
1. Go to [Yoco Portal](https://portal.yoco.com/)
2. Navigate to: **Settings → Developers → Webhooks**
3. Click **Add Webhook**
4. Enter webhook URL: `https://iuuckvthpmttrsutmvga.supabase.co/functions/v1/yoco-webhook`
5. Select events:
   - `payment.succeeded`
   - `subscription.created`
   - `subscription.cancelled`
6. Save webhook

### Step 4: Update Vercel Environment Variables (3 minutes)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `mzansi-food-connect`
3. Go to: **Settings → Environment Variables**
4. **Remove** old variables:
   - `VITE_PAYSTACK_PUBLIC_KEY`
5. **Add** new variables:
   - `VITE_YOCO_PUBLIC_KEY` = `pk_live_6f1fc250jV0Ln7b8f824`
   - `VITE_YOCO_SECRET_KEY` = `sk_live_8b6c5680nmD8Ae6b21149a39eeb5`
6. Click **Save**

### Step 5: Deploy to Vercel (2 minutes)
```bash
# Commit changes
git add .
git commit -m "Migrate from Paystack to Yoco payment integration"

# Push to trigger auto-deployment
git push origin main
```

**OR** manually redeploy in Vercel Dashboard:
1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment

---

## Testing the Integration:

### Test 1: Vendor Subscription Upgrade
1. Login to your dashboard (any vendor account)
2. Go to **Settings**
3. Click **Upgrade to Pro** or **Upgrade to Premium**
4. Complete payment using Yoco popup
5. Use test card: **4242 4242 4242 4242** (CVV: any 3 digits, Exp: any future date)
6. Verify plan upgraded in database

### Test 2: Customer Checkout
1. **Setup vendor Yoco keys:**
   - Login as vendor
   - Go to Settings → Yoco Integration
   - Paste vendor's live Yoco keys
   - Click "Save Yoco Keys"

2. **Test customer payment:**
   - Visit vendor's storefront
   - Add items to cart
   - Proceed to checkout
   - Fill in customer details
   - Click "Pay"
   - Complete Yoco payment
   - Verify order created in database

---

## Payment Flow:

### Subscription Payments (Vendors → You)
```
Vendor clicks "Upgrade to Pro/Premium"
  ↓
Yoco popup opens
  ↓
Vendor completes payment (YOUR Yoco account)
  ↓
Yoco sends webhook to Supabase
  ↓
Database updated: plan = 'pro' or 'premium'
  ↓
Vendor gets instant access to features
```

### Customer Payments (Customers → Vendor)
```
Customer adds items to cart
  ↓
Proceeds to checkout
  ↓
Enters name & phone number
  ↓
Clicks "Pay R{amount}"
  ↓
Yoco popup opens (using VENDOR's Yoco keys)
  ↓
Customer completes payment
  ↓
Money goes to VENDOR's Yoco account
  ↓
Order created in database
  ↓
WhatsApp confirmation sent to customer
```

---

## Vendor Onboarding Instructions:

Each vendor must:
1. **Create Yoco account** at [portal.yoco.com](https://portal.yoco.com/)
2. **Complete KYC verification** (business verification)
3. **Get live keys:**
   - Go to Settings → Developers
   - Copy Live Public Key
   - Copy Live Secret Key
4. **Add keys in your app:**
   - Login to dashboard
   - Go to Settings → Yoco Integration
   - Paste both keys
   - Click "Save Yoco Keys"

---

## Security Notes:

⚠️ **IMPORTANT:**
- **NEVER commit `.env` file to Git** - Add to `.gitignore`
- **Only use LIVE keys in production** - Test keys won't process real money
- **Vendor keys are stored in database** - Consider encryption for added security
- **Webhook signature verification** is implemented ✅

---

## Troubleshooting:

### "Payment is not configured"
- **Cause**: Vendor hasn't added Yoco keys
- **Fix**: Vendor must add keys in Settings → Yoco Integration

### "Payment system is loading..."
- **Cause**: Yoco SDK not loaded yet
- **Fix**: Wait 2-3 seconds and try again

### Plan not updated after payment
- **Cause**: Webhook not configured or failed
- **Fix**:
  1. Check Supabase function logs: `supabase functions logs yoco-webhook`
  2. Verify webhook URL in Yoco Portal
  3. Check YOCO_SECRET_KEY is set in Supabase

### Customer payment fails
- **Cause**: Vendor entered wrong keys
- **Fix**: Verify vendor used LIVE keys (not test keys)

---

## Revenue Model:

### Your Revenue:
- **Pro Plan**: R150/month per vendor (goes to YOUR Yoco account)
- **Premium Plan**: R300/month per vendor (goes to YOUR Yoco account)

### Vendor Revenue:
- **Customer orders**: 100% goes to vendor's Yoco account
- **No commission** (you can add commission later using Yoco's Split Payments API)

---

## Production Checklist:

- [ ] Run `UPDATE_TO_YOCO.sql` in production Supabase
- [ ] Deploy yoco-webhook function to Supabase
- [ ] Set YOCO_SECRET_KEY in Supabase secrets
- [ ] Configure Yoco webhook URL in Yoco Portal
- [ ] Update Vercel environment variables (VITE_YOCO_PUBLIC_KEY)
- [ ] Push code to GitHub (triggers Vercel deployment)
- [ ] Test vendor subscription upgrade with live keys
- [ ] Test customer checkout flow end-to-end
- [ ] Verify webhooks are processing correctly
- [ ] Update vendor documentation with Yoco setup instructions

---

## Support Resources:

- **Yoco Documentation**: https://developer.yoco.com/
- **Yoco Support**: https://support.yoco.com/
- **Supabase Functions**: https://supabase.com/docs/guides/functions
- **Test Cards**: Use 4242 4242 4242 4242 (any CVV, any future expiry)

---

## Local Development Server:

Your app is currently running at:
**http://localhost:5174**

Test the payment flows locally before deploying!

---

## Questions?

If you encounter any issues, check:
1. Browser console for errors
2. Supabase function logs: `supabase functions logs yoco-webhook`
3. Network tab in DevTools to see payment API calls
4. Yoco Portal → Developers → Webhooks for webhook delivery logs

---

**🎉 Migration Complete! Ready to accept real payments with Yoco!**
