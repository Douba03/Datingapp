import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Debug version of the Supabase client that logs all operations
 * Use this to troubleshoot connection issues
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:');
  console.error(`URL: ${supabaseUrl ? 'FOUND' : 'MISSING'}`);
  console.error(`KEY: ${supabaseAnonKey ? 'FOUND' : 'MISSING'}`);
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

console.log('[Supabase Debug] Creating client with:');
console.log(`- URL: ${supabaseUrl}`);
console.log(`- KEY: ${supabaseAnonKey.substring(0, 15)}...`);

// On native (iOS/Android), use AsyncStorage. On web, let Supabase use localStorage by default.
const authOptions = Platform.OS === 'web'
  ? {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    }
  : {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    } as const;

console.log('[Supabase Debug] Auth options:', authOptions);

// Create a client with debug logging
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...authOptions,
    debug: true, // Enable auth debugging
    flowType: 'pkce', // Use PKCE flow for better security
  },
  global: {
    headers: {
      'x-client-info': 'partner-productivity-app',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Test the connection
(async () => {
  try {
    console.log('[Supabase Debug] Testing connection...');
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('[Supabase Debug] Connection test failed:', error);
    } else {
      console.log('[Supabase Debug] Connection test successful!');
    }
  } catch (err) {
    console.error('[Supabase Debug] Connection test exception:', err);
  }
})();

export const debugSupabase = supabase;
export default supabase;
