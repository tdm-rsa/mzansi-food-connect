# 🗄️ Database Setup Guide

This guide will help you set up your Supabase database correctly for the tiered pricing system.

---

## 📋 Quick Decision Tree

**Choose ONE of these paths:**

### Path A: Fresh Start (No existing data to keep)
✅ **Run**: `FINAL_SIGNUP_FIX.sql`
- Use if you're starting fresh or don't mind losing existing store data
- Creates a brand new stores table with all features
- Fastest and cleanest option

### Path B: Keep Existing Data
✅ **Run**: `ADD_PLAN_COLUMNS.sql`
- Use if you have existing stores/users you want to keep
- Adds plan columns to your current stores table
- Preserves all existing data

### Both Paths: Fix Menu Items
✅ **Run**: `FIX_MENU_ITEMS_RLS.sql`
- Required for both paths
- Fixes Row Level Security for menu items
- Ensures menu management works correctly

---

## 🚀 Step-by-Step Instructions

### Option 1: Fresh Start Setup (Recommended for new projects)

1. **Open Supabase Dashboard**
   - Go to your project
   - Click "SQL Editor" in the left sidebar

2. **Run FINAL_SIGNUP_FIX.sql**
   ```sql
   -- Copy entire contents of FINAL_SIGNUP_FIX.sql
   -- Paste into SQL Editor
   -- Click "Run"
   ```
   ✅ Should see: "Stores table created successfully!"

3. **Run FIX_MENU_ITEMS_RLS.sql**
   ```sql
   -- Copy entire contents of FIX_MENU_ITEMS_RLS.sql
   -- Paste into SQL Editor
   -- Click "Run"
   ```
   ✅ Should see: "Menu items RLS policies fixed!"

4. **Done!** Your database is ready.

---

### Option 2: Keep Existing Data Setup

1. **Open Supabase Dashboard**
   - Go to your project
   - Click "SQL Editor" in the left sidebar

2. **Run ADD_PLAN_COLUMNS.sql**
   ```sql
   -- Copy entire contents of ADD_PLAN_COLUMNS.sql
   -- Paste into SQL Editor
   -- Click "Run"
   ```
   ✅ Should see: "Plan columns added successfully!"
   ✅ Should show your stores with new plan columns

3. **Run FIX_MENU_ITEMS_RLS.sql**
   ```sql
   -- Copy entire contents of FIX_MENU_ITEMS_RLS.sql
   -- Paste into SQL Editor
   -- Click "Run"
   ```
   ✅ Should see: "Menu items RLS policies fixed!"

4. **Done!** Your database is updated.

---

## 🧪 Testing Your Setup

After running the SQL scripts:

### 1. Refresh Your App
- Open your app in the browser
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### 2. Check Browser Console (F12)
You should see these logs:
```
🔍 Store loaded: {plan: "trial", ...}
📋 Store plan: trial
🎯 Current plan from storeInfo: trial
✨ Plan features: {hasAnalytics: false, ...}
```

### 3. Verify Plan Badge
- Top right corner should show: **📦 Starter** (for trial plan)
- Badge should have gray gradient background

### 4. Test Features by Plan

#### Trial Plan (Starter):
- [ ] Badge shows "📦 Starter"
- [ ] Can add up to 30 products
- [ ] Analytics is locked
- [ ] Only "Modern Food" template available
- [ ] Other templates show "🔒 Locked" with upgrade button

#### Pro Plan:
- [ ] Badge shows "🚀 Pro"
- [ ] Unlimited products
- [ ] Analytics shows basic metrics (numbers only)
- [ ] 3 templates available
- [ ] Upgrade prompt to Premium in Analytics

#### Premium Plan:
- [ ] Badge shows "👑 Premium"
- [ ] All features unlocked
- [ ] Advanced analytics with charts
- [ ] All 5 templates available
- [ ] No upgrade prompts

---

## 🔧 Manual Plan Assignment (For Testing)

To test Pro or Premium features without payment:

### Get Your User ID
```sql
SELECT id, email FROM auth.users WHERE email = 'your@email.com';
```

