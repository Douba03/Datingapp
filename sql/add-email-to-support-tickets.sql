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
