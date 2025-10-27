-- Fix RLS Policies for Messages Table (Skip publication - already added)
-- Run this if messages is already in real-time publication

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

-- Step 4: Verify the setup
SELECT 
    '✅ RLS policies created!' as status,
    'Messages table should now work properly' as message;

