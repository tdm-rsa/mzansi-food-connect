# ⚠️ CRITICAL: Database Migration Required

## Problem
If you're seeing:
- All users showing "Starter" badge (even Pro/Premium)
- Analytics not accessible for Pro/Premium users
- Templates locked for Pro/Premium users

This means the `plan` column doesn't exist in your `stores` table yet.

## Solution: Run Database Migration

### Option 1: If you have an EXISTING stores table (RECOMMENDED)
Run this in **Supabase SQL Editor**:

```sql
-- Add plan columns to existing stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS domain_status TEXT DEFAULT 'none';

-- Set trial expiration for existing trial users (7 days from now)
UPDATE stores
SET plan_expires_at = NOW() + INTERVAL '7 days'
WHERE plan = 'trial' AND plan_expires_at IS NULL;

-- Verify the migration
SELECT id, name, plan, plan_started_at, plan_expires_at
FROM stores
LIMIT 10;
```

### Option 2: If you want to START FRESH (⚠️ DELETES ALL DATA)
Run `FINAL_SIGNUP_FIX.sql` which drops and recreates the entire stores table.

## After Running Migration

1. **Refresh your app** in the browser
2. **Check browser console** for these logs:
   - `🔍 Store loaded:` - should show plan column
   - `📋 Store plan:` - should show 'trial', 'pro', or 'premium'
   - `🎯 Current plan from storeInfo:` - should match your actual plan
   - `✨ Plan features:` - should show correct features for your plan

3. **Test plan features**:
   - Badge should show correct plan (Starter/Pro/Premium)
   - Analytics should be accessible based on plan
   - Templates should unlock based on plan

## Manual Plan Assignment (For Testing)

If you want to test Pro or Premium features without payment:

```sql
-- Set a store to Pro plan
UPDATE stores
SET plan = 'pro',
    plan_started_at = NOW()
WHERE owner_id = 'YOUR_USER_ID';

-- Set a store to Premium plan
UPDATE stores
SET plan = 'premium',
    plan_started_at = NOW()
WHERE owner_id = 'YOUR_USER_ID';

-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';
```

## Troubleshooting

### Still showing "Starter" for all plans?
1. Open browser console (F12)
2. Look for the debug logs
3. Check if `plan` value is actually coming through
4. If plan is `null` or `undefined`, the migration didn't work

### Analytics still locked?
- Check console log: `✨ Plan features:`
- Should show `hasAnalytics: true` for Pro/Premium
- If false, then plan detection is failing

### Templates still locked?
- Check console log: `✨ Plan features:`
- Should show correct templates array for your plan:
  - Trial: `['Modern Food']`
  - Pro: `['Modern Food', 'Traditional SA', 'Fast Mobile']`
  - Premium: All 5 templates

## Next Steps After Migration

1. Remove the debug console.log statements (optional, for cleaner logs)
2. Test signup flow with each plan
3. Configure Paystack payment links in Settings
4. Set up trial expiration reminders
