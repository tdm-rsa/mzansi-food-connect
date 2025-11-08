# Complete Payment Setup Guide

## Two Payment Flows:

### 1. **Subscription Payments** (Vendors → You)
Vendors pay YOU for Pro/Premium plans

### 2. **Customer Payments** (Customers → Vendors)
Customers pay vendors for food orders

---

## Part 1: Subscription Payments Setup

### Step 1: Run Database Migration

1. Go to Supabase → SQL Editor
2. Run `ADD_PAYSTACK_COLUMNS.sql`
3. This adds payment key columns to stores table

### Step 2: Create Paystack Payment Pages

1. **Go to Paystack:**
   - https://dashboard.paystack.com/
   - Login or create account

2. **Create Pro Plan Payment Page:**
   - Go to **Payment Pages** (left menu)
   - Click **Create Payment Page**
   - Name: "Mzansi Pro"
   - Amount: R150
   - Interval: **Monthly** (recurring)
   - Click **Create**
   - Copy the payment URL (e.g., `paystack.com/pay/mzansi-pro`)

3. **Create Premium Plan Payment Page:**
   - Same steps as above
   - Name: "Mzansi Premium"
   - Amount: R300
   - Interval: **Monthly** (recurring)
   - Copy the payment URL (e.g., `paystack.com/pay/mzansi-premium`)

### Step 3: Update Payment URLs in Code

Open `src/App.jsx` and find these lines (around line 1980-2010):

```javascript
// Pro plan upgrade button
onClick={() => window.open("https://paystack.com/pay/mzansi-pro", "_blank")}

// Premium plan upgrade button
onClick={() => window.open("https://paystack.com/pay/mzansi-premium", "_blank")}
```

Replace with YOUR actual Paystack payment page URLs.

### Step 4: Deploy Webhook to Supabase

1. **Install Supabase CLI:**
```bash
npm install -g supabase
```

2. **Login to Supabase:**
```bash
supabase login
```

3. **Link Project:**
```bash
supabase link --project-ref your-project-ref
```

4. **Deploy Webhook Function:**
```bash
supabase functions deploy paystack-webhook
```

5. **Set Environment Variables:**
```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_your_secret_key
```

### Step 5: Configure Paystack Webhook

1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-project-ref.supabase.co/functions/v1/paystack-webhook`
3. Events to listen for:
   - `charge.success`
   - `subscription.create`
   - `subscription.disable`
4. Save webhook

---

## Part 2: Customer Payment Setup (Per Vendor)

### Vendor Setup (Dashboard):

1. **Login to vendor dashboard**
2. **Go to Settings → Paystack Integration**
3. **Get Paystack Keys:**
   - Go to https://dashboard.paystack.com/
   - Settings → API Keys & Webhooks
   - Copy Public Key (pk_test_xxx or pk_live_xxx)
   - Copy Secret Key (sk_test_xxx or sk_live_xxx)
4. **Paste keys in Settings**
5. **Click "Save Paystack Keys"**

### Customer Checkout Flow:

The checkout is already created in `src/Checkout.jsx`. It will:
1. Show cart items
2. Collect customer phone number
3. Initialize Paystack popup using vendor's public key
4. Process payment
5. Create order in database
6. Send WhatsApp confirmation

---

## Testing

### Test Subscription Payment:

1. Click "Upgrade to Pro" in Settings
2. Complete Paystack payment (use test card: 5060 6666 6666 6666 / CVV: 123 / Exp: 12/34)
3. Check Supabase logs: `supabase functions logs paystack-webhook`
4. Verify plan updated in stores table

### Test Customer Payment:

1. Set vendor Paystack keys in Settings
2. Go to vendor's storefront
3. Add items to cart
4. Proceed to checkout
5. Complete payment
6. Verify order created
7. Check WhatsApp message sent

---

## Production Checklist

### Before Going Live:

- [ ] Run `ADD_PAYSTACK_COLUMNS.sql` in production Supabase
- [ ] Create Paystack payment pages for Pro & Premium
- [ ] Update payment URLs in code
- [ ] Deploy webhook function to Supabase
- [ ] Set production Paystack secret key in Supabase secrets
- [ ] Configure Paystack webhook URL
- [ ] Switch all vendors to live Paystack keys (pk_live_xxx, sk_live_xxx)
- [ ] Test full payment flow end-to-end

---

## Troubleshooting

### "Plan not updated after payment"
- Check Supabase function logs
- Verify webhook URL is correct
- Check Paystack webhook events are enabled
- Verify PAYSTACK_SECRET_KEY is set in Supabase

### "Customer payment fails"
- Verify vendor entered correct Paystack public key
- Check browser console for errors
- Ensure Paystack public key starts with pk_test_ or pk_live_

### "Webhook signature invalid"
- Verify PAYSTACK_SECRET_KEY matches your Paystack account
- Check Supabase secrets are set correctly

---

## Payment Flow Diagram

```
SUBSCRIPTION PAYMENTS:
Vendor → Clicks "Upgrade" → Paystack Payment Page → Payment Success
→ Webhook to Supabase → Updates stores.plan → Vendor gets Pro/Premium access

CUSTOMER PAYMENTS:
Customer → Adds to Cart → Checkout → Paystack Popup → Payment Success
→ Order Created → WhatsApp Sent → Vendor receives order
```

---

## Revenue Model

### Your Revenue (from subscriptions):
- Pro: R150/month per vendor
- Premium: R300/month per vendor

### Vendor Revenue (from customers):
- 100% goes to vendor
- You take 0% commission (or add later)

### Optional: Add Commission
To take a commission from customer payments:
1. Modify checkout to use YOUR Paystack account
2. Use Paystack Subaccounts API
3. Set commission percentage
4. Automatically split payments

---

## Support

- Paystack Docs: https://paystack.com/docs
- Supabase Functions: https://supabase.com/docs/guides/functions
- Test Cards: https://paystack.com/docs/payments/test-payments

Ready to accept payments! 🚀
