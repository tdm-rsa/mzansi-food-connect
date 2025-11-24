# Testing Subscription Upgrade Flow

## Prerequisites
✅ Yoco webhook registered and active
✅ Webhook secret configured in Supabase
✅ Trial account with store created

## Test Scenario 1: Trial → Pro Upgrade (R135/month)

### Steps:
1. **Login** to your trial account dashboard
2. **Go to Settings** tab
3. **Find the upgrade section** with Pro and Premium options
4. **Click "Upgrade to Pro - R135/month"** button
5. **Review the upgrade details**:
   - Plan: Pro
   - Price: R135/month
   - Features listed
6. **Click "Pay R135 - Upgrade to Pro"** button
7. **You'll be redirected to Yoco** hosted checkout page
8. **Enter test card details**:
   - Card: 4111 1111 1111 1111
   - Expiry: Any future date (e.g., 12/25)
   - CVV: Any 3 digits (e.g., 123)
   - Name: Test User
9. **Complete payment**
10. **You'll be redirected back** to upgrade success page

### Expected Results:
✅ Payment success page shows "Upgrade Successful!"
✅ Dashboard refreshes and shows "Pro" plan
✅ Can now access:
   - 2 templates (Modern Food, Traditional SA)
   - Unlimited products
   - Basic analytics
   - Remove branding option

### Verification:
1. **Check dashboard header** - Should show "Pro Plan"
2. **Go to Web Templates** - Should see 2 templates unlocked
3. **Go to Menu Management** - Should be able to add more than 10 products
4. **Check Supabase database**:
   ```sql
   SELECT id, name, plan, plan_started_at, plan_expires_at, payment_reference
   FROM tenants
   WHERE id = 'YOUR_STORE_ID';
   ```
   - `plan` should be 'pro'
   - `plan_started_at` should be current timestamp
   - `plan_expires_at` should be 30 days from now
   - `payment_reference` should have Yoco checkout ID

---

## Test Scenario 2: Trial → Premium Upgrade (R185/month)

### Steps:
Same as above, but click **"Upgrade to Premium - R185/month"**

### Expected Results:
✅ Payment success page shows "Upgrade Successful!"
✅ Dashboard shows "Premium" plan
✅ Can now access:
   - All 5 templates
   - Unlimited products
   - Advanced analytics with charts
   - Remove branding
   - Custom domain support

---

## Test Scenario 3: Pro → Premium Upgrade (R185/month)

### Steps:
1. **Login** with Pro account
2. **Go to Settings**
3. **Click "Upgrade to Premium"**
4. **Complete payment** (R185)

### Expected Results:
✅ Upgraded from Pro to Premium
✅ Can access all 5 templates
✅ Advanced analytics unlocked

---

## Troubleshooting

### Issue: Payment succeeds but plan doesn't upgrade

**Check webhook logs:**
```bash
# In Supabase dashboard
# Go to Edge Functions → yoco-webhook → Logs
# Look for recent webhook events
```

**Manual verification:**
```sql
-- Check if payment was recorded
SELECT * FROM tenants WHERE payment_reference LIKE '%checkout%';
```

**Manual upgrade (if webhook failed):**
```sql
-- Replace YOUR_STORE_ID and YOUR_CHECKOUT_ID
UPDATE tenants
SET 
  plan = 'pro',
  plan_started_at = NOW(),
  plan_expires_at = NOW() + INTERVAL '30 days',
  payment_reference = 'YOUR_CHECKOUT_ID'
WHERE id = 'YOUR_STORE_ID';
```

### Issue: Redirected to failure page

**Check:**
- Card details entered correctly
- Yoco account has correct API keys
- Check browser console for errors

### Issue: Webhook signature verification fails

**Check:**
- `YOCO_WEBHOOK_SECRET` in Supabase matches Yoco dashboard
- Webhook URL is correct: `https://iuuckvthpmttrsutmvga.supabase.co/functions/v1/yoco-webhook`

---

## Test Card Numbers (Yoco Test Mode)

### Success:
- `4111 1111 1111 1111` - Visa (Success)
- `5200 0000 0000 1096` - Mastercard (Success)

### Failure scenarios:
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

**Note:** These only work if your Yoco keys are in TEST mode!

---

## Post-Test Verification Checklist

After completing a successful upgrade test:

- [ ] Dashboard shows correct plan name
- [ ] Plan features are accessible (templates, products, analytics)
- [ ] Database has correct plan, start date, expiry date (30 days)
- [ ] Payment reference stored in database
- [ ] User can use all features of new plan
- [ ] Branding removed (if Pro/Premium)
- [ ] Template selection shows correct number of templates

---

## Expected Database State After Upgrade

```sql
-- Example Pro upgrade
{
  "id": "uuid-here",
  "name": "My Store",
  "plan": "pro",
  "plan_started_at": "2025-11-24T10:30:00Z",
  "plan_expires_at": "2025-12-24T10:30:00Z",  -- 30 days later
  "payment_reference": "ch_1ABC123xyz"
}
```

---

## Important Notes

1. **Test vs Live Mode**: Make sure you're using test API keys for testing
2. **Webhook Required**: Upgrades won't work without webhook configured
3. **30-Day Billing**: All paid plans expire after 30 days (monthly billing)
4. **Grace Period**: 3-day grace period after expiration before downgrade
5. **No Auto-Renewal**: Currently no automatic renewal - users must manually renew

---

## Next Steps After Successful Test

1. ✅ Verify trial limits work (1 template, 10 products)
2. ✅ Test Pro upgrade flow
3. ✅ Test Premium upgrade flow
4. ✅ Test feature access after upgrade
5. ✅ Verify plan expiration behavior
6. ✅ Test grace period functionality

