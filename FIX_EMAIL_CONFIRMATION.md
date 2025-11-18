# 🔧 FIX: Disable Email Confirmation for Testing

## The Problem:
When you sign up, a store is created with `owner_id = authData.user.id`. But when you login, Supabase might be creating a NEW user session because email isn't confirmed, so the store query fails.

## Solution: Disable Email Confirmation

### Steps:

1. **Go to Supabase Dashboard**
2. **Click on "Authentication" in sidebar**
3. **Click on "Providers"**
4. **Scroll to "Email" provider**
5. **Find "Confirm email" toggle**
6. **TURN IT OFF** (disable it)
7. **Click Save**

This will allow users to login immediately without email confirmation.

---

## Alternative: Manually Confirm All Emails

If you want to keep email confirmation enabled, run this SQL:

```sql
-- Confirm all user emails
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

---

After doing either of these, try:
1. Delete all accounts
2. Signup with Premium
3. Login immediately
4. Should work!