### Upgrade to Pro
```sql
UPDATE stores
SET plan = 'pro',
    plan_started_at = NOW(),
    plan_expires_at = NULL
WHERE owner_id = 'YOUR_USER_ID_HERE';
```

### Upgrade to Premium
```sql
UPDATE stores
SET plan = 'premium',
    plan_started_at = NOW(),
    plan_expires_at = NULL
WHERE owner_id = 'YOUR_USER_ID_HERE';
```

### Reset to Trial
```sql
UPDATE stores
SET plan = 'trial',
    plan_started_at = NOW(),
    plan_expires_at = NOW() + INTERVAL '7 days'
WHERE owner_id = 'YOUR_USER_ID_HERE';
```

---

## 🐛 Troubleshooting

### Issue: Still showing "Starter" for all plans

**Solution:**
1. Check browser console (F12)
2. Look for log: `📋 Store plan: ???`
3. If it shows `undefined` or `null`:
   - The migration didn't run successfully
   - Try running the SQL again
   - Check for error messages in Supabase SQL Editor

### Issue: Analytics still locked for Pro/Premium

**Solution:**
1. Check console log: `✨ Plan features:`
2. Should show `hasAnalytics: true` for Pro/Premium
3. If showing `hasAnalytics: false`:
   - The plan value is not being detected correctly
   - Check your plan value in database:
   ```sql
   SELECT id, name, plan FROM stores;
   ```

### Issue: Templates still locked

**Solution:**
1. Check console log: `✨ Plan features:`
2. Check the `templates` array
3. Should match your plan:
   - Trial: `['Modern Food']`
   - Pro: `['Modern Food', 'Traditional SA', 'Fast Mobile']`
   - Premium: All 5 templates

### Issue: Can't add menu items

**Solution:**
- Run `FIX_MENU_ITEMS_RLS.sql` again
- This fixes Row Level Security policies
- Allows authenticated users to insert menu items for their stores

---

## 📊 Database Schema Reference

### Stores Table Columns (After Migration)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Store ID |
| `owner_id` | UUID | User who owns the store |
| `name` | TEXT | Store name |
| `plan` | TEXT | Plan type: 'trial', 'pro', 'premium' |
| `plan_started_at` | TIMESTAMPTZ | When plan started |
| `plan_expires_at` | TIMESTAMPTZ | When trial expires (NULL for paid) |
| `custom_domain` | TEXT | Custom domain (Premium only) |
| `domain_status` | TEXT | Domain status: 'none', 'pending', 'active', 'failed' |
| ... | ... | Other store settings |

### Plan Values
- `'trial'` - Free Trial (default)
- `'pro'` - Pro Plan (R150/month)
- `'premium'` - Premium Plan (R300/month)

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] SQL scripts ran without errors
- [ ] Browser console shows correct plan
- [ ] Plan badge displays correctly
- [ ] Analytics access matches plan
- [ ] Template access matches plan
- [ ] Product limit enforced for trial
- [ ] Can create/edit menu items
- [ ] Settings shows correct upgrade options

---

## 🎯 Next Steps After Setup

1. **Remove debug logs** (optional):
   - The console.log statements in App.jsx
   - These were added for debugging only

2. **Test signup flow**:
   - Create new trial account
   - Verify 7-day expiration is set
   - Test paid plan signup with Paystack

3. **Configure Paystack**:
   - Create payment plans in Paystack dashboard
   - Update payment URLs in Settings

4. **Test plan upgrades**:
   - Trial → Pro upgrade
   - Pro → Premium upgrade
   - Verify features unlock correctly

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for error messages
2. Check Supabase logs for database errors
3. Verify SQL scripts completed successfully
4. Make sure you refreshed the browser after migration

**Common Error Messages:**
- "new row violates row-level security policy" → Run FIX_MENU_ITEMS_RLS.sql
- "column 'plan' does not exist" → Run ADD_PLAN_COLUMNS.sql
- "permission denied for table stores" → Check RLS policies in FINAL_SIGNUP_FIX.sql
