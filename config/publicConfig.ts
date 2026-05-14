export const PUBLIC_CONFIG = {
  firebaseApiKey: 'YOUR_FIREBASE_API_KEY',
  firebaseAuthDomain: 'YOUR_FIREBASE_AUTH_DOMAIN',
  firebaseProjectId: 'YOUR_FIREBASE_PROJECT_ID',
  firebaseStorageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET',
  firebaseMessagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID',
  firebaseAppId: 'YOUR_FIREBASE_APP_ID',
  cloudinaryCloudName: 'YOUR_CLOUDINARY_CLOUD_NAME',
  cloudinaryUploadPreset: 'YOUR_CLOUDINARY_UPLOAD_PRESET',
  adminEmails: '',
  sessionTimeoutMinutes: '60',
  maxLoginAttempts: '5',
  lockoutDurationMinutes: '15',
  appName: 'TechPhono Repair App',
  supportEmail: 'support@techphono.com',
  whatsappNumber: '',
  appUrl: '',
  devMode: 'false',
  debugMode: 'false',
} as const;

export type PublicConfigKey = keyof typeof PUBLIC_CONFIG;