# Fix Trial Account Payment Initialization Error

## Problem
Trial accounts get "Failed to initialize payment" error when trying to make test payments.

**Root cause**: Platform only has LIVE Yoco keys configured. Trial accounts need TEST keys for test payments.

## Current Setup (Incorrect)
```
.env.local:
VITE_YOCO_PUBLIC_KEY=pk_live_6f1fc250jV0Ln7b8f824  # LIVE key
VITE_YOCO_SECRET_KEY=sk_live_8b6c5680nmD8Ae6b21149a39eeb5  # LIVE key
```

Trial accounts try to use these LIVE keys → Payment fails because they're not in test mode.

## Solution: Add TEST Keys for Trial Accounts

### Option 1: Get Test Keys from Yoco (Recommended)
1. Go to: https://portal.yoco.com/
2. Navigate to **Settings → API Keys**
3. Find your **TEST keys**:
   - Test Public Key: `pk_test_xxxxxxxxxxxxxxxx`
   - Test Secret Key: `sk_test_xxxxxxxxxxxxxxxx`

### Option 2: Create Test Environment
If you don't see test keys:
1. Contact Yoco support to enable test mode
2. Or create a separate test account at https://www.yoco.com/

## Implementation

### Step 1: Add Test Keys to .env.local
```bash
# Add these to your .env.local file:
VITE_YOCO_TEST_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxx
VITE_YOCO_TEST_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx

# Keep existing LIVE keys:
VITE_YOCO_PUBLIC_KEY=pk_live_6f1fc250jV0Ln7b8f824
VITE_YOCO_SECRET_KEY=sk_live_8b6c5680nmD8Ae6b21149a39eeb5
```

### Step 2: Update Environment Variables in Hosting
If deployed on Vercel/Netlify/other:
1. Go to your hosting dashboard
2. Add environment variables:
   - `VITE_YOCO_TEST_PUBLIC_KEY` = `pk_test_xxx`
   - `VITE_YOCO_TEST_SECRET_KEY` = `sk_test_xxx`

### Step 3: Update Supabase Edge Functions
1. Go to: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/settings/functions
2. Add secrets:
   - Name: `VITE_YOCO_TEST_SECRET_KEY`
   - Value: `sk_test_xxxxxxxxxxxxxxxx`
3. Redeploy Edge Functions:
   ```bash
   npx supabase functions deploy yoco-webhook
   npx supabase functions deploy create-yoco-checkout
   ```

## How It Works After Fix

### Trial Accounts (Test Mode):
- Use: `VITE_YOCO_TEST_PUBLIC_KEY` and `VITE_YOCO_TEST_SECRET_KEY`
- Payments: Test cards only (4111 1111 1111 1111)
- Money: NOT charged to real cards
- Purpose: Learning and training

### Pro/Premium Accounts (Live Mode):
- Use: Their own Yoco keys (configured in Settings)
- Payments: Real credit cards
- Money: Real charges to their Yoco accounts
- Purpose: Production business

## Code Changes Needed

We need to modify the code to use TEST keys for trial accounts. I'll create these changes for you after you get the test keys.

### Files to Update:
1. **CustomerStore.jsx** - Use test key for trial accounts when creating checkout
2. **Checkout.jsx** - Select test/live key based on store plan
3. **create-yoco-checkout Edge Function** - Use test key for trial stores

## Test Card for Trial Accounts
After adding test keys, trial users can use this test card:
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
```

This will simulate successful payments without charging real money.

## Quick Check: Do You Have Test Keys?
1. Login to https://portal.yoco.com/
2. Go to Settings → API Keys
3. Look for section called "Test Keys" or "Sandbox Keys"
4. If you see `pk_test_` and `sk_test_`, you're good!
5. If not, contact Yoco support

## Next Steps
1. Get test keys from Yoco portal
2. Share them with me
3. I'll update the code to use test keys for trial accounts
4. Redeploy the platform
5. Test trial payments with test card

## Alternative: Disable Trial Payments
If you can't get test keys immediately, we can:
1. Disable payment buttons for trial accounts
2. Show message: "Upgrade to Pro to accept real payments"
3. Trial becomes just a demo environment (no checkout)

Let me know which approach you prefer!
