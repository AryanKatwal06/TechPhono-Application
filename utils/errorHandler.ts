import AsyncStorage from '@react-native-async-storage/async-storage';

// Error categories and types
export const ErrorCategories = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  VALIDATION: 'validation',
  DATABASE: 'database',
  PERMISSION: 'permission',
  SYSTEM: 'system',
  USER_INPUT: 'user_input'
} as const;

export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

type ErrorCategory = typeof ErrorCategories[keyof typeof ErrorCategories];
type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity];

interface ErrorLog {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  stack?: string;
  userId?: string;
  deviceId?: string;
  resolved: boolean;
}

// Comprehensive error handling utilities
export class ErrorHandler {
  private static readonly ERROR_LOG_KEY = 'techphono_error_log';
  private static readonly MAX_ERROR_LOGS = 500;

  // Categorize errors based on error messages and types
  static categorizeError(error: any): ErrorCategory {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('connection') || 
        message.includes('timeout') || message.includes('fetch')) {
      return ErrorCategories.NETWORK;
    }
    
    if (message.includes('auth') || message.includes('login') || 
        message.includes('password') || message.includes('unauthorized')) {
      return ErrorCategories.AUTHENTICATION;
    }
    
    if (message.includes('validation') || message.includes('invalid') || 
        message.includes('required') || message.includes('format')) {
      return ErrorCategories.VALIDATION;
    }
    
    if (message.includes('database') || message.includes('supabase') || 
        message.includes('query') || message.includes('constraint')) {
      return ErrorCategories.DATABASE;
    }
    
    if (message.includes('permission') || message.includes('forbidden') || 
        message.includes('access') || message.includes('role')) {
      return ErrorCategories.PERMISSION;
    }
    
    if (message.includes('user') || message.includes('input') || 
        message.includes('form') || message.includes('field')) {
      return ErrorCategories.USER_INPUT;
    }
    
    return ErrorCategories.SYSTEM;
  }

  // Determine error severity
  static determineSeverity(error: any, category: ErrorCategory): ErrorSeverity {
    const message = error?.message?.toLowerCase() || '';
    
    // Critical errors
    if (message.includes('critical') || message.includes('fatal') || 
        message.includes('security') || message.includes('breach')) {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity errors
    if (category === ErrorCategories.AUTHENTICATION || 
        category === ErrorCategories.PERMISSION ||
        message.includes('error') || message.includes('failed')) {
      return ErrorSeverity.HIGH;
    }
    
    // Medium severity errors
    if (category === ErrorCategories.DATABASE || 
        category === ErrorCategories.NETWORK ||
        message.includes('warning') || message.includes('timeout')) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Low severity errors
    return ErrorSeverity.LOW;
  }

  // Create user-friendly error messages
  static getUserFriendlyMessage(error: any, category: ErrorCategory): string {
    const message = error?.message || '';
    
    switch (category) {
      case ErrorCategories.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';
      
      case ErrorCategories.AUTHENTICATION:
        if (message.includes('invalid credentials')) {
          return 'Invalid email or password. Please try again.';
        }
        if (message.includes('locked')) {
          return 'Account temporarily locked due to multiple failed attempts. Please try again later.';
        }
        return 'Authentication failed. Please check your credentials and try again.';
      
      case ErrorCategories.VALIDATION:
        if (message.includes('email')) {
          return 'Please enter a valid email address.';
        }
        if (message.includes('password')) {
          return 'Password does not meet the security requirements.';
        }
        return 'Please check your input and try again.';
      
      case ErrorCategories.DATABASE:
        return 'A database error occurred. Please try again later.';
      
      case ErrorCategories.PERMISSION:
        return 'You don\'t have permission to perform this action.';
      
      case ErrorCategories.USER_INPUT:
        return 'Please check the form fields and correct any errors.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Log errors securely
  static async logError(error: any, context?: {
    userId?: string;
    action?: string;
    additionalData?: any;
  }): Promise<void> {
    try {
      const category = this.categorizeError(error);
      const severity = this.determineSeverity(error, category);
      
      const errorLog: ErrorLog = {
        id: this.generateErrorId(),
        timestamp: Date.now(),
        category,
        severity,
        message: error?.message || 'Unknown error',
        details: {
          ...context?.additionalData,
          action: context?.action,
          originalError: error?.message,
          errorType: error?.constructor?.name
        },
        stack: error?.stack,
        userId: context?.userId,
        deviceId: await this.getDeviceId(),
        resolved: false
      };

      // Store error log
      await this.storeErrorLog(errorLog);

      // Log to console in development
      if (process.env.EXPO_PUBLIC_DEV_MODE === 'true') {
        console.error(`🔴 ${severity.toUpperCase()} ${category} Error:`, errorLog);
      }
    } catch (loggingError) {
      console.error('❌ Failed to log error:', loggingError);
    }
  }

  // Store error log in local storage
  private static async storeErrorLog(errorLog: ErrorLog): Promise<void> {
    try {
      const logs = await this.getErrorLogs();
      logs.push(errorLog);

      // Keep only the most recent logs
      if (logs.length > this.MAX_ERROR_LOGS) {
        logs.splice(0, logs.length - this.MAX_ERROR_LOGS);
      }

      await AsyncStorage.setItem(this.ERROR_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('❌ Failed to store error log:', error);
    }
  }

  // Get error logs
  static async getErrorLogs(limit: number = 100): Promise<ErrorLog[]> {
    try {
      const logsData = await AsyncStorage.getItem(this.ERROR_LOG_KEY);
      const logs: ErrorLog[] = logsData ? JSON.parse(logsData) : [];
      
      return logs
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to get error logs:', error);
      return [];
    }
  }

  // Generate unique error ID
  private static generateErrorId(): string {
    return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get device ID
  private static async getDeviceId(): Promise<string> {
    try {
      const deviceId = await AsyncStorage.getItem('techphono_device_id');
      return deviceId || 'unknown_device';
    } catch (error) {
      return 'unknown_device';
    }
  }

  // Wrap async functions with error handling
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: {
      operationName?: string;
      userId?: string;
      rethrow?: boolean;
    }
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      await this.logError(error, {
        userId: context?.userId,
        action: context?.operationName,
        additionalData: { context: 'withErrorHandling' }
      });

      const category = this.categorizeError(error);
      const userMessage = this.getUserFriendlyMessage(error, category);

      if (context?.rethrow) {
        throw error;
      }

      return { success: false, error: userMessage };
    }
  }
}

// Export for convenience
export const handleAsyncError = ErrorHandler.withErrorHandling;
export const logError = ErrorHandler.logError;
export const getUserFriendlyError = ErrorHandler.getUserFriendlyMessage;
