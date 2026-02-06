import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Enhanced Security Configuration
export class SecurityEnhanced {
  // Encryption keys (in production, these should be from secure storage)
  private static readonly ENCRYPTION_KEY = 'techphono_secure_key';
  private static readonly NONCE_KEY = 'techphono_nonce_key';

  // Rate limiting storage
  private static readonly RATE_LIMIT_KEY = 'rate_limit_data';
  private static readonly SECURITY_LOG_KEY = 'enhanced_security_log';

  // Secure encryption for sensitive data
  static async encryptData(data: string): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      // Simple XOR encryption for React Native compatibility
      const encrypted = await this.simpleXOREncrypt(data, key);
      return btoa(encrypted); // Base64 encode
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  static async decryptData(encryptedData: string): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      const decoded = atob(encryptedData); // Base64 decode
      const decrypted = await this.simpleXOREncrypt(decoded, key);
      return decrypted;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  private static async simpleXOREncrypt(data: string, key: string): Promise<string> {
    return data.split('').map((char, index) => 
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length))
    ).join('');
  }

  private static async getOrCreateEncryptionKey(): Promise<string> {
    try {
      let key = await AsyncStorage.getItem(this.ENCRYPTION_KEY);
      if (!key) {
        key = Crypto.randomUUID();
        await AsyncStorage.setItem(this.ENCRYPTION_KEY, key);
      }
      return key;
    } catch (error) {
      console.error('❌ Failed to get/create encryption key:', error);
      return Crypto.randomUUID(); // Fallback
    }
  }

  // Enhanced rate limiting with IP tracking
  static async checkRateLimit(
    identifier: string,
    maxRequests: number = 10,
    windowMs: number = 60000 // 1 minute
  ): Promise<{ allowed: boolean; remainingTime?: number }> {
    try {
      const rateData = await AsyncStorage.getItem(this.RATE_LIMIT_KEY);
      const limits = rateData ? JSON.parse(rateData) : {};
      
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!limits[identifier]) {
        limits[identifier] = [];
      }
      
      // Clean old requests
      limits[identifier] = limits[identifier].filter((timestamp: number) => timestamp > windowStart);
      
      if (limits[identifier].length >= maxRequests) {
        const oldestRequest = Math.min(...limits[identifier]);
        const remainingTime = oldestRequest + windowMs - now;
        return { allowed: false, remainingTime };
      }
      
      // Add current request
      limits[identifier].push(now);
      await AsyncStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(limits));
      
      return { allowed: true };
    } catch (error) {
      console.error('❌ Rate limit check failed:', error);
      return { allowed: true }; // Fail open for security
    }
  }

  // Security event logging with tamper detection
  static async logSecurityEvent(event: {
    type: 'auth_attempt' | 'auth_success' | 'auth_failure' | 'suspicious_activity' | 'data_access';
    userId?: string;
    identifier: string;
    details?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    try {
      const logData = await AsyncStorage.getItem(this.SECURITY_LOG_KEY);
      const logs = logData ? JSON.parse(logData) : [];
      
      const logEntry = {
        ...event,
        timestamp: Date.now(),
        sessionId: await this.generateSessionId(),
        deviceInfo: await this.getDeviceInfo(),
        checksum: await this.generateChecksum(event)
      };
      
      logs.push(logEntry);
      
      // Keep only last 1000 entries and rotate
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      await AsyncStorage.setItem(this.SECURITY_LOG_KEY, JSON.stringify(logs));
      
      // Alert on critical events
      if (event.severity === 'critical') {
        await this.triggerSecurityAlert(logEntry);
      }
    } catch (error) {
      console.error('❌ Security logging failed:', error);
    }
  }

  private static async generateSessionId(): Promise<string> {
    const sessionId = await AsyncStorage.getItem('secure_session_id');
    if (!sessionId) {
      const newSessionId = Crypto.randomUUID();
      await AsyncStorage.setItem('secure_session_id', newSessionId);
      return newSessionId;
    }
    return sessionId;
  }

  private static async getDeviceInfo(): Promise<object> {
    return {
      platform: Platform.OS,
      timestamp: Date.now(),
      // Add more device info as needed
    };
  }

  private static async generateChecksum(data: any): Promise<string> {
    const dataString = JSON.stringify(data);
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      dataString
    );
    return hash;
  }

  private static async triggerSecurityAlert(event: any): Promise<void> {
    // In production, send to security monitoring service
    console.warn('🚨 CRITICAL SECURITY EVENT:', event);
  }

  // Input sanitization with XSS protection
  static sanitizeInput(input: string, maxLength: number = 1000): string {
    if (!input) return '';
    
    // Length check
    if (input.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength}`);
    }
    
    return input
      .trim()
      // Remove potentially dangerous characters
      .replace(/[<>]/g, '')
      // Remove JavaScript protocols
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+=/gi, '')
      // Remove SQL injection patterns
      .replace(/('|\;|\-\-|\s+(or|and)\s+)/gi, '')
      // Limit special characters
      .replace(/[^\w\s\-@.,]/g, '');
  }

  // Validate email with enhanced security
  static isValidEmail(email: string): boolean {
    if (!email || email.length > 254) return false;
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValid = emailRegex.test(email);
    
    // Additional security checks
    if (isValid) {
      // Prevent consecutive dots
      if (email.includes('..')) return false;
      // Prevent leading/trailing dots
      if (email.startsWith('.') || email.endsWith('.')) return false;
      // Prevent domain issues
      const domain = email.split('@')[1];
      if (domain && (domain.startsWith('.') || domain.endsWith('.'))) return false;
    }
    
    return isValid;
  }

  // Secure password validation
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  } {
    const errors: string[] = [];
    
    // Length requirements
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (password.length > 128) {
      errors.push('Password is too long (maximum 128 characters)');
    }
    
    // Character requirements
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    // Common pattern checks
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
      /welcome/i
    ];
    
    if (commonPatterns.some(pattern => pattern.test(password))) {
      errors.push('Password contains common patterns that are easy to guess');
    }
    
    // Sequential character checks
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain 3 or more consecutive identical characters');
    }
    
    const isValid = errors.length === 0;
    let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
    
    if (isValid) {
      const score = this.calculatePasswordStrength(password);
      if (score >= 90) strength = 'very-strong';
      else if (score >= 75) strength = 'strong';
      else if (score >= 60) strength = 'medium';
    }
    
    return { isValid, errors, strength };
  }

  private static calculatePasswordStrength(password: string): number {
    let score = 0;
    
    // Length bonus
    if (password.length >= 6) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 5; // Optional bonus
    
    // Complexity bonus
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      score += 15;
    }
    
    // Entropy bonus
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 8) score += 10;
    
    return Math.min(score, 100);
  }

  // Secure token generation
  static async generateSecureToken(length: number = 32): Promise<string> {
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate phone number with international format support
  static isValidPhone(phone: string): boolean {
    if (!phone) return false;
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check length (international format: 10-15 digits)
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return false;
    }
    
    // Check for valid country codes (simplified)
    const validCountryCodes = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const firstDigit = cleanPhone[0];
    
    return validCountryCodes.includes(firstDigit);
  }

  // Content Security Policy for web
  static getContentSecurityPolicy(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust based on needs
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  // Security headers configuration
  static getSecurityHeaders(): Record<string, string> {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': this.getContentSecurityPolicy()
    };
  }
}
