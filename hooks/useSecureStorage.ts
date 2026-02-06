import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { SecurityEnhanced } from '@/config/securityEnhanced';

// Secure Storage Hook
export const useSecureStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get value from secure storage
  useEffect(() => {
    const getValue = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const encryptedValue = await AsyncStorage.getItem(key);
        if (encryptedValue) {
          const decryptedValue = await SecurityEnhanced.decryptData(encryptedValue);
          setStoredValue(JSON.parse(decryptedValue));
        } else {
          setStoredValue(initialValue);
        }
      } catch (err) {
        console.error(`❌ Error reading secure storage for key "${key}":`, err);
        setError('Failed to read from secure storage');
        setStoredValue(initialValue);
      } finally {
        setLoading(false);
      }
    };

    getValue();
  }, [key, initialValue]);

  // Set value to secure storage
  const setValue = async (value: T) => {
    try {
      setError(null);
      const stringValue = JSON.stringify(value);
      const encryptedValue = await SecurityEnhanced.encryptData(stringValue);
      await AsyncStorage.setItem(key, encryptedValue);
      setStoredValue(value);
    } catch (err) {
      console.error(`❌ Error writing to secure storage for key "${key}":`, err);
      setError('Failed to write to secure storage');
    }
  };

  // Remove value from secure storage
  const removeValue = async () => {
    try {
      setError(null);
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (err) {
      console.error(`❌ Error removing from secure storage for key "${key}":`, err);
      setError('Failed to remove from secure storage');
    }
  };

  // Clear all secure storage (for logout)
  const clearAll = async () => {
    try {
      setError(null);
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(k => k.startsWith('secure_'));
      await AsyncStorage.multiRemove(secureKeys);
      setStoredValue(initialValue);
    } catch (err) {
      console.error('❌ Error clearing secure storage:', err);
      setError('Failed to clear secure storage');
    }
  };

  return {
    value: storedValue,
    setValue,
    removeValue,
    clearAll,
    loading,
    error
  };
};

// Specific secure storage hooks for common data
export const useSecureAuth = () => {
  return useSecureStorage('secure_auth_tokens', {
    accessToken: null,
    refreshToken: null,
    user: null
  });
};

export const useSecureUserPrefs = () => {
  return useSecureStorage('secure_user_preferences', {
    theme: 'light',
    notifications: true,
    language: 'en'
  });
};

export const useSecureSession = () => {
  return useSecureStorage('secure_session_data', {
    sessionId: null,
    expiresAt: null,
    isActive: false
  });
};
