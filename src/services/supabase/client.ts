import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';

// Get Supabase config from environment variables or app.json extra
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.supabaseUrl || 
  'https://zfnwtnqwokwvuxxwxgsr.supabase.co';

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
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
      'x-client-info': 'calafdoon',
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
