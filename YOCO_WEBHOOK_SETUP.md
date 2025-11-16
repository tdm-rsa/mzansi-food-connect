# Yoco Webhook Setup Guide

## Overview
The Yoco payment system has been configured to use secure webhook-based payment verification. This ensures that plan upgrades can only happen when Yoco confirms the payment on their servers, preventing fraudulent upgrades.

## Security Improvements
✅ **Before**: Client-side directly upgraded store after payment (INSECURE)
✅ **After**: Yoco webhook verifies payment server-side before upgrading (SECURE)

## Setup Instructions

### 1. Deploy the Webhook to Supabase

The webhook function is located at: `supabase/functions/yoco-webhook/index.ts`

Deploy it using the Supabase CLI:

```bash
npx supabase functions deploy yoco-webhook
```

This will give you a webhook URL like:
```
https://iuuckvthpmttrsutmvga.supabase.co/functions/v1/yoco-webhook
```

### 2. Configure Environment Variables in Supabase

Go to your Supabase project dashboard:
1. Navigate to **Project Settings** → **Edge Functions**
2. Add the following secrets:

```
YOCO_SECRET_KEY=<your-yoco-secret-key-from-env-file>
SUPABASE_URL=https://iuuckvthpmttrsutmvga.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-from-supabase-dashboard>
```

> **Important**: Use the LIVE secret key from your `.env` file. Never commit secret keys to git.

### 3. Configure Webhook in Yoco Dashboard

1. Log in to [Yoco Dashboard](https://portal.yoco.com/)
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Enter your webhook URL: `https://iuuckvthpmttrsutmvga.supabase.co/functions/v1/yoco-webhook`
5. Select the following events:
   - ✅ `payment.succeeded` - When a payment is successful
   - ✅ `subscription.created` - When a subscription is created
   - ✅ `subscription.cancelled` - When a subscription is cancelled
6. Save the webhook

### 4. Test the Webhook

Yoco provides a webhook testing feature in their dashboard:

1. Go to **Webhooks** in Yoco Dashboard
2. Click **Test** next to your webhook
3. Send a test `payment.succeeded` event
4. Check the Supabase Edge Function logs to verify it received the webhook

### 5. Verify Database Permissions

Ensure the `pending_payments` table exists and has proper RLS policies:

```sql
-- Check if table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'pending_payments';

-- If it doesn't exist, create it
-- (The table should already exist from CREATE_PENDING_PAYMENTS_TABLE.sql)
```

## How It Works

### Payment Flow

1. **User clicks "Pay"** → Yoco SDK opens payment popup
2. **User pays** → Yoco processes payment
3. **Client receives success** → Stores payment in `pending_payments` table
4. **Yoco sends webhook** → Calls `/functions/v1/yoco-webhook`
5. **Webhook verifies signature** → Uses HMAC SHA256 to verify authenticity
6. **Webhook upgrades plan** → Updates `tenants` table with new plan
7. **Client polls for confirmation** → Checks if plan was upgraded (30 sec timeout)
8. **Success message shown** → User sees confirmation

### Security Features

- **HMAC SHA256 Signature Verification**: Ensures webhook came from Yoco
- **Server-side upgrade only**: Client cannot trigger upgrade without Yoco confirmation
- **Pending payments table**: Tracks payment status before upgrade
- **Polling with timeout**: Client waits for webhook, times out gracefully if needed

## Database Schema

### tenants table columns used:
- `plan` - Current plan (trial/pro/premium)
- `plan_started_at` - When current plan started
- `plan_expires_at` - When plan expires (null for paid plans)
- `payment_reference` - Yoco payment ID
- `subscription_id` - Yoco subscription ID (for recurring)

### pending_payments table columns:
- `user_id` - User who made payment
- `plan` - Target plan (pro/premium)
- `payment_reference` - Yoco payment ID
- `status` - Payment status (pending/completed)
- `created_at` - When payment was initiated
- `processed_at` - When webhook processed it

## Troubleshooting

### Webhook not receiving events
- Check Yoco Dashboard → Webhooks → View Logs
- Verify webhook URL is correct
- Ensure Supabase Edge Function is deployed

### Signature verification failing
- Verify `YOCO_SECRET_KEY` matches your Yoco secret key
- Check Yoco Dashboard for the correct secret key

### Payments not upgrading plan
- Check Supabase Edge Function logs
- Verify `pending_payments` table exists
- Check RLS policies on `tenants` table

### Client timeout error
- Normal if webhook is delayed (rare)
- User can refresh page to see upgraded plan
- Check Edge Function logs for webhook errors

## Testing Checklist

Before going live:

- [ ] Deploy yoco-webhook Edge Function
- [ ] Set environment variables in Supabase
- [ ] Configure webhook URL in Yoco Dashboard
- [ ] Test webhook with Yoco's test feature
- [ ] Make a test payment with Yoco test keys
- [ ] Verify plan upgrades correctly
- [ ] Switch to Yoco LIVE keys
- [ ] Test with real payment (small amount)
- [ ] Verify webhook signature validation works

## Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Check Yoco Dashboard webhook logs
3. Verify all environment variables are set
4. Test webhook signature verification manually
