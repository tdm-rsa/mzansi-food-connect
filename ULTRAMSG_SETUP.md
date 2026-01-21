# Ultramsg WhatsApp Setup Instructions

## ✅ What I've Done

1. **Count Badges**: Already working on all dashboards (Pro, Premium, Starter)
   - Orders badge shows count of new orders
   - Messages badge shows count of new customer messages

2. **WhatsApp Notifications for Customer Questions**:
   - When customer asks about a product → Vendor gets WhatsApp notification
   - When customer sends general question → Vendor gets WhatsApp notification
   - Vendor needs to add their WhatsApp number in Settings

3. **Code deployed to GitHub** (Vercel will auto-deploy)

## ⚠️ IMPORTANT: Set Ultramsg Credentials in Supabase

The WhatsApp messages won't work until you add these environment variables to your Supabase Edge Functions:

### Your Ultramsg Credentials:
- **Instance ID**: `instance149315`
- **Token**: `y0de2bh0bhypai9x`
- **API URL**: `https://api.ultramsg.com/instance149315/`

### Steps to Add Credentials to Supabase:

1. Go to https://supabase.com/dashboard/project/iuuckvthpmttrsutmvga/settings/functions
2. Scroll to "Environment variables"
3. Click "Add new secret"
4. Add these TWO variables:

   **Variable 1:**
   - Name: `VITE_ULTRAMSG_INSTANCE_ID`
   - Value: `instance149315`

   **Variable 2:**
   - Name: `VITE_ULTRAMSG_TOKEN`
   - Value: `ax6ijvrx2w0cbt53`

5. Click "Save" or "Apply"
6. Redeploy your edge functions (they'll pick up the new variables)

### Test It:

1. Go to Settings → Add your vendor WhatsApp number (format: 27XXXXXXXXX)
2. Have a customer ask a question about a product
3. You should receive a WhatsApp message!

## 📝 Notes

- The `send-whatsapp` edge function uses these credentials
- If messages aren't sending, check Supabase function logs
- Credentials are already in `.env.local` but Supabase edge functions need them set separately
