import { SecurityConfig } from '@/config/security';
import { auth } from '@/services/firebaseClient';
import { verifyPasswordResetCode } from 'firebase/auth';

export const PASSWORD_RESET_WINDOW_MS = 5 * 60 * 1000;

const getFunctionsBaseUrl = (): string => {
  return `https://us-central1-${SecurityConfig.firebaseProjectId}.cloudfunctions.net`;
};

const postJson = async <T>(path: string, body: Record<string, unknown>): Promise<T> => {
  try {
    const response = await fetch(`${getFunctionsBaseUrl()}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as T & { message?: string; error?: string };

    if (!response.ok) {
      const errorMessage = payload?.message || payload?.error || 'Password reset verification failed.';
      throw new Error(errorMessage);
    }

    return payload;
  } catch (error: any) {
    // Log the error for debugging
    console.warn(`Cloud Function call failed (${path}):`, error?.message || error);
    throw error;
  }
};

export const recordPasswordResetRequest = async (email: string): Promise<string | null> => {
  try {
    await postJson<{ ok: boolean }>('recordPasswordResetRequest', { email });
    return null;
  } catch (error: any) {
    console.warn('Password reset request tracking unavailable:', error);
    return null;
  }
};

export const validatePasswordResetLink = async (oobCode: string): Promise<{ email: string }> => {
  try {
    return await postJson<{ email: string }>('validatePasswordResetRequest', { oobCode });
  } catch (error) {
    console.warn('Password reset request validation unavailable, falling back to Firebase verification:', error);
    try {
      const email = await verifyPasswordResetCode(auth, oobCode);
      return { email };
    } catch (firebaseError: any) {
      // Provide clearer error messages for Firebase validation errors
      if (firebaseError?.code === 'auth/invalid-action-code') {
        throw new Error('This password reset link is invalid or expired.');
      } else if (firebaseError?.code === 'auth/expired-action-code') {
        throw new Error('This password reset link has expired. Please request a new one.');
      } else if (firebaseError?.message) {
        throw new Error(firebaseError.message);
      } else {
        throw new Error('Unable to validate password reset link. Please try again or request a new link.');
      }
    }
  }
};

export const consumePasswordResetRequest = async (email: string): Promise<void> => {
  try {
    await postJson<{ ok: boolean }>('consumePasswordResetRequest', { email });
  } catch (error) {
    console.warn('Password reset request consume unavailable:', error);
  }
};