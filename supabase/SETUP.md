# Supabase Setup Guide

This guide walks you through setting up the email reminder system and cron jobs for plan expiry notifications.

## 1. Database Setup

### Run the Migration

Execute the migration to create the email tracking table:

1. Open your Supabase dashboard: https://app.supabase.com
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/001_create_expiry_emails_table.sql`
4. Click **Run**

Or use Supabase CLI:
```bash
supabase db push
```

## 2. Email Service Setup (Resend)

### Get Resend API Key

1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Go to **API Keys** section
3. Create a new API key
4. Copy the key (starts with `re_`)

### Add Domain (Optional but Recommended)

1. In Resend dashboard, go to **Domains**
2. Add `mzansifoodconnect.app`
3. Add the DNS records to your domain provider
4. Verify the domain

### Set Environment Variable in Supabase

1. Go to Supabase Dashboard → **Settings** → **Edge Functions**
2. Add a new secret:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (e.g., `re_123abc...`)
3. Click **Save**

## 3. Deploy Edge Function

### Deploy the expiry checker function:

```bash
cd mzansi-food-connect
npx supabase functions deploy check-plan-expiry
```

### Verify deployment:
1. Go to Supabase Dashboard → **Edge Functions**
2. You should see `check-plan-expiry` listed

## 4. Enable Email Sending in Function

The email sending code is currently commented out. Once you've set up Resend:

1. Open `supabase/functions/check-plan-expiry/index.ts`
2. Find the commented section (around line 119):
   ```typescript
   // TODO: Integrate with your email provider here
   ```
3. Uncomment the Resend API code:
   ```typescript
   const resendApiKey = Deno.env.get("RESEND_API_KEY");
   await fetch("https://api.resend.com/emails", {
     method: "POST",
     headers: {
       "Authorization": `Bearer ${resendApiKey}`,
       "Content-Type": "application/json"
     },
     body: JSON.stringify({
       from: "Mzansi Food Connect <noreply@mzansifoodconnect.app>",
       to: userEmail,
       subject: subject,
       html: html
     })
   });
   ```
4. Redeploy the function

## 5. Set Up Daily Cron Job

### Option A: Using Supabase pg_cron (Recommended)

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this SQL to create a daily cron job at 9 AM SAST:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job that runs daily at 9 AM SAST (7 AM UTC)
SELECT cron.schedule(
  'check-plan-expiry-daily',
  '0 7 * * *', -- 7 AM UTC = 9 AM SAST
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/check-plan-expiry',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := jsonb_build_object('cron', true)
    ) as request_id;
  $$
);
```

**Replace:**
- `YOUR_PROJECT_ID` with your actual Supabase project ID
- `YOUR_ANON_KEY` with your Supabase anon key (from Settings → API)

### Option B: Using External Cron Service (Alternative)

If pg_cron isn't available on your plan, use a service like:

1. **Cron-job.org** (free)
   - URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/check-plan-expiry`
   - Schedule: `0 7 * * *` (daily at 7 AM UTC)
   - Add header: `Authorization: Bearer YOUR_ANON_KEY`

2. **GitHub Actions** (free)
   - Create `.github/workflows/check-expiry.yml`:
   ```yaml
   name: Check Plan Expiry
   on:
     schedule:
       - cron: '0 7 * * *' # 9 AM SAST
   jobs:
     check-expiry:
       runs-on: ubuntu-latest
       steps:
         - name: Call Supabase function
           run: |
             curl -X POST \
               https://YOUR_PROJECT_ID.supabase.co/functions/v1/check-plan-expiry \
               -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

## 6. Test the Setup

### Manual Test

Trigger the function manually to test:

```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/check-plan-expiry \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Verify Email Tracking

Check the database to see logged emails:

```sql
SELECT * FROM expiry_emails_sent ORDER BY sent_at DESC LIMIT 10;
```

## 7. Monitor and Debug

### View Function Logs

1. Go to Supabase Dashboard → **Edge Functions**
2. Click on `check-plan-expiry`
3. Click **Logs** tab
4. Check for any errors or successful email sends

### Check Cron Job Status (pg_cron)

```sql
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Email Schedule Summary

| Days Until Expiry | Email Type | Subject |
|------------------|------------|---------|
| 7 days | `7_day_reminder` | "Your Pro plan renews in 7 days" |
| 3 days | `3_day_reminder` | "⚠️ Pro plan expires in 3 days - Action Required" |
| 0 days (expired) | `expired` | "❌ Your Pro plan has expired" |
| -1 day (grace) | `grace_day_1` | "⏰ Final Warning: Pro access ends in 2 days" |
| -2 days (grace) | `grace_day_2` | "🚨 Last Chance: Pro access ends tomorrow" |
| -3 days (grace) | `grace_day_3_final` | "❌ FINAL NOTICE: Pro access ends today" |

## Troubleshooting

### Emails not sending?
- Check `RESEND_API_KEY` is set in Supabase Edge Functions secrets
- Verify email sending code is uncommented
- Check function logs for errors

### Duplicate emails?
- Check `expiry_emails_sent` table is created
- Verify the date check logic is working

### Cron not running?
- Verify cron job is created: `SELECT * FROM cron.job;`
- Check timezone is correct (7 AM UTC = 9 AM SAST)
- Look at `cron.job_run_details` for errors

## Next Steps

1. ✅ Run the database migration
2. ✅ Sign up for Resend and get API key
3. ✅ Add `RESEND_API_KEY` to Supabase secrets
4. ✅ Deploy the Edge Function
5. ✅ Uncomment email sending code and redeploy
6. ✅ Set up daily cron job
7. ✅ Test manually
8. ✅ Monitor logs for first 24-48 hours
