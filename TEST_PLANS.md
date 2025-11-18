# 🧪 Testing Different Plans

## Current Problem
You're seeing "Starter" badge and only 1 template even though you should see different plans.

## Step-by-Step Testing

### 1. Check Browser Console First
Open browser console (F12) and look for these logs:
```
🔍 Store loaded: {plan: "???", ...}
📋 Store plan: ???
🎯 Current plan from storeInfo: ???
✨ Plan features: {hasAnalytics: ???, templates: [...]}
```

**What the plan value should be:**
- If it shows `trial` → You should see "Starter" badge (correct)
- If it shows `pro` → You should see "Pro" badge (if seeing Starter, there's a bug)
- If it shows `premium` → You should see "Premium" badge (if seeing Starter, there's a bug)
- If it shows `undefined` or `null` → Database issue, plan column missing

---

### 2. Test PRO Plan

**Run in Supabase SQL Editor:**
```sql
-- Copy contents of SET_TO_PRO.sql
```

**Expected Results After Refresh:**
- ✅ Badge shows: **🚀 Pro**
- ✅ Badge color: Purple gradient
- ✅ Analytics: Accessible (basic - numbers only)
- ✅ Templates: 3 available (Modern Food, Traditional SA, Fast Mobile)
- ✅ Products: Unlimited
- ✅ Console log shows: `plan: "pro"`

**If you still see "Starter":**
- Check console log for actual plan value
- If plan is "pro" but badge shows "Starter" → Code bug
- If plan is "trial" → Database didn't update

---

### 3. Test PREMIUM Plan

**Run in Supabase SQL Editor:**
```sql
-- Copy contents of SET_TO_PREMIUM.sql
```

**Expected Results After Refresh:**
- ✅ Badge shows: **👑 Premium**
- ✅ Badge color: Gold/orange gradient
- ✅ Analytics: Accessible (advanced - with charts)
- ✅ Templates: 5 available (all templates unlocked)
- ✅ Products: Unlimited
- ✅ Console log shows: `plan: "premium"`

---

### 4. Debugging Steps

#### If Badge Always Shows "Starter":

1. **Check Console Logs:**
   ```
   Look for: 📋 Store plan: ???
   ```

2. **If plan shows "trial":**
   - The badge is correct
   - You need to run SET_TO_PRO.sql or SET_TO_PREMIUM.sql
   - Then refresh browser

3. **If plan shows "pro" but badge says "Starter":**
   - There's a bug in the badge code
   - Tell me and I'll fix it

4. **If plan shows undefined/null:**
   - Database column missing
   - Run RUN_THIS.sql to reset everything

#### If Templates Are Still Locked:

1. **Check Console:**
   ```
   Look for: ✨ Plan features: {templates: [...]}
   ```

2. **What you should see:**
   - Trial: `templates: ['Modern Food']`
   - Pro: `templates: ['Modern Food', 'Traditional SA', 'Fast Mobile']`
   - Premium: `templates: [...5 templates]`

3. **If templates array is wrong:**
   - The planFeatures.js is being read incorrectly
   - Tell me the exact console output

---

## Quick Test Commands

### Check Current Plan in Database:
```sql
SELECT id, name, plan FROM stores;
```

### Set to PRO:
```sql
UPDATE stores SET plan = 'pro' WHERE TRUE;
```

### Set to PREMIUM:
```sql
UPDATE stores SET plan = 'premium' WHERE TRUE;
```

### Set back to TRIAL:
```sql
UPDATE stores SET plan = 'trial', plan_expires_at = NOW() + INTERVAL '7 days' WHERE TRUE;
```

---

## What To Tell Me

If it's still not working, please tell me:

1. **What does console show for:**
   - `📋 Store plan: ???`
   - `🎯 Current plan from storeInfo: ???`
   - `✨ Plan features: ???`

2. **What you're seeing:**
   - Badge text: "Starter" / "Pro" / "Premium"
   - Badge color: Gray / Purple / Gold
   - How many templates are unlocked: 1 / 3 / 5
   - Can you access Analytics: Yes / No

3. **What you expect:**
   - Pro: Purple badge, 3 templates, basic analytics
   - Premium: Gold badge, 5 templates, advanced analytics

With this info, I can pinpoint exactly where the issue is!
