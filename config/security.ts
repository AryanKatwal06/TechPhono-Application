import { Platform } from 'react-native';

// Secure configuration management
export class SecurityConfig {
  // Supabase configuration
  static get supabaseUrl(): string {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!url) {
      throw new Error('Supabase URL is not configured');
    }
    return url;
  }

  static get supabaseAnonKey(): string {
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) {
      throw new Error('Supabase anonymous key is not configured');
    }
    return key;
  }

  
  // Admin configuration
  static get adminEmails(): string[] {
    const emails = process.env.EXPO_PUBLIC_ADMIN_EMAILS;
    if (!emails) {
      console.warn('No admin emails configured');
      return [];
    }
    return emails.split(',').map(email => email.trim().toLowerCase());
  }

  // Security configuration
  static get sessionTimeoutMinutes(): number {
    const timeout = process.env.EXPO_PUBLIC_SESSION_TIMEOUT_MINUTES;
    return timeout ? parseInt(timeout, 10) : 60;
  }

  static get maxLoginAttempts(): number {
    const attempts = process.env.EXPO_PUBLIC_MAX_LOGIN_ATTEMPTS;
    return attempts ? parseInt(attempts, 10) : 5;
  }

  static get lockoutDurationMinutes(): number {
    const duration = process.env.EXPO_PUBLIC_LOCKOUT_DURATION_MINUTES;
    return duration ? parseInt(duration, 10) : 15;
  }

  // Application configuration
  static get appName(): string {
    return process.env.EXPO_PUBLIC_APP_NAME || 'TechPhono Repair App';
  }

  static get supportEmail(): string {
    return process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@techphono.com';
  }

  static get whatsappNumber(): string {
    return process.env.EXPO_PUBLIC_WHATSAPP_NUMBER || '';
  }

  // Development/Development flags
  static get isDevMode(): boolean {
    return process.env.EXPO_PUBLIC_DEV_MODE === 'true';
  }

  static get isDebugMode(): boolean {
    return process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';
  }

  // Security validation
  static validateConfig(): void {
    const requiredVars = [
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

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
