-- Function to check if an email exists in the system
-- This function can be called from the client side safely

CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if the email exists in auth.users table
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = email_to_check
  ) INTO user_exists;
  
  RETURN user_exists;
END;
$$;

-- Grant access to the function for authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated, anon;
