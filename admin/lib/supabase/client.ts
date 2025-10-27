import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/**
 * Supabase client for client-side operations.
 * Uses anon key and respects RLS policies.
 * Safe to use in browser components.
 * Uses SSR package for proper cookie handling.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

