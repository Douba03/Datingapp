import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Checks if an email exists in the database by querying the users table
 * This is a reliable method that works with existing RLS policies
 * 
 * @param supabase Supabase client
 * @param email Email to check
 * @returns Promise<boolean> True if email exists, false otherwise
 */
export const checkEmailExists = async (
  supabase: SupabaseClient,
  email: string
): Promise<boolean> => {
  try {
    console.log(`Checking if email exists: ${email}`);
    
    // Try querying the public.users table directly
    // The users table has an email column
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    
    console.log('Users table query result:', { userData, userError });
    
    if (!userError && userData) {
      console.log('Email found in users table');
      return true;
    }
    
    // If querying users table doesn't work, try the RPC function
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('check_email_exists', { email_to_check: email });
      
      console.log('RPC function result:', { rpcData, rpcError });
      
      if (!rpcError && rpcData !== null && rpcData !== undefined) {
        console.log('Email found via RPC function:', rpcData);
        return Boolean(rpcData);
      }
    } catch (rpcError) {
      console.log('RPC function not available or failed:', rpcError);
    }
    
    // If all methods fail, assume the email doesn't exist
    console.log('Email not found in database');
    return false;
  } catch (error) {
    console.error('Error checking email existence:', error);
    // In case of an error, assume the email doesn't exist
    return false;
  }
};