import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore - React Native persistence import
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { SecurityConfig } from '../config/security';

// Helper function to get Firebase configuration safely
const getFirebaseConfig = () => {
  try {
    SecurityConfig.validateConfig();
    const config = {
      apiKey: SecurityConfig.firebaseApiKey,
      authDomain: SecurityConfig.firebaseAuthDomain,
      projectId: SecurityConfig.firebaseProjectId,
      storageBucket: SecurityConfig.firebaseStorageBucket,
      messagingSenderId: SecurityConfig.firebaseMessagingSenderId,
      appId: SecurityConfig.firebaseAppId,
    };
    
    // Check if Firebase is properly configured
    if (!config.apiKey || config.apiKey.includes('YOUR_') || !config.projectId || config.projectId.includes('YOUR_')) {
      console.warn('⚠️ Firebase not properly configured. Using development fallback.');
      return getDevelopmentFallback();
    }
    
    return config;
  } catch (error) {
    console.error('❌ Security configuration error:', error);
    return getDevelopmentFallback();
  }
};

// Development fallback configuration to prevent crashes
const getDevelopmentFallback = () => {
  console.log('🔧 Using development fallback - Firebase features will be limited');
  return {
    apiKey: 'demo-api-key-for-development',
    authDomain: 'demo.firebaseapp.com',
    projectId: 'demo-project',
    storageBucket: 'demo-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef',
  };
};

const firebaseConfig = getFirebaseConfig();

// Remove console logs in production for security
if (SecurityConfig.isDebugMode) {
  console.log('🔧 Firebase Client - Project ID:', firebaseConfig.projectId);
  console.log('🔑 Firebase Client - API Key configured:', !!firebaseConfig.apiKey);
}

// Initialize Firebase app (prevent re-initialization)
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('✅ Firebase app initialized successfully');
} catch (error) {
  console.error('❌ Firebase app initialization failed:', error);
  // Create a mock app for development to prevent crashes
  app = {
    options: firebaseConfig,
    name: '[DEFAULT]',
    automaticDataCollectionEnabled: false,
  } as any;
}

// Initialize Firebase Auth with AsyncStorage persistence for React Native
let auth: ReturnType<typeof initializeAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('✅ Firebase Auth initialized successfully');
} catch (error) {
  console.error('❌ Firebase Auth initialization failed:', error);
  try {
    // If auth is already initialized, get the existing instance
    auth = getAuth(app) as any;
  } catch (authError) {
    console.error('❌ Failed to get existing Firebase Auth instance:', authError);
    // Create a mock auth object for development
    auth = {
      currentUser: null,
      onAuthStateChanged: () => () => {},
      signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
      createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
      signOut: () => Promise.resolve(),
    } as any;
  }
}

// Initialize Firestore
let db;
try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');
} catch (error) {
  console.error('❌ Firestore initialization failed:', error);
  // Create a mock db for development
  db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.resolve({ exists: false }),
        set: () => Promise.resolve(),
        update: () => Promise.resolve(),
        delete: () => Promise.resolve(),
      }),
      add: () => Promise.resolve({ id: 'mock-id' }),
      where: () => ({ get: () => Promise.resolve({ docs: [] }) }),
      orderBy: () => ({ get: () => Promise.resolve({ docs: [] }) }),
      limit: () => ({ get: () => Promise.resolve({ docs: [] }) }),
    }),
  } as any;
}

// Initialize Firebase Storage
let storage;
try {
  storage = getStorage(app);
  console.log('✅ Firebase Storage initialized successfully');
} catch (error) {
  console.error('❌ Firebase Storage initialization failed:', error);
  // Create a mock storage for development
  storage = {
    ref: () => ({
      put: () => Promise.resolve({ metadata: { name: 'mock-file' } }),
      getDownloadURL: () => Promise.resolve('data:image/png;base64,mock'),
      delete: () => Promise.resolve(),
    }),
  } as any;
}

export { app, auth, db, storage };
