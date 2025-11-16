-- TEST: Fetch KFC store data with instructions and notes
-- This will show exactly what data Supabase returns

SELECT
  id,
  name,
  slug,
  show_instructions,
  instructions,
  show_notes,
  notes
FROM stores
WHERE name = 'KFC'
LIMIT 1;

-- If this returns NULL for the new columns, they weren't added properly
-- If this returns data, then the issue is in the JavaScript fetch
