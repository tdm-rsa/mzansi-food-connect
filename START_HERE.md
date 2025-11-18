# 🚀 START HERE - Complete Reset Instructions

## The Problem
Pro and Premium badges not showing correctly. Let's fix this properly from scratch.

## Solution: Fresh Start (3 Simple Steps)

### Step 1: Run DIAGNOSE.sql First
This will show us what's currently in your database.

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy ALL contents of `DIAGNOSE.sql`
3. Paste and click **Run**
4. **Take a screenshot** or copy the results

This will show:
- What columns exist in stores table
- Current plan values
- Whether plan column exists

### Step 2: Run FRESH_START.sql
This completely resets everything with correct structure.

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy ALL contents of `FRESH_START.sql`
3. Paste and click **Run**
4. Should see: "SUCCESS: Database reset complete!"

### Step 3: Test the App

1. **Close your app completely**
2. **Hard refresh browser**: `Ctrl + Shift + R`
3. **Go to signup page**
4. **Create NEW account** with any email (e.g., test@test.com)
5. **Check the badge** at top right

**Should see:**
- Badge text: "📦 Starter"
- Badge color: Gray gradient
- Templates: Only 1 (Modern Food)
- Analytics: Locked

---

## After Fresh Start - Test Plans

Once you have a new account, test different plans:

### Test PRO Plan:
```sql
-- Run in Supabase SQL Editor
UPDATE stores SET plan = 'pro', plan_expires_at = NULL;
```

Then refresh browser (`Ctrl + Shift + R`). Should see:
- Badge: "🚀 Pro" (purple)
- Templates: 3 unlocked
- Analytics: Accessible (basic)

### Test PREMIUM Plan:
```sql
-- Run in Supabase SQL Editor
UPDATE stores SET plan = 'premium', plan_expires_at = NULL;
```

Then refresh browser. Should see:
- Badge: "👑 Premium" (gold)
- Templates: 5 unlocked
- Analytics: Accessible (advanced with charts)

---

## If Still Not Working

Open browser console (F12) and look for these logs:
```
🔍 Store loaded: {...}
📋 Store plan: ???
🎯 Current plan from storeInfo: ???
✨ Plan features: {...}
```

**Tell me:**
1. What does `📋 Store plan:` show?
2. What badge do you see?
3. How many templates are unlocked?

With this info, I can fix the exact issue!

---

## Files Overview

- `DIAGNOSE.sql` - Shows current database state
- `FRESH_START.sql` - Complete reset with correct structure
- `SET_TO_PRO.sql` - Quick command to test Pro plan
- `SET_TO_PREMIUM.sql` - Quick command to test Premium plan
- This file - Instructions

Run them in this order:
1. DIAGNOSE.sql (optional, to see current state)
2. FRESH_START.sql (required, resets everything)
3. Create new account in app
4. SET_TO_PRO.sql or SET_TO_PREMIUM.sql (to test)

