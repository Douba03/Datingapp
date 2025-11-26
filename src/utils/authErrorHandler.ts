import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Error codes and messages for authentication
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'Invalid login credentials',
  USER_NOT_FOUND: 'User not found',
  ALREADY_REGISTERED: 'already registered',
  RATE_LIMIT: 'rate limit',
  WEAK_PASSWORD: 'Password should be at least',
  EMAIL_CONFIRMATION: 'Email confirmation',
  NETWORK_ERROR: 'network',
  DATABASE_ERROR: 'Database error',
};

/**
 * Friendly error messages for users
 */
export const FRIENDLY_ERROR_MESSAGES = {
  WRONG_PASSWORD: 'Incorrect password. Please try again or use the forgot password option.',
  EMAIL_NOT_FOUND: 'This email address is not registered. Please sign up instead.',
  ALREADY_REGISTERED: 'This email is already registered. Please sign in instead.',
  RATE_LIMIT: 'Too many login attempts. Please try again later.',
  WEAK_PASSWORD: 'Password is too weak. Please use at least 6 characters with a mix of letters, numbers, and symbols.',
  EMAIL_CONFIRMATION: 'Please check your email to confirm your account before signing in.',
  NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  DATABASE_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An error occurred. Please try again later.',
};

/**
 * Checks if an email exists in the Supabase auth system
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
    // Try to send a password reset to this email
    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://zfnwtnqwokwvuxxwxgsr.supabase.co' }
    );
    
    // If there's an error about the user not found, the email doesn't exist
    if (error && error.message.includes('user not found')) {
      return false;
    }
    
    // If there's no error or a different error, assume the email exists
    return true;
  } catch (error) {
    console.error('Error checking email existence:', error);
    // In case of an error, assume the email might exist
    return true;
  }
};

/**
 * Gets a user-friendly error message for authentication errors
 * 
 * @param error The error object from Supabase
 * @param email The email that was used (optional)
 * @returns A user-friendly error message
 */
export const getAuthErrorMessage = (error: any, email?: string): string => {
  const errorMessage = error?.message || 'Unknown error';
  
  if (errorMessage.includes(AUTH_ERROR_CODES.INVALID_CREDENTIALS)) {
    // We can't determine if it's wrong password or email not found here
    // This requires an async check, so we return a generic message
    return 'Invalid email or password. Please try again.';
  }
  
  if (errorMessage.includes(AUTH_ERROR_CODES.ALREADY_REGISTERED)) {
    return FRIENDLY_ERROR_MESSAGES.ALREADY_REGISTERED;
  }
  
  if (errorMessage.includes(AUTH_ERROR_CODES.RATE_LIMIT)) {
    return FRIENDLY_ERROR_MESSAGES.RATE_LIMIT;
  }
  
  if (errorMessage.includes(AUTH_ERROR_CODES.WEAK_PASSWORD)) {
    return FRIENDLY_ERROR_MESSAGES.WEAK_PASSWORD;
  }
  
  if (errorMessage.includes(AUTH_ERROR_CODES.EMAIL_CONFIRMATION)) {
    return FRIENDLY_ERROR_MESSAGES.EMAIL_CONFIRMATION;
  }
  
  if (errorMessage.toLowerCase().includes(AUTH_ERROR_CODES.NETWORK_ERROR)) {
    return FRIENDLY_ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (errorMessage.includes(AUTH_ERROR_CODES.DATABASE_ERROR)) {
    return FRIENDLY_ERROR_MESSAGES.DATABASE_ERROR;
  }
  
  return errorMessage;
};

/**
 * Handles authentication errors and returns a user-friendly message
 * This version handles the async email existence check
 * 
 * @param supabase Supabase client
 * @param error The error object from Supabase
 * @param email The email that was used
 * @param callback Function to call with the user-friendly error message
 */
export const handleAuthError = async (
  supabase: SupabaseClient,
  error: any,
  email: string,
  callback: (message: string) => void
): Promise<void> => {
  const errorMessage = error?.message || 'Unknown error';
  
  if (errorMessage.includes(AUTH_ERROR_CODES.INVALID_CREDENTIALS)) {
    // Check if the email exists to determine if it's a wrong password or non-existent email
    const emailExists = await checkEmailExists(supabase, email);
    
    if (emailExists) {
      callback(FRIENDLY_ERROR_MESSAGES.WRONG_PASSWORD);
    } else {
      callback(FRIENDLY_ERROR_MESSAGES.EMAIL_NOT_FOUND);
    }
    return;
  }
  
  // For other errors, use the non-async version
  callback(getAuthErrorMessage(error));
};
