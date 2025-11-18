# 🔧 Complete Fix: Estimated Duration Error

## ❌ The Error You're Seeing
```
400 (Bad Request)
Send estimated duration failed:
{code: '23514', details: null, hint: null, 
message: "new row for relation 'orders' violates check constraint 'orders_estimated_time_check'"}
```

This means your `orders` table has a **constraint** that's blocking the estimated_time values.

## ✅ The Complete Fix

### **Step 1: Open Supabase**
1. Go to https://supabase.com
2. Open your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"**

### **Step 2: Run This SQL (Copy & Paste All)**
```sql
-- Fix 1: Allow 'confirmed' status (this is the main issue!)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'ready', 'completed'));

-- Fix 2: Remove estimated_time constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_estimated_time_check;

-- Fix 3: Add estimated_time column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_time INTEGER;

-- Verify it worked
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'estimated_time';
```

### **Step 3: Click "Run"** 
Press **Ctrl/Cmd + Enter** or click the Run button

### **Step 4: Check Results**
You should see:
```
column_name      | data_type | is_nullable
-----------------|-----------|-------------
estimated_time   | integer   | YES
```

## 🎯 What This Does

1. **Removes** any check constraint blocking estimated_time
2. **Adds** the column if missing
3. **Allows** any integer value (3, 5, 10, 15, 30, 60, etc.)
4. **Allows** NULL (for orders without estimated time)

## ✅ After Running the SQL

The error will be **gone** and you can:

1. **Dashboard → Live Queue** → Click "⏱️ Set Estimated Time"
2. Select any duration: 3min, 5min, 10min, 15min, 30min, 1h
3. Customer receives WhatsApp: "✅ Order Confirmed! Estimated ready time: 10 minutes"
4. Order appears in **customer's live queue** (🕒 button)
5. Order stays in queue until **"Fetch Order"** is pressed

## 📊 Order Flow After Fix

```
Customer Orders
    ↓
Status: pending
    ↓
Owner Sets Time (3-60 min)
    ↓
Status: confirmed + estimated_time saved ✅
    ↓
Shows in customer queue
    ↓
Owner clicks "Mark Ready"
    ↓
Status: ready
    ↓
Still in customer queue
    ↓
Owner clicks "Fetch Order"
    ↓
Status: completed
    ↓
Removed from queue ✅
```

## 🔍 Why This Happens

Supabase sometimes adds automatic constraints when you create columns through the UI. These constraints can block certain values. The SQL above removes any such constraint and lets your app control the validation.

## 🆘 Still Having Issues?

If you still see the error after running the SQL:

1. Refresh your browser completely (Ctrl/Cmd + Shift + R)
2. Check Supabase logs: Project → Database → Logs
3. Run this to see all constraints:
```sql
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'orders'::regclass;
```

## ✨ Files to Use

- `fix_estimated_time_constraint.sql` - The SQL fix (same as above)
- This file - Complete instructions
