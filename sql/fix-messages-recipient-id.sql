-- Fix messages table to add recipient_id column
-- This is needed for push notifications to work

-- Add recipient_id column to messages table if it doesn't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id);

-- Create index for recipient_id for better performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);

-- Update existing messages to have recipient_id (optional)
-- This will set recipient_id for existing messages based on match data
UPDATE public.messages 
SET recipient_id = CASE 
  WHEN sender_id = m.user_a_id THEN m.user_b_id
  ELSE m.user_a_id
END
FROM public.matches m
WHERE messages.match_id = m.id 
AND messages.recipient_id IS NULL;
