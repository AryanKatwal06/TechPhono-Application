import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
// @ts-ignore - React Native persistence import
import { initializeAuth, getReactNativePersistence, getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { SecurityConfig } from '../config/security';

const firebaseConfig = {
  apiKey: SecurityConfig.firebaseApiKey,
  authDomain: SecurityConfig.firebaseAuthDomain,
  projectId: SecurityConfig.firebaseProjectId,
  storageBucket: SecurityConfig.firebaseStorageBucket,
  messagingSenderId: SecurityConfig.firebaseMessagingSenderId,
  appId: SecurityConfig.firebaseAppId,
};

const redactApiKey = (key: string): string => {
  if (!key) return '[missing]';
  if (key.length <= 8) return `${key.slice(0, 4)}…`;
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
};

console.log('[Firebase] Bootstrapping client', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket,
  appId: firebaseConfig.appId,
  apiKey: redactApiKey(firebaseConfig.apiKey),
  devMode: SecurityConfig.isDevMode,
  debugMode: SecurityConfig.isDebugMode,
});

// Initialize Firebase app (prevent re-initialization)
let app: FirebaseApp | any;
try {
  console.log('[Firebase] Initializing app instance');
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('[Firebase] App ready', { existingApps: getApps().length });
} catch (error) {
  console.error('Firebase app initialization failed:', error);
  app = {
    options: firebaseConfig,
    name: '[DEFAULT]',
    automaticDataCollectionEnabled: false,
  } as any;
}

// Initialize Firebase Auth with AsyncStorage persistence for React Native
let auth: Auth | any;
try {
  console.log('[Firebase] Initializing auth persistence');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('[Firebase] Auth ready');
} catch (error) {
  console.error('Firebase Auth initialization failed:', error);
  try {
    console.log('[Firebase] Falling back to existing auth instance');
    auth = getAuth(app) as any;
  } catch (authError) {
    console.error('Failed to get existing Firebase Auth instance:', authError);
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
let db: Firestore | any;
try {
  console.log('[Firebase] Initializing Firestore');
  db = getFirestore(app);
  console.log('[Firebase] Firestore ready');
} catch (error) {
  console.error('Firestore initialization failed:', error);
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
let storage: FirebaseStorage | any;
try {
  console.log('[Firebase] Initializing Storage');
  storage = getStorage(app);
  console.log('[Firebase] Storage ready');
} catch (error) {
  console.error('Firebase Storage initialization failed:', error);
  storage = {
    ref: () => ({
      put: () => Promise.resolve({ metadata: { name: 'mock-file' } }),
      getDownloadURL: () => Promise.resolve('data:image/png;base64,mock'),
      delete: () => Promise.resolve(),
    }),
  } as any;
}

export { app, auth, db, storage };
