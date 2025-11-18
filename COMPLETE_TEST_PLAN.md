# 🧪 COMPLETE TESTING PLAN - Three Dashboard System

## Current Status from Your Screenshot:
✅ **Trial/Starter Plan IS WORKING**
- Console shows: `plan === "trial": true` ✓
- Badge should show: "📦 Starter" (gray)
- Analytics card shows: "🔒 Locked" ✓

## 🔴 CRITICAL: Testing Methodology

The app loads your store data **ONCE** when you log in. After changing the plan in the database, you MUST:

1. **Hard refresh browser** (Ctrl + Shift + R)
2. **Clear browser cache** OR use incognito mode
3. **Log out completely** and log back in

Just refreshing won't work because React state is already set!

---

## 📝 Step-by-Step Testing Instructions

### STEP 1: Verify Current Database State

Run this in Supabase SQL Editor:

```sql
SELECT
  id,
  name,
  owner_id,
  plan,
  LENGTH(plan) as plan_length,
  plan = 'trial' as is_trial,
  plan = 'pro' as is_pro,
  plan = 'premium' as is_premium,
  plan_started_at,
  plan_expires_at
FROM stores
ORDER BY created_at DESC;
```

**Expected:** You should see your store with `plan = 'trial'`

---

### STEP 2: Test STARTER Dashboard (Current State)

You're already here! Your screenshot shows this is working:

**Current Results:**
- ✅ Console: `plan === "trial": true`
- ✅ Analytics card: Shows "🔒 Locked"
- ✅ Dashboard: Shows "1 template available (Free Trial)"

**What to verify:**
1. Click on Analytics card → Should redirect to Settings/Upgrade page
2. Check Web Templates → Should show only "Modern Food" unlocked
3. Badge at top right → Should show "📦 Starter" in gray

---

### STEP 3: Test PRO Dashboard

#### A. Update Database to Pro:

```sql
-- Find your store ID first
SELECT id, name, plan FROM stores WHERE plan = 'trial';

-- Update to Pro (replace YOUR_STORE_ID)
UPDATE stores
SET
  plan = 'pro',
  plan_expires_at = NULL,
  plan_started_at = NOW()
WHERE plan = 'trial';

-- Verify
SELECT id, name, plan, plan = 'pro' as is_pro FROM stores;
```

#### B. Reload App:

**METHOD 1 (Recommended):**
1. Click **Logout** button
2. Close browser tab
3. Open new browser tab
4. Go to your app
5. Login again

**METHOD 2:**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. Or just: Ctrl + Shift + R

#### C. Verify Pro Features:

**Expected Console Logs:**
```
🔍 Store loaded: {plan: "pro", ...}
📋 Store plan: pro
📋 Store plan === "trial": false
📋 Store plan === "pro": true ← THIS!
📋 Store plan === "premium": false
```

**Expected UI:**
- Badge: "🚀 Pro" (purple gradient)
- Dashboard Analytics card: "📊 Basic Analytics" (NOT locked)
- Click Analytics → Should show:
  - Header: "Basic Revenue Tracking"
  - Numbers only (total revenue, total orders, growth)
  - NO charts
  - Upgrade prompt to Premium at bottom
- Web Templates: 3 templates unlocked (Modern Food, Traditional SA, Fast Mobile)

---

### STEP 4: Test PREMIUM Dashboard

#### A. Update Database to Premium:

```sql
-- Update to Premium
UPDATE stores
SET
  plan = 'premium',
  plan_expires_at = NULL,
  plan_started_at = NOW()
WHERE plan = 'pro';

-- Verify
SELECT id, name, plan, plan = 'premium' as is_premium FROM stores;
```

#### B. Reload App (Same as Step 3B):

1. **Logout**
2. **Close tab**
3. **Open new tab**
4. **Login again**

#### C. Verify Premium Features:

**Expected Console Logs:**
```
🔍 Store loaded: {plan: "premium", ...}
📋 Store plan: premium
📋 Store plan === "trial": false
📋 Store plan === "pro": false
📋 Store plan === "premium": true ← THIS!
```

**Expected UI:**
- Badge: "👑 Premium" (gold/orange gradient)
- Dashboard Analytics card: "📊 Advanced Analytics" (NOT locked)
- Click Analytics → Should show:
  - Header: "Advanced Analytics with Charts"
  - ALL metrics
  - Daily Revenue Chart (bar chart)
  - Monthly Revenue Chart (line chart)
  - Top 5 Best Sellers list
  - NO upgrade prompts
- Web Templates: All 5 templates unlocked
- Settings: Custom domain option available

---

## 🐛 Troubleshooting

### Issue: "I updated the database but nothing changed"

**Solution:**
- You MUST log out and log back in
- React state is cached - refreshing page might not be enough
- Use incognito mode to test with clean state

### Issue: "Console still shows trial even after update"

**Check:**
1. Did you actually UPDATE the database? Run: `SELECT plan FROM stores;`
2. Are you logged into the SAME account you updated?
3. Did you log out COMPLETELY and log back in?

### Issue: "Badge shows correct plan but dashboard is wrong"

**This means:**
- Badge logic is working (reads from storeInfo.plan)
- Dashboard logic might have an issue

**Debug:**
1. Check console for: `🎯 Current plan from storeInfo: ???`
2. If it shows correct plan but wrong dashboard, there's a bug in getDashboardForPlan()
3. Share the console logs

### Issue: "Everything shows trial no matter what"

**Solution:**
1. Run: `SELECT id, email FROM auth.users;` - Get your user ID
2. Run: `SELECT owner_id, plan FROM stores;` - Verify owner_id matches
3. You might be logged into a different account than you think!

---

## ✅ Success Criteria

After testing all three plans, you should have:

| Plan | Badge | Analytics Title | Analytics Access | Templates | Product Limit |
|------|-------|----------------|------------------|-----------|---------------|
| Trial | 📦 Starter (gray) | 📊 Analytics 🔒 | Locked → Settings | 1 | 30 |
| Pro | 🚀 Pro (purple) | 📊 Basic Analytics | Numbers only | 3 | Unlimited |
| Premium | 👑 Premium (gold) | 📊 Advanced Analytics | Full charts | 5+ | Unlimited |

---

## 🎬 Quick Test Script

Run these commands in order:

```sql
-- 1. TEST TRIAL
UPDATE stores SET plan = 'trial', plan_expires_at = NOW() + INTERVAL '7 days' WHERE TRUE;
-- Logout, login → Should see Starter

-- 2. TEST PRO
UPDATE stores SET plan = 'pro', plan_expires_at = NULL WHERE TRUE;
-- Logout, login → Should see Pro

-- 3. TEST PREMIUM
UPDATE stores SET plan = 'premium', plan_expires_at = NULL WHERE TRUE;
-- Logout, login → Should see Premium
```

After EACH update:
1. Run the UPDATE
2. Logout (click Logout button)
3. Close browser tab
4. Open new tab
5. Login
6. Check console logs
7. Check badge
8. Check dashboard
9. Click Analytics
10. Verify features

---

## 📸 What I Need to See

If it's STILL not working, send me screenshots of:

1. **Supabase Query Results:**
   ```sql
   SELECT id, name, plan, plan = 'premium' as is_premium FROM stores;
   ```

2. **Browser Console** showing:
   - `🔍 Store loaded:`
   - `📋 Store plan:`
   - `📋 Store plan === "premium":`

3. **Dashboard Screenshot** showing:
   - Badge at top right
   - Analytics card title
   - Whether Analytics has lock icon

4. **Which account email** you're logged in as

This will help me pinpoint the EXACT issue!
