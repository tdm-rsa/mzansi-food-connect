-- Enable Realtime for notifications and badge counts
-- This allows the dashboard to receive instant updates when orders/messages arrive

-- Enable realtime on orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime on notifications table (customer product questions)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime on general_questions table (general customer inquiries)
ALTER PUBLICATION supabase_realtime ADD TABLE public.general_questions;

-- Verify realtime is enabled
COMMENT ON TABLE public.orders IS 'Orders table with realtime enabled for instant notifications';
COMMENT ON TABLE public.notifications IS 'Customer messages with realtime enabled for instant badge updates';
COMMENT ON TABLE public.general_questions IS 'General questions with realtime enabled for instant notifications';
