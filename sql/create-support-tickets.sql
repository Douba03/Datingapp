-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'account', 'billing', 'safety', 'feedback', 'other')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create support_ticket_messages table for conversation history
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created_at ON public.support_ticket_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own tickets
CREATE POLICY "Users can create own tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own open tickets (to add more info)
CREATE POLICY "Users can update own open tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'open')
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for support_ticket_messages

-- Users can view messages for their own tickets
CREATE POLICY "Users can view messages for own tickets"
  ON public.support_ticket_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

-- Users can create messages for their own tickets
CREATE POLICY "Users can create messages for own tickets"
  ON public.support_ticket_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
    AND user_id = auth.uid()
    AND is_admin = FALSE
  );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_timestamp();

-- Create a function to update ticket status when a new message is added
CREATE OR REPLACE FUNCTION update_ticket_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- If user sends a message and ticket is resolved/closed, reopen it
  IF NEW.is_admin = FALSE THEN
    UPDATE public.support_tickets
    SET 
      status = CASE 
        WHEN status IN ('resolved', 'closed') THEN 'open'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = NEW.ticket_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS update_ticket_on_message ON public.support_ticket_messages;
CREATE TRIGGER update_ticket_on_message
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_on_new_message();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT ON public.support_ticket_messages TO authenticated;

-- Create a view for admin dashboard (with user info)
CREATE OR REPLACE VIEW public.support_tickets_with_user AS
SELECT 
  st.id,
  st.user_id,
  st.subject,
  st.category,
  st.message,
  st.status,
  st.priority,
  st.admin_notes,
  st.resolved_by,
  st.resolved_at,
  st.created_at,
  st.updated_at,
  p.first_name,
  p.photos,
  u.email,
  (
    SELECT COUNT(*)
    FROM public.support_ticket_messages stm
    WHERE stm.ticket_id = st.id
  ) as message_count,
  (
    SELECT MAX(created_at)
    FROM public.support_ticket_messages stm
    WHERE stm.ticket_id = st.id
  ) as last_message_at
FROM public.support_tickets st
LEFT JOIN auth.users u ON st.user_id = u.id
LEFT JOIN public.profiles p ON st.user_id = p.user_id
ORDER BY st.created_at DESC;

COMMENT ON TABLE public.support_tickets IS 'Support tickets submitted by users';
COMMENT ON TABLE public.support_ticket_messages IS 'Messages/conversation history for support tickets';
COMMENT ON VIEW public.support_tickets_with_user IS 'Support tickets with user information for admin dashboard';

