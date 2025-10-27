# 🚨 URGENT: Run SQL Migration to Fix Support Tickets

## ❌ **Current Error:**
```
Could not find the 'email' column of 'support_tickets' in the schema cache
```

## ✅ **Solution: Add Email Column to Database**

### 📋 **Step-by-Step Instructions:**

### 1. **Open Supabase Dashboard**
- Go to: https://supabase.com/dashboard
- Select your project
- Click on **"SQL Editor"** in the left sidebar

### 2. **Run This SQL Script**
Copy and paste this **EXACT** code into the SQL Editor:

```sql
-- Add email field to support_tickets table
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email validation constraint
ALTER TABLE public.support_tickets 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Create index for email field
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON public.support_tickets(email);

-- Update the view to include email
CREATE OR REPLACE VIEW public.support_tickets_with_user AS
SELECT 
  st.*,
  u.email as user_email,
  u.created_at as user_created_at,
  p.first_name,
  p.last_name
FROM public.support_tickets st
LEFT JOIN auth.users u ON st.user_id = u.id
LEFT JOIN public.profiles p ON st.user_id = p.user_id;
```

### 3. **Click "Run" Button**
- Click the **"Run"** button in the SQL Editor
- Wait for it to complete (should show "Success" message)

### 4. **Test the Support Ticket Form**
- Go to: http://localhost:8082
- Navigate to: Settings → Help & Support
- Try submitting a ticket with email

---

## 🔍 **How to Verify It Worked:**

### Check in Supabase Dashboard:
1. Go to **"Table Editor"**
2. Click on **"support_tickets"** table
3. You should see a new **"email"** column

### Or Run This Query:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'support_tickets' 
AND table_schema = 'public';
```

---

## ⚠️ **Important Notes:**

- **Don't skip this step** - the app won't work without the database column
- **Run the SQL exactly as written** - don't modify it
- **Wait for completion** - don't close the browser until it's done

---

## 🎯 **After Running the Migration:**

✅ Support ticket form will work
✅ Email validation will work  
✅ Admin dashboard will show emails
✅ No more database errors

---

**This is the ONLY way to fix the error. The database needs the email column before the app can use it!** 🚀
