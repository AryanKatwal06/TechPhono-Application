import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
  updateProfile,
  deleteUser as firebaseDeleteUser,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Linking } from 'react-native';
import { auth, db } from '../services/firebaseClient';
import { SecurityConfig } from '../config/security';
import { ValidationUtils, RateLimitUtils } from '../utils/validation';
import { SessionManager } from '../utils/sessionManager';

type AuthContextType = {
  user: User | null;
  session: any | null;
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

// Store phone verification ID for OTP flow
let phoneVerificationId: string | null = null;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Secure role-based admin check
  const isAdmin = SecurityConfig.isAdminEmail(user?.email);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!mounted) return;
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
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

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

      if (!userCredential.user) {
        return {
          success: false,
          error: 'Signup succeeded but user was not returned. Please try again.',
        };
      }

      // Update profile display name
      if (cleanName) {
        await updateProfile(userCredential.user, {
          displayName: cleanName,
        });
      }

      // Store additional user data in Firestore
      // Note: isVerified is set to true immediately - no email verification required
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: cleanEmail,
        name: cleanName || null,
        phone: cleanPhone || null,
        avatar_url: null,
        isVerified: true,
        verifiedAt: serverTimestamp(),
        authProvider: 'password',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (err: any) {
        console.error('❌ Unexpected signup error:', err?.code, err?.message || err);
        // Map Firebase error codes (or messages containing the code) to user-friendly messages
        const errorMessage = mapFirebaseAuthError(err?.code || err?.message) || err?.message || 'Unexpected error';
        return { success: false, error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Input validation
      if (!ValidationUtils.isValidEmail(email)) {
        return 'Please enter a valid email address';
      }

      if (!password || !password.trim()) {
        return 'Please enter your password';
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

      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);

      if (!userCredential.user) {
        await SessionManager.logSecurityEvent({
          type: 'login_failure',
          identifier: cleanEmail,
          details: { reason: 'user_not_returned' }
        });
        return 'Login failed. Please try again.';
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
      await SessionManager.createSession(userCredential.user.uid);

      return null;
    } catch (err: any) {
      const cleanEmail = email.trim().toLowerCase();

      await SessionManager.logSecurityEvent({
        type: 'login_failure',
        identifier: cleanEmail,
        details: { reason: 'firebase_error', error: err.code || err.message }
      });

      // Check if we need to lock out the user
      if (RateLimitUtils.isRateLimited(cleanEmail, SecurityConfig.maxLoginAttempts, SecurityConfig.lockoutDurationMinutes * 60 * 1000)) {
        await SessionManager.setLockout(cleanEmail);
      }

      // Map Firebase error codes to user-friendly messages
      const errorMessage = mapFirebaseAuthError(err.code);
      if (errorMessage) return errorMessage;

      console.error('🔴 Login error:', err.message);
      return err.message || 'An unexpected error occurred during sign in.';
    }
  };

  const signUpWithPhone = async (phone: string) => {
    // Firebase phone auth requires a different flow on React Native
    // This is a simplified implementation - for production, consider @react-native-firebase/auth
    throw new Error('Phone authentication requires native Firebase setup. Please use email authentication.');
  };

  const verifyOtp = async (phone: string, token: string) => {
    if (!phoneVerificationId) {
      throw new Error('No pending phone verification. Please request OTP first.');
    }

    try {
      const credential = PhoneAuthProvider.credential(phoneVerificationId, token);
      await signInWithCredential(auth, credential);
      phoneVerificationId = null;
    } catch (err: any) {
      throw new Error(mapFirebaseAuthError(err.code) || err.message || 'OTP verification failed');
    }
  };

  const handleSignOut = async () => {
    try {
      await SessionManager.clearSession();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('❌ Error during sign out:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!ValidationUtils.isValidEmail(cleanEmail)) {
        return 'Please enter a valid email address.';
      }

      const isNativeApp = Platform.OS !== 'web';
      const customSchemeUrl = 'techphono://auth/callback';
      const webUrl = SecurityConfig.appUrl?.trim();
      
      const continueUrl = isNativeApp ? customSchemeUrl : (webUrl || customSchemeUrl);

      const actionCodeSettings = {
        url: continueUrl,
        handleCodeInApp: true,
        android: {
          packageName: 'com.techphono.repair',
          installApp: true,
          minimumVersion: '1',
        },
        iOS: {
          bundleId: 'com.techphono.repair',
        },
      } as any;

      await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);

      return null;
    } catch (err: any) {
      console.error('❌ Reset password error:', err);
      const errorMessage = mapFirebaseAuthError(err.code);
      if (errorMessage) return errorMessage;
      return err.message || 'Unexpected error';
    }
  };

  const handleUpdatePassword = async (password: string) => {
    try {
      if (!auth.currentUser) {
        return 'No user logged in';
      }
      await firebaseUpdatePassword(auth.currentUser, password);
      return null;
    } catch (err: any) {
      console.error('❌ Update password error:', err);
      const errorMessage = mapFirebaseAuthError(err.code);
      if (errorMessage) return errorMessage;
      return err.message || 'Failed to update password';
    }
  };

  const deleteAccount = async () => {
    try {
      if (!auth.currentUser) throw new Error('No user logged in');

      // Firebase allows client-side deletion if user recently authenticated
      await firebaseDeleteUser(auth.currentUser);
      await SessionManager.clearSession();
    } catch (err: any) {
      console.error('❌ Delete account error:', err);
      // If requires-recent-login, inform the user
      if (err.code === 'auth/requires-recent-login') {
        throw new Error('Please sign in again before deleting your account for security verification.');
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: user ? { user } : null,
        loading,
        isAdmin,
        signIn,
        signUp,
        signOut: handleSignOut,
        resetPassword,
        updatePassword: handleUpdatePassword,
        signUpWithPhone,
        verifyOtp,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Map Firebase Auth error codes to user-friendly messages
function mapFirebaseAuthError(code?: string | null): string | null {
  if (!code) return null;

  // Normalize: if a full Firebase message is passed, extract the auth/... code
  let normalized = String(code);
  const match = normalized.match(/auth\/[a-z-]+/i);
  if (match) normalized = match[0];

  // Some Firebase messages contain the full sentence instead of the short code.
  if (/api-key-not-valid/i.test(normalized)) {
    return 'Firebase API key invalid. Check config/publicConfig.ts or your environment variables and ensure the API key matches your Firebase project.';
  }

  switch (normalized) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please create an account first.';
    case 'auth/wrong-password':
      return 'Invalid login credentials.';
    case 'auth/invalid-credential':
      return 'Invalid login credentials.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to perform this action.';
    case 'auth/invalid-verification-code':
      return 'Invalid OTP code. Please try again.';
    case 'auth/invalid-verification-id':
      return 'OTP session expired. Please request a new code.';
    default:
      return null;
  }
}

export const useAuth = () => useContext(AuthContext);