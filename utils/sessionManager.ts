import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecurityConfig } from '../config/security';

// Session management utilities
export class SessionManager {
  private static readonly SESSION_KEY = 'techphono_session';
  private static readonly LOCKOUT_KEY = 'techphono_lockout';
  private static readonly SECURITY_LOG_KEY = 'techphono_security_log';

  // Session timeout management
  static async isSessionValid(): Promise<boolean> {
    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return false;

      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      // Check if session has expired
      if (now > session.expiresAt) {
        await this.clearSession();
        return false;
      }

      // Update last activity
      session.lastActivity = now;
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      
      return true;
    } catch (error) {
      console.error('❌ Error checking session validity:', error);
      return false;
    }
  }

  static async createSession(userId: string): Promise<void> {
    try {
      const session = {
        userId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        expiresAt: Date.now() + (SecurityConfig.sessionTimeoutMinutes * 60 * 1000),
        deviceId: await this.getDeviceId()
      };

      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  }

  static async refreshSession(): Promise<void> {
    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return;

      const session = JSON.parse(sessionData);
      session.lastActivity = Date.now();
      session.expiresAt = Date.now() + (SecurityConfig.sessionTimeoutMinutes * 60 * 1000);

      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
    }
  }

  static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SESSION_KEY);
      await this.clearLockout();
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  }

  static async getSessionInfo(): Promise<{
    userId: string;
    timeRemaining: number;
    isExpiringSoon: boolean;
  } | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      const now = Date.now();
      const timeRemaining = session.expiresAt - now;
      const isExpiringSoon = timeRemaining < (5 * 60 * 1000); // 5 minutes

      return {
        userId: session.userId,
        timeRemaining,
        isExpiringSoon
      };
    } catch (error) {
      console.error('❌ Error getting session info:', error);
      return null;
    }
  }

  // Lockout management
  static async isLockedOut(identifier: string): Promise<boolean> {
    try {
      const lockoutData = await AsyncStorage.getItem(this.LOCKOUT_KEY);
      if (!lockoutData) return false;

      const lockouts = JSON.parse(lockoutData);
      const lockout = lockouts[identifier];

      if (!lockout) return false;

      const now = Date.now();
      if (now > lockout.expiresAt) {
        // Lockout expired, remove it
        delete lockouts[identifier];
        await AsyncStorage.setItem(this.LOCKOUT_KEY, JSON.stringify(lockouts));
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error checking lockout:', error);
      return false;
    }
  }

  static async setLockout(identifier: string): Promise<void> {
    try {
      const lockoutData = await AsyncStorage.getItem(this.LOCKOUT_KEY);
      const lockouts = lockoutData ? JSON.parse(lockoutData) : {};

      lockouts[identifier] = {
        lockedAt: Date.now(),
        expiresAt: Date.now() + (SecurityConfig.lockoutDurationMinutes * 60 * 1000)
      };

      await AsyncStorage.setItem(this.LOCKOUT_KEY, JSON.stringify(lockouts));
    } catch (error) {
      console.error('❌ Error setting lockout:', error);
    }
  }

  static async getLockoutTimeRemaining(identifier: string): Promise<number> {
    try {
      const lockoutData = await AsyncStorage.getItem(this.LOCKOUT_KEY);
      if (!lockoutData) return 0;

      const lockouts = JSON.parse(lockoutData);
      const lockout = lockouts[identifier];

      if (!lockout) return 0;

      const now = Date.now();
      const remaining = lockout.expiresAt - now;
      
      return Math.max(0, remaining);
    } catch (error) {
      console.error('❌ Error getting lockout time:', error);
      return 0;
    }
  }

  static async clearLockout(identifier?: string): Promise<void> {
    try {
      if (identifier) {
        const lockoutData = await AsyncStorage.getItem(this.LOCKOUT_KEY);
        if (lockoutData) {
          const lockouts = JSON.parse(lockoutData);
          delete lockouts[identifier];
          await AsyncStorage.setItem(this.LOCKOUT_KEY, JSON.stringify(lockouts));
        }
      } else {
        await AsyncStorage.removeItem(this.LOCKOUT_KEY);
      }
    } catch (error) {
      console.error('❌ Error clearing lockout:', error);
    }
  }

  // Security logging
  static async logSecurityEvent(event: {
    type: 'login_attempt' | 'login_success' | 'login_failure' | 'lockout' | 'session_expired';
    identifier: string;
    details?: any;
  }): Promise<void> {
    try {
      const logData = await AsyncStorage.getItem(this.SECURITY_LOG_KEY);
      const logs = logData ? JSON.parse(logData) : [];

      const logEntry = {
        ...event,
        timestamp: Date.now(),
        deviceId: await this.getDeviceId()
      };

      logs.push(logEntry);

      // Keep only last 1000 log entries
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      await AsyncStorage.setItem(this.SECURITY_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('❌ Error logging security event:', error);
    }
  }

  static async getSecurityLogs(limit: number = 50): Promise<any[]> {
    try {
      const logData = await AsyncStorage.getItem(this.SECURITY_LOG_KEY);
      if (!logData) return [];

      const logs = JSON.parse(logData);
      return logs.slice(-limit).reverse(); // Most recent first
    } catch (error) {
      console.error('❌ Error getting security logs:', error);
      return [];
    }
  }

  // Device fingerprinting
  private static async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('techphono_device_id');
      
      if (!deviceId) {
        // Generate a simple device ID
        deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        await AsyncStorage.setItem('techphono_device_id', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('❌ Error getting device ID:', error);
      return 'unknown_device';
    }
  }

  // Session security checks
  static async performSecurityChecks(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check if session is valid
      const isValidSession = await this.isSessionValid();
      if (!isValidSession) {
        issues.push('Session has expired');
      }

      // Check for suspicious activity patterns
      const logs = await this.getSecurityLogs(10);
      const recentFailures = logs.filter((log: any) => 
        log.type === 'login_failure' && 
        Date.now() - log.timestamp < (60 * 60 * 1000) // Last hour
      );

      if (recentFailures.length >= 5) {
        issues.push('Multiple recent login failures detected');
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('❌ Error performing security checks:', error);
      return {
        isValid: false,
        issues: ['Security check failed']
      };
    }
  }

  // Cleanup expired data
  static async cleanupExpiredData(): Promise<void> {
    try {
      // Clean expired lockouts
      const lockoutData = await AsyncStorage.getItem(this.LOCKOUT_KEY);
      if (lockoutData) {
        const lockouts = JSON.parse(lockoutData);
        const now = Date.now();
        let hasChanges = false;

        Object.keys(lockouts).forEach(key => {
          if (now > lockouts[key].expiresAt) {
            delete lockouts[key];
            hasChanges = true;
          }
        });

        if (hasChanges) {
          await AsyncStorage.setItem(this.LOCKOUT_KEY, JSON.stringify(lockouts));
        }
      }

      // Clean old security logs (older than 30 days)
      const logData = await AsyncStorage.getItem(this.SECURITY_LOG_KEY);
      if (logData) {
        const logs = JSON.parse(logData);
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        const filteredLogs = logs.filter((log: any) => log.timestamp > thirtyDaysAgo);
        
        if (filteredLogs.length !== logs.length) {
          await AsyncStorage.setItem(this.SECURITY_LOG_KEY, JSON.stringify(filteredLogs));
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning up expired data:', error);
    }
  }
}
