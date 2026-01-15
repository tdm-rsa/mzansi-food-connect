-- Check RLS policies for notifications and general_questions tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('notifications', 'general_questions')
ORDER BY tablename, policyname;

-- Check if RLS is enabled on these tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('notifications', 'general_questions');

-- Check realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('notifications', 'general_questions', 'orders')
ORDER BY tablename;
