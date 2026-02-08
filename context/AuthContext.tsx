import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { SecurityConfig } from '../config/security';
import { ValidationUtils, RateLimitUtils } from '../utils/validation';
import { SessionManager } from '../utils/sessionManager';

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

  // Secure role-based admin check
  const isAdmin = user?.email ? SecurityConfig.adminEmails.includes(user.email.toLowerCase()) : false;

  useEffect(() => {
    let mounted = true;
    let authListener: any = null;
    
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

    authListener = supabase.auth.onAuthStateChange(
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
      // Validate form data
      const validation = ValidationUtils.validateRegistrationForm({
        email,
        password,
        phone,
        name
      });

      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return { success: false, error: firstError[0] };
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name ? ValidationUtils.sanitizeInput(name) : undefined;
      const cleanPhone = phone ? phone.replace(/\D/g, '') : undefined;

      const { data, error } = await supabase.auth.signUp({ 
        email: cleanEmail, 
        password,
        options: {
          data: {
            name: cleanName,
            phone: cleanPhone,
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
      // Input validation
      if (!ValidationUtils.isValidEmail(email)) {
        return 'Please enter a valid email address';
      }

      const passwordValidation = ValidationUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        return passwordValidation.errors[0];
      }

      const cleanEmail = email.trim().toLowerCase();

      // Rate limiting check
      if (RateLimitUtils.isRateLimited(cleanEmail, SecurityConfig.maxLoginAttempts, SecurityConfig.lockoutDurationMinutes * 60 * 1000)) {
        const remainingTime = RateLimitUtils.getLockoutTimeRemaining(cleanEmail, SecurityConfig.lockoutDurationMinutes * 60 * 1000);
        const minutes = Math.ceil(remainingTime / (60 * 1000));
        return `Too many failed attempts. Please try again in ${minutes} minutes.`;
      }

      // Check if user is locked out
      const isLockedOut = await SessionManager.isLockedOut(cleanEmail);
      if (isLockedOut) {
        const lockoutTime = await SessionManager.getLockoutTimeRemaining(cleanEmail);
        const minutes = Math.ceil(lockoutTime / (60 * 1000));
        return `Account is temporarily locked. Please try again in ${minutes} minutes.`;
      }

      // Log login attempt
      await SessionManager.logSecurityEvent({
        type: 'login_attempt',
        identifier: cleanEmail
      });

      // First check if user exists
      const userExists = await checkUserExists(cleanEmail);
      if (!userExists) {
        await SessionManager.logSecurityEvent({
          type: 'login_failure',
          identifier: cleanEmail,
          details: { reason: 'user_not_found' }
        });
        return 'No account found with this email address. Please create an account first.';
      }

      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        await SessionManager.logSecurityEvent({
          type: 'login_failure',
          identifier: cleanEmail,
          details: { reason: 'invalid_credentials', error: error.message }
        });
        
        // Check if we need to lock out the user
        if (RateLimitUtils.isRateLimited(cleanEmail, SecurityConfig.maxLoginAttempts, SecurityConfig.lockoutDurationMinutes * 60 * 1000)) {
          await SessionManager.setLockout(cleanEmail);
        }
        
        console.error('🔴 Login error:', error.message);
        return error.message;
      }

      // Successful login
      await SessionManager.logSecurityEvent({
        type: 'login_success',
        identifier: cleanEmail
      });

      // Clear any existing rate limits
      RateLimitUtils.clearAttempts(cleanEmail);
      await SessionManager.clearLockout(cleanEmail);

      // Create session
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await SessionManager.createSession(user.id);
      }

      return null;
    } catch (err: any) {
      await SessionManager.logSecurityEvent({
        type: 'login_failure',
        identifier: email.trim().toLowerCase(),
        details: { reason: 'unexpected_error', error: err.message }
      });
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
    try {
      await SessionManager.clearSession();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ Error during sign out:', error);
    }
  };

  // Simplified user existence check - proceed with login attempt
  const checkUserExists = async (email: string): Promise<boolean> => {
    // Always return true to allow login attempt to proceed
    // The actual validation will happen during signInWithPassword
    return true;
  };

  // ✅ FIXED: Simplified and safer version using Expo Linking
  const resetPassword = async (email: string) => {
    try {
      // First check if user exists
      const userExists = await checkUserExists(email);
      if (!userExists) {
        return 'No account found with this email address. Please create an account first.';
      }

      // This handles the scheme automatically for Expo Go, Web, and Native Builds
      const redirectTo = Linking.createURL('reset-password');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error('❌ Reset password error:', error.message);
        return error.message;
      }

      return null;
    } catch (err: any) {
      console.error('❌ Reset password crash:', err);
      return 'Unexpected error';
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return null;
    } catch (err: any) {
      console.error('❌ Update password error:', err);
      return err.message || 'Failed to update password';
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
      
      await signOut();
    } catch (err: any) {
      console.error('❌ Delete account error:', err);
      throw err;
    }
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