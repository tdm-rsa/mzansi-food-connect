-- Set up daily cron job to check plan expiries and send reminder emails
-- Runs every day at 7 AM UTC (9 AM SAST)

-- Enable pg_cron extension (required for scheduling)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions to postgres role to use pg_cron
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create the cron job
SELECT cron.schedule(
  'check-plan-expiry-daily',           -- Job name
  '0 7 * * *',                         -- Every day at 7 AM UTC (9 AM SAST)
  $$
  SELECT
    net.http_post(
      url := 'https://iuuckvthpmttrsutmvga.supabase.co/functions/v1/check-plan-expiry',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dWNrdnRocG10dHJzdXRtdmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwNjYwNTAsImV4cCI6MjA0NTY0MjA1MH0.RGZm4_gj9IUYhN5TM4V5Xn-PJWOkbOcN41eAaEMXsVU'
      ),
      body := jsonb_build_object('source', 'cron')
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'check-plan-expiry-daily';

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used for daily plan expiry checks';
