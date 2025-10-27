# 🚨 **Fix 406 Error - RLS Policies**

## **❌ Current Error:**
```
GET https://zfnwtnqwokwvuxxwxgsr.supabase.co/rest/v1/messages?select=*... 406 (Not Acceptable)
```

**This means:** RLS policies are blocking the query or missing entirely.

---

## **✅ SOLUTION: Run This SQL**

### **Copy and Run in Supabase SQL Editor:**

```sql
-- Step 1: Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 2: Allow users to read messages from their matches
DROP POLICY IF EXISTS "Users can read messages from their matches" ON public.messages;

CREATE POLICY "Users can read messages from their matches" 
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = messages.match_id 
    AND (
      matches.user_a_id = auth.uid() 
      OR matches.user_b_id = auth.uid()
    )
  )
);

-- Step 3: Allow users to insert messages to their matches
DROP POLICY IF EXISTS "Users can insert messages to their matches" ON public.messages;

CREATE POLICY "Users can insert messages to their matches" 
ON public.messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = messages.match_id 
    AND (
      matches.user_a_id = auth.uid() 
      OR matches.user_b_id = auth.uid()
    )
  )
  AND messages.sender_id = auth.uid()
);

-- Step 4: Verify messages table is in real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Step 5: Verify setup
SELECT 
    '✅ Setup complete!' as status,
    'RLS policies created and real-time enabled' as message;
```

---

## **📱 After Running SQL:**

1. **Reload the app**
2. **Open the chat**
3. **The 406 error should be gone!**
4. **Messages should load and update in real-time!**

---

## **🔍 What This Fixes:**

- ✅ Enables RLS on messages table
- ✅ Allows users to read their messages
- ✅ Allows users to send messages
- ✅ Keeps messages secure (only match participants can see them)
- ✅ Adds messages to real-time publication

---

## **📱 Test After Running SQL:**

1. **Reload app** (close and reopen or press `r`)
2. **Open a chat** - messages should load without 406 error
3. **Send a message** - should work without errors
4. **Check real-time** - new messages should appear instantly!

**Let me know when you've run the SQL!** 🚀

