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
import { Linking } from 'react-native';
import { auth, db } from '../services/firebaseClient';
import { SecurityConfig } from '../config/security';
import { ValidationUtils, RateLimitUtils } from '../utils/validation';
import { SessionManager } from '../utils/sessionManager';
import { recordPasswordResetRequest } from '@/services/passwordReset';

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

  const logAuthStep = (step: string, details?: Record<string, unknown>) => {
    console.log(`[Auth] ${step}`, details || {});
  };

  useEffect(() => {
    let mounted = true;

    logAuthStep('subscribing to auth state changes');

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!mounted) return;
      logAuthStep('auth state changed', {
        user: firebaseUser ? firebaseUser.email : null,
        uid: firebaseUser?.uid || null,
        isAdmin: SecurityConfig.isAdminEmail(firebaseUser?.email),
      });
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
      logAuthStep('signup started', {
        email: email.trim().toLowerCase(),
        hasPhone: Boolean(phone),
        hasName: Boolean(name),
      });

      // Validate form data
      const validation = ValidationUtils.validateRegistrationForm({
        email,
        password,
        phone,
        name
      });

      if (!validation.isValid) {
        logAuthStep('signup validation failed', { errors: validation.errors });
        const firstError = Object.values(validation.errors)[0];
        return { success: false, error: firstError[0] };
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name ? ValidationUtils.sanitizeInput(name) : undefined;
      const cleanPhone = phone ? phone.replace(/\D/g, '') : undefined;

      logAuthStep('creating firebase user', { email: cleanEmail });

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

      if (!userCredential.user) {
        logAuthStep('signup returned no user credential', { email: cleanEmail });
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

      logAuthStep('storing signup profile', { uid: userCredential.user.uid });

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

      logAuthStep('signup completed', { uid: userCredential.user.uid });

      return { success: true };
    } catch (err: any) {
        console.error('Unexpected signup error:', err?.code, err?.message || err);
        logAuthStep('signup failed', { code: err?.code, message: err?.message });
        // Map Firebase error codes (or messages containing the code) to user-friendly messages
        const errorMessage = mapFirebaseAuthError(err?.code || err?.message) || err?.message || 'Unexpected error';
        return { success: false, error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      logAuthStep('sign-in started', {
        email: email.trim().toLowerCase(),
        hasPassword: Boolean(password?.trim()),
      });

      // Input validation
      if (!ValidationUtils.isValidEmail(email)) {
        logAuthStep('sign-in validation failed', { reason: 'invalid-email' });
        return 'Please enter a valid email address';
      }

      if (!password || !password.trim()) {
        logAuthStep('sign-in validation failed', { reason: 'missing-password' });
        return 'Please enter your password';
      }

      const cleanEmail = email.trim().toLowerCase();
      logAuthStep('sign-in input normalized', { email: cleanEmail });

      // Rate limiting check
      if (RateLimitUtils.isRateLimited(cleanEmail, SecurityConfig.maxLoginAttempts, SecurityConfig.lockoutDurationMinutes * 60 * 1000)) {
        const remainingTime = RateLimitUtils.getLockoutTimeRemaining(cleanEmail, SecurityConfig.lockoutDurationMinutes * 60 * 1000);
        const minutes = Math.ceil(remainingTime / (60 * 1000));
        logAuthStep('sign-in blocked by local rate limit', { email: cleanEmail, minutes });
        return `Too many failed attempts. Please try again in ${minutes} minutes.`;
      }

      // Check if user is locked out
      const isLockedOut = await SessionManager.isLockedOut(cleanEmail);
      if (isLockedOut) {
        const lockoutTime = await SessionManager.getLockoutTimeRemaining(cleanEmail);
        const minutes = Math.ceil(lockoutTime / (60 * 1000));
        logAuthStep('sign-in blocked by session lockout', { email: cleanEmail, minutes });
        return `Account is temporarily locked. Please try again in ${minutes} minutes.`;
      }

      // Log login attempt
      logAuthStep('recording login attempt', { email: cleanEmail });
      await SessionManager.logSecurityEvent({
        type: 'login_attempt',
        identifier: cleanEmail
      });

      logAuthStep('calling firebase sign-in', { email: cleanEmail });
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);

      if (!userCredential.user) {
        logAuthStep('firebase sign-in returned no user', { email: cleanEmail });
        await SessionManager.logSecurityEvent({
          type: 'login_failure',
          identifier: cleanEmail,
          details: { reason: 'user_not_returned' }
        });
        return 'Login failed. Please try again.';
      }

      // Successful login
      logAuthStep('firebase sign-in successful', { uid: userCredential.user.uid, email: cleanEmail });
      await SessionManager.logSecurityEvent({
        type: 'login_success',
        identifier: cleanEmail
      });

      // Clear any existing rate limits
      RateLimitUtils.clearAttempts(cleanEmail);
      await SessionManager.clearLockout(cleanEmail);

      // Create session
      await SessionManager.createSession(userCredential.user.uid);

      logAuthStep('session created', { uid: userCredential.user.uid });

      return null;
    } catch (err: any) {
      const cleanEmail = email.trim().toLowerCase();

      logAuthStep('sign-in failed', {
        email: cleanEmail,
        code: err?.code,
        message: err?.message,
      });

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
      if (errorMessage) {
        logAuthStep('sign-in mapped firebase error', { email: cleanEmail, message: errorMessage });
        return errorMessage;
      }

      console.error('Login error:', err.message);
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
      logAuthStep('sign-out started', { uid: auth.currentUser?.uid || null });
      await SessionManager.clearSession();
      await firebaseSignOut(auth);
      logAuthStep('sign-out completed');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      logAuthStep('password reset started', { email: cleanEmail });
      if (!ValidationUtils.isValidEmail(cleanEmail)) {
        return 'Please enter a valid email address.';
      }

      const trackingError = await recordPasswordResetRequest(cleanEmail);
      if (trackingError) {
        logAuthStep('password reset tracking failed', { email: cleanEmail, error: trackingError });
        return trackingError;
      }

      // Send default Firebase password reset email that opens in the browser.
      // Do not set custom actionCodeSettings to avoid redirecting back into the app.
      await sendPasswordResetEmail(auth, cleanEmail);

      logAuthStep('password reset email sent', { email: cleanEmail });

      return null;
    } catch (err: any) {
      console.error('Reset password error:', err);
      logAuthStep('password reset failed', { code: err?.code, message: err?.message });
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
      logAuthStep('password update started', { uid: auth.currentUser.uid });
      await firebaseUpdatePassword(auth.currentUser, password);
      logAuthStep('password update completed', { uid: auth.currentUser.uid });
      return null;
    } catch (err: any) {
      console.error('Update password error:', err);
      logAuthStep('password update failed', { code: err?.code, message: err?.message });
      const errorMessage = mapFirebaseAuthError(err.code);
      if (errorMessage) return errorMessage;
      return err.message || 'Failed to update password';
    }
  };

  const deleteAccount = async () => {
    try {
      if (!auth.currentUser) throw new Error('No user logged in');

      // Firebase allows client-side deletion if user recently authenticated
      logAuthStep('delete account started', { uid: auth.currentUser.uid });
      await firebaseDeleteUser(auth.currentUser);
      await SessionManager.clearSession();
      logAuthStep('delete account completed');
    } catch (err: any) {
      console.error('Delete account error:', err);
      logAuthStep('delete account failed', { code: err?.code, message: err?.message });
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