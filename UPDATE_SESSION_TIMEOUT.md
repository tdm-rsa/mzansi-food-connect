# How to Increase Session Timeout to 30 Minutes

## Current Situation
By default, Supabase Auth sessions timeout after a period of inactivity. You want to extend this to 30 minutes.

## Solution: Update Supabase Auth Settings

### Step 1: Go to Supabase Dashboard
https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/auth/users

### Step 2: Navigate to Auth Settings
1. Click on **Authentication** in left sidebar
2. Click on **Settings** 
3. Or go directly to: https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/settings/auth

### Step 3: Update JWT Expiry Settings
Look for these settings:

**JWT expiry limit (seconds)**
- Default: 3600 (1 hour)
- Change to: **1800** (30 minutes)

**Refresh token reuse interval (seconds)**
- Default: 10
- Keep as is or adjust if needed

**Note:** Session timeout is controlled by JWT expiry. Setting it to 1800 seconds = 30 minutes means users will be logged out after 30 minutes of inactivity.

### Step 4: Save Changes
Click **Save** to apply the new settings.

## Alternative: Keep Session Active Longer

If you want users to stay logged in for 30 minutes even when ACTIVE (not just idle timeout), consider:

**Increase JWT expiry to longer period:**
- 1 hour = 3600 seconds (default)
- 2 hours = 7200 seconds
- 4 hours = 14400 seconds

Then add refresh token logic in the app to keep session alive during activity.

## Current Code (No Changes Needed)

The current code already handles session refresh automatically via `onAuthStateChange` listener in AppWrapper.jsx. No code changes needed - just update Supabase settings.

## Testing

After updating:
1. Login to dashboard
2. Wait 30 minutes without activity
3. Try to perform an action
4. You should be automatically logged out and redirected to login

Or for shorter testing:
1. Set JWT expiry to 60 seconds (1 minute)
2. Test that logout happens after 1 minute
3. Change back to 1800 seconds (30 minutes)
