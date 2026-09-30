import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl =
  'https://zcgqhrchixzgvchhrdyz.supabase.co';

const supabasePublishableKey =
  'sb_publishable_EQB0fGlDZAh5PZ3-1qStNg_NIyBVtWk';

const storage =
  Platform.OS === 'web'
    ? undefined
    : AsyncStorage;

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      ...(storage ? { storage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);