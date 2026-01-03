/**
 * Utility functions for Supabase with timeout and retry support
 */

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 2;

/**
 * Wraps a promise with a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT,
  errorMessage: string = 'Request timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Wraps a Supabase query with timeout and optional retry
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    timeout?: number;
    retries?: number;
    fallback?: T;
    onError?: (error: any) => void;
  } = {}
): Promise<{ data: T | null; error: any }> {
  const { 
    timeout = DEFAULT_TIMEOUT, 
    retries = DEFAULT_RETRIES,
    fallback = null,
    onError 
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await withTimeout(
        queryFn(),
        timeout,
        `Query timed out after ${timeout}ms`
      );
      
      if (result.error) {
        lastError = result.error;
        console.warn(`[safeQuery] Attempt ${attempt + 1} failed:`, result.error.message);
        
        // Don't retry on certain errors
        if (result.error.code === 'PGRST116') {
          // No rows found - this is expected, not an error to retry
          return result;
        }
        
        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`[safeQuery] Attempt ${attempt + 1} exception:`, error.message);
      
      if (attempt < retries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  // All retries failed
  if (onError) {
    onError(lastError);
  }

  return { 
    data: fallback, 
    error: lastError || new Error('Query failed after retries') 
  };
}

/**
 * Check if Supabase is reachable
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { supabase } = await import('../services/supabase/client');
    
    const queryPromise = new Promise<{ error: any }>((resolve) => {
      supabase.from('users').select('id').limit(1).then(r => resolve(r));
    });
    
    const result = await withTimeout(queryPromise, 5000, 'Connection check timed out');
    
    return !result.error;
  } catch {
    return false;
  }
}
