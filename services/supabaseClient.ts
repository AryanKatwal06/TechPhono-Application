import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SecurityConfig } from '../config/security';

// Validate configuration on import
try {
  SecurityConfig.validateConfig();
} catch (error) {
  console.error('❌ Security configuration error:', error);
  throw error;
}

const supabaseUrl = SecurityConfig.supabaseUrl;
const supabaseAnonKey = SecurityConfig.supabaseAnonKey;

// Remove console logs in production for security
if (SecurityConfig.isDebugMode) {
  console.log('🔧 Supabase Client - URL:', supabaseUrl);
  console.log('🔑 Supabase Client - Key configured:', !!supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});