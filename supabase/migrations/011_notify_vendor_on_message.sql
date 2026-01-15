-- Notify vendors via WhatsApp when they receive customer messages
-- This uses Supabase Edge Functions to send WhatsApp notifications

-- Enable pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to notify vendor when notification is created (product question)
CREATE OR REPLACE FUNCTION notify_vendor_on_notification()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  function_url text;
BEGIN
  -- Build edge function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-vendor-message';

  -- Make async HTTP request to edge function
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'notifications',
      'record', row_to_json(NEW)
    )
  ) INTO request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify vendor when general_question is created
CREATE OR REPLACE FUNCTION notify_vendor_on_general_question()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  function_url text;
BEGIN
  -- Build edge function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-vendor-message';

  -- Make async HTTP request to edge function
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'general_questions',
      'record', row_to_json(NEW)
    )
  ) INTO request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_vendor_notification ON public.notifications;
CREATE TRIGGER trigger_notify_vendor_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_notification();

DROP TRIGGER IF EXISTS trigger_notify_vendor_general_question ON public.general_questions;
CREATE TRIGGER trigger_notify_vendor_general_question
  AFTER INSERT ON public.general_questions
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_general_question();

-- Set required config (you'll need to update these values)
-- Run these in your Supabase SQL Editor:
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://iuuckvthpmttrsutmvga.supabase.co';
-- ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'your_anon_key_here';

COMMENT ON FUNCTION notify_vendor_on_notification() IS 'Sends WhatsApp notification to vendor when customer sends product question';
COMMENT ON FUNCTION notify_vendor_on_general_question() IS 'Sends WhatsApp notification to vendor when customer sends general question';
