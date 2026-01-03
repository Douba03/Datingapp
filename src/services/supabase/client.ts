import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState, AppStateStatus } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authOptions,
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-client-info': 'mali-match-app',
    },
  },
  db: {
    schema: 'public',
  },
});

// Reconnect realtime when app comes back to foreground
if (Platform.OS !== 'web') {
  let appState = AppState.currentState;
  
  AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('[Supabase] App came to foreground, reconnecting realtime...');
      // Reconnect realtime channels
      supabase.realtime.connect();
    }
    appState = nextAppState;
  });
}

export default supabase;
