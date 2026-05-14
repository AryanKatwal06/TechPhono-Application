import { Platform } from 'react-native';
import { PUBLIC_CONFIG } from './publicConfig';

type PublicConfigShape = typeof PUBLIC_CONFIG;

const loadLocalConfig = (): Partial<PublicConfigShape> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const localConfig = require('./publicConfig.local');
    return localConfig.PUBLIC_CONFIG || localConfig.default || {};
  } catch {
    return {};
  }
};

const ACTIVE_PUBLIC_CONFIG: PublicConfigShape = {
  ...PUBLIC_CONFIG,
  ...loadLocalConfig(),
};

const FIREBASE_DEFAULTS = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN',
  projectId: 'YOUR_FIREBASE_PROJECT_ID',
  storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'YOUR_FIREBASE_APP_ID',
};

const isPlaceholderValue = (value?: string): boolean => {
  if (!value) return true;
  return /^(YOUR_|your_)/.test(value.trim());
};

const readPublicConfig = (name: keyof typeof PUBLIC_CONFIG): string | undefined => {
  const value = ACTIVE_PUBLIC_CONFIG[name];
  return isPlaceholderValue(value) ? undefined : value;
};

// Secure configuration management
export class SecurityConfig {
  // Firebase configuration
  static get firebaseApiKey(): string {
    const key = readPublicConfig('firebaseApiKey') || FIREBASE_DEFAULTS.apiKey;
    return isPlaceholderValue(key) ? FIREBASE_DEFAULTS.apiKey : key;
  }

  static get firebaseAuthDomain(): string {
    const value = readPublicConfig('firebaseAuthDomain') || FIREBASE_DEFAULTS.authDomain;
    return isPlaceholderValue(value) ? FIREBASE_DEFAULTS.authDomain : value;
  }

  static get firebaseProjectId(): string {
    const value = readPublicConfig('firebaseProjectId') || FIREBASE_DEFAULTS.projectId;
    return isPlaceholderValue(value) ? FIREBASE_DEFAULTS.projectId : value;
  }

  static get firebaseStorageBucket(): string {
    const value = readPublicConfig('firebaseStorageBucket') || FIREBASE_DEFAULTS.storageBucket;
    return isPlaceholderValue(value) ? FIREBASE_DEFAULTS.storageBucket : value;
  }

  static get firebaseMessagingSenderId(): string {
    const value = readPublicConfig('firebaseMessagingSenderId') || FIREBASE_DEFAULTS.messagingSenderId;
    return isPlaceholderValue(value) ? FIREBASE_DEFAULTS.messagingSenderId : value;
  }

  static get firebaseAppId(): string {
    const value = readPublicConfig('firebaseAppId') || FIREBASE_DEFAULTS.appId;
    return isPlaceholderValue(value) ? FIREBASE_DEFAULTS.appId : value;
  }

  // Cloudinary configuration
  static get cloudinaryCloudName(): string {
    return readPublicConfig('cloudinaryCloudName') || '';
  }

  static get cloudinaryUploadPreset(): string {
    return readPublicConfig('cloudinaryUploadPreset') || '';
  }

  // Admin configuration
  static get adminEmails(): string[] {
    const emails = readPublicConfig('adminEmails');
    
    if (!emails) {
      return [];
    }
    
    return emails.split(',').map(email => email.trim().toLowerCase());
  }

  static isAdminEmail(email?: string | null): boolean {
    if (!email) return false;
    return this.adminEmails.includes(email.trim().toLowerCase());
  }

  // Security configuration
  static get sessionTimeoutMinutes(): number {
    const timeout = readPublicConfig('sessionTimeoutMinutes');
    return timeout ? parseInt(timeout, 10) : 60;
  }

  static get maxLoginAttempts(): number {
    const attempts = readPublicConfig('maxLoginAttempts');
    return attempts ? parseInt(attempts, 10) : 5;
  }

  static get lockoutDurationMinutes(): number {
    const duration = readPublicConfig('lockoutDurationMinutes');
    return duration ? parseInt(duration, 10) : 15;
  }

  // Application configuration
  static get appName(): string {
    return readPublicConfig('appName') || 'TechPhono Repair App';
  }

  static get supportEmail(): string {
    return readPublicConfig('supportEmail') || 'support@techphono.com';
  }

  static get whatsappNumber(): string {
    return readPublicConfig('whatsappNumber') || '';
  }

  // Development/Development flags
  static get isDevMode(): boolean {
    return readPublicConfig('devMode') === 'true';
  }

  static get isDebugMode(): boolean {
    return readPublicConfig('debugMode') === 'true';
  }

  // Public application URL used for Firebase action links (must be whitelisted in Firebase Console)
  static get appUrl(): string {
    return readPublicConfig('appUrl') || '';
  }

  // Security validation
  static validateConfig(): void {
    // Validate admin emails if configured
    const adminEmails = this.adminEmails;
    if (adminEmails.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = adminEmails.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid admin email format: ${invalidEmails.join(', ')}`);
      }
    }
  }

  // Platform-specific security settings
  static get isSecurePlatform(): boolean {
    return Platform.OS !== 'web' || window.isSecureContext;
  }
}
