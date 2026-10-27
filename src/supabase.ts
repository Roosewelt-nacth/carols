import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Keys come from .env.local (EXPO_PUBLIC_*). The publishable key is meant to be public:
// what people can read or change is decided by the row level security rules in supabase/schema.sql.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const live = !!(url && key);

export const supabase = live
  ? createClient(url!, key!, {
      auth: {
        storage: Platform.OS === 'web' && typeof window === 'undefined' ? undefined : AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : (null as any as ReturnType<typeof createClient>);
