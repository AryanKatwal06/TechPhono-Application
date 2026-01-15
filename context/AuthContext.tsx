import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../services/supabaseClient';
const ADMIN_EMAIL = 'ronakkumarbhakta@gmail.com';
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string, 
    password: string,
    phone?: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string }>; 
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  signUpWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
};
const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.email === ADMIN_EMAIL;
  useEffect(() => {
    let mounted = true;
    const fetchSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        console.error('❌ Error fetching initial session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);
  const signUp = async (
    email: string, 
    password: string,
    phone?: string,
    name?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name,
            phone,
          },
        },
      });
      if (error) {
        console.error('❌ Signup error:', error.message);
        return { success: false, error: error.message };
      }
      if (!data.user) {
        return {
          success: false,
          error: 'Signup succeeded but user was not returned. Please check email verification settings.',
        };
      }
      return { success: true };
    } catch (err: any) {
      console.error('❌ Unexpected signup error:', err);
      return { success: false, error: err.message || 'Unexpected error' };
    }
  };
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('🔴 Login error:', error.message);
        return error.message;
      }
      return null;
    } catch (err: any) {
        return err.message || 'An unexpected error occurred during sign in.';
    }
  };
  const signUpWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  };
  const verifyOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) throw error;
  };
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  const resetPassword = async (email: string) => {
    const redirectTo = Platform.OS === 'web' 
        ? window.location.origin + '/auth/reset-password' 
        : Linking.createURL('auth/reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return error?.message ?? null;
  };
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return error?.message ?? null;
  };
  const deleteAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    console.warn(
      '⚠️ Client-side deletion is limited. Use Supabase Edge Functions for complete user deletion.'
    );
    await signOut();
  };
  return (
    <AuthContext.Provider
      value={{ 
        user, 
        session, 
        loading, 
        isAdmin,
        signIn, 
        signUp, 
        signOut, 
        resetPassword, 
        updatePassword,
        signUpWithPhone,
        verifyOtp,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);