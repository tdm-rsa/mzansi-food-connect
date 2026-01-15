-- Fix message badge by ensuring realtime is enabled for notifications tables
-- This allows instant badge updates when customer messages arrive

-- Drop if exists (in case already added)
DO $$ 
BEGIN
    -- Enable realtime on notifications table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    -- Enable realtime on general_questions table  
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'general_questions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.general_questions;
    END IF;

    -- Enable realtime on orders table (if not already)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
END $$;

-- Verify realtime is enabled
COMMENT ON TABLE public.notifications IS 'Customer product questions - realtime enabled for instant badge updates';
COMMENT ON TABLE public.general_questions IS 'General customer inquiries - realtime enabled for instant notifications';
COMMENT ON TABLE public.orders IS 'Customer orders - realtime enabled for instant notifications';
