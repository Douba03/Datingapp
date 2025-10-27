-- Fix RLS Policies for Messages Table
-- The 406 error suggests RLS policies or publication issues

-- Step 1: Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policy to allow users to read messages from their matches
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

-- Step 3: Create policy to allow users to insert messages to their matches
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

-- Step 4: Add messages to real-time publication (verify it's there)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Step 5: Verify the setup
SELECT 
    'Setup complete' as status,
    'RLS policies created and real-time enabled' as message;

