# 🧪 Quick Start: Testing Subscriptions

## ✅ Ready to Test

Everything is configured and ready! Here's what to do:

---

## 🎯 Quick Test Steps

### 1. Login to Your Trial Account
- Go to: https://app.mzansifoodconnect.app
- Login with your trial account

### 2. Verify Trial Limits
- **Go to Menu Management**
- Try adding more than 10 products
- You should get: "Product Limit Reached" error
- **Go to Web Templates**
- You should only see 1 template: Modern Food
- Other templates should show "Pro Only" or "Premium Only"

### 3. Test Pro Upgrade (R135/month)
- **Go to Settings tab**
- Find upgrade section
- Click **"Upgrade to Pro - R135/month"**
- Click **"Pay R135 - Upgrade to Pro"**
- On Yoco page, use test card:
  - Card: `4111 1111 1111 1111`
  - Expiry: `12/25`
  - CVV: `123`
  - Name: `Test User`
- Click **Pay**
- Wait for redirect to success page

### 4. Verify Upgrade Worked
- Dashboard should show "Pro Plan"
- **Menu Management**: Can now add unlimited products
- **Web Templates**: Should see 2 templates unlocked (Modern Food + Traditional SA)
- **Analytics**: Should have basic analytics

---

## 🔍 If Something Goes Wrong

### Payment succeeded but still on Trial?

**Option 1: Check Supabase Database**
```sql
SELECT id, name, plan, plan_started_at, plan_expires_at, payment_reference
FROM tenants
ORDER BY created_at DESC
LIMIT 5;
```

**Option 2: Check Webhook Logs**
- Go to: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/functions/yoco-webhook
- Click "Logs" to see if webhook received the event

**Option 3: Manual Upgrade (if webhook failed)**
Run this SQL in Supabase:
```sql
UPDATE tenants
SET 
  plan = 'pro',
  plan_started_at = NOW(),
  plan_expires_at = NOW() + INTERVAL '30 days',
  payment_reference = 'YOUR_CHECKOUT_ID'
WHERE id = 'YOUR_STORE_ID';
```

---

## 📊 Expected Results After Upgrade

| Feature | Trial | Pro | Premium |
|---------|-------|-----|---------|
| Templates | 1 | 2 | 5 |
| Products | 10 | Unlimited | Unlimited |
| Analytics | ❌ | Basic | Advanced |
| Branding | ✓ | Removed | Removed |
| Price | Free | R135/mo | R185/mo |

---

## 🎉 Success Indicators

After successful upgrade, you should see:
- ✅ "Upgrade Successful!" message
- ✅ Dashboard header shows new plan (Pro/Premium)
- ✅ More templates unlocked in Web Templates section
- ✅ Can add unlimited products in Menu Management
- ✅ New features accessible (analytics, etc.)

---

## 🚨 Important Notes

1. **Test Mode**: Make sure you're using Yoco TEST keys for testing
2. **Real Money**: If using LIVE keys, real money will be charged!
3. **Webhook Must Work**: Upgrades require webhook - already configured ✅
4. **30-Day Expiry**: Paid plans expire after 30 days (monthly billing)
5. **No Auto-Renewal**: Users must manually renew each month (for now)

---

## 📞 Testing Checklist

Before testing:
- [x] Yoco webhook registered
- [x] Webhook secret configured
- [x] Trial limits updated (10 products, 1 template)
- [x] Edge Functions deployed
- [ ] Trial account created and logged in
- [ ] Ready to make test payment

During testing:
- [ ] Verify trial limits work
- [ ] Complete Pro upgrade payment
- [ ] Check success page appears
- [ ] Verify dashboard shows Pro plan
- [ ] Test Pro features (2 templates, unlimited products)
- [ ] (Optional) Test Premium upgrade too

After testing:
- [ ] Confirm database updated correctly
- [ ] Verify all new features accessible
- [ ] Check plan expiry date is 30 days from now
- [ ] Test user experience with new plan

---

## 🎯 Test Card (Yoco Test Mode)

**Success Card:**
```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123
Name: Test User
```

This will simulate a successful payment in test mode.

---

## ✨ Ready to Test!

Everything is configured. Just follow the steps above and test the upgrade flow!

See `test-subscription-upgrade.md` for detailed troubleshooting and advanced testing scenarios.
