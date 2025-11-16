-- Fix notifications table: Add missing columns
-- Date: 2025-11-02
-- Purpose: Add response, status, and customer_phone columns to notifications table

-- Add customer_phone column
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add response column (for store owner replies)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS response TEXT;

-- Add status column (pending/replied)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add index for status lookups
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
