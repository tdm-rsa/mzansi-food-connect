# Yoco Keys Verification Checklist

## ✅ Frontend Keys (VERIFIED)
Your `.env.local` file has LIVE keys configured:
- `VITE_YOCO_PUBLIC_KEY=pk_live_6f1fc250jV0Ln7b8f824` ✅
- `VITE_YOCO_SECRET_KEY=sk_live_8b6c5680nmD8Ae6b21149a39eeb5` ✅

## ⚠️ Backend Keys (NEED TO VERIFY)

### Edge Functions Environment Variables
You need to verify your Supabase Edge Functions have the LIVE secret key.

**How to check:**
1. Go to: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/settings/functions
2. Check these environment variables:
   - `VITE_YOCO_SECRET_KEY` should be `sk_live_8b6c5680nmD8Ae6b21149a39eeb5`
   - `YOCO_WEBHOOK_SECRET` should be `whsec_QkI5RTBCMThCRjBGQUQ4MDg1NUIwQ0M5Njg5QkI4NTI=`

### If they're not set or have TEST keys:
1. Click "Add new secret"
2. Add/Update these:
   - Name: `VITE_YOCO_SECRET_KEY`
   - Value: `sk_live_8b6c5680nmD8Ae6b21149a39eeb5`

   - Name: `YOCO_WEBHOOK_SECRET`
   - Value: `whsec_QkI5RTBCMThCRjBGQUQ4MDg1NUIwQ0M5Njg5QkI4NTI=`

3. **Important**: Redeploy your Edge Functions after updating:
   ```bash
   npx supabase functions deploy yoco-webhook
   npx supabase functions deploy create-yoco-checkout
   ```

## Test Mode vs Live Mode
- **TEST keys**: Start with `pk_test_` and `sk_test_` - no real money charged
- **LIVE keys**: Start with `pk_live_` and `sk_live_` - real money charged ✅ (YOU HAVE THESE)

## What happens with LIVE keys:
- ✅ Real credit cards are charged actual money
- ✅ Money goes into your Yoco account
- ✅ Bank SMS sent to customers
- ✅ Webhook events are LIVE production events

## Next Step:
After verifying Edge Function environment variables, you're ready to test real payments with R4 Pro signup!
