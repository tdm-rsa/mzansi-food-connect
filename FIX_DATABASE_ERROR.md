# 🔧 Fix: "estimated_time column does not exist" Error

## ❌ The Error
```
400 (Bad Request)
estimated duration failed:
{code: 'PGRST204', details: 'Results contain 0 rows, application/vnd.pgrst.object+json requires 1 row', 
hint: null, message: 'The result contains 0 rows'}
ERROR: column "estimated_time" of relation "orders" does not exist
```

## ✅ The Fix

You need to add the `estimated_time` column to your `orders` table in Supabase.

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Open your project

2. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run This SQL:**
   ```sql
   ALTER TABLE orders 
   ADD COLUMN IF NOT EXISTS estimated_time INTEGER;

   COMMENT ON COLUMN orders.estimated_time IS 'Estimated preparation time in minutes';
   ```

4. **Click "Run"** (or press Ctrl/Cmd + Enter)

5. **Verify** it worked:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'orders' AND column_name = 'estimated_time';
   ```

   You should see:
   ```
   column_name      | data_type
   -----------------|-----------
   estimated_time   | integer
   ```

## 🎯 What This Does

Adds a new column to store the estimated preparation time in **minutes** for each order:
- `3` = 3 minutes
- `10` = 10 minutes  
- `60` = 1 hour
- etc.

## ✅ After Running the SQL

The error will disappear and you'll be able to:
1. Click "⏱️ Set Estimated Time" on pending orders
2. Select duration (3, 5, 10, 15, 30, 60 minutes)
3. Send WhatsApp confirmation to customer
4. See "✅ Confirmed - 10min" badge on confirmed orders

## 📂 SQL File Location

You can also find this SQL in:
`add_estimated_time_column.sql`
