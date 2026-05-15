import { Platform } from 'react-native';

export class APKErrorHandler {
  private static errorCount = 0;
  private static lastErrorTime = 0;
  private static readonly MAX_ERRORS_PER_MINUTE = 10;

  /**
   * Global error handler for APK-specific issues
   */
  static handleGlobalError(error: Error, errorInfo?: any): void {
    const now = Date.now();
    
    // Reset error count if it's been more than a minute
    if (now - this.lastErrorTime > 60000) {
      this.errorCount = 0;
    }
    
    this.errorCount++;
    this.lastErrorTime = now;
    
    // Log error with context
    console.error('APK Error Handler:', {
      error: error.message,
      stack: error.stack,
      errorCount: this.errorCount,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      errorInfo
    });

    // Prevent error cascades
    if (this.errorCount > this.MAX_ERRORS_PER_MINUTE) {
      console.warn('Too many errors detected; implementing error throttling');
      this.performEmergencyRecovery();
    }
  }

  /**
   * Handle Firebase initialization errors
   */
  static handleFirebaseError(error: any): string | null {
    console.error('Firebase Error:', error);
    
    if (!error.code && !error.message) {
      return 'Firebase connection failed. Please check your internet connection.';
    }

    switch (error.code) {
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later.';
      case 'auth/invalid-api-key':
        return 'Configuration error. Please reinstall the app.';
      case 'auth/project-not-found':
        return 'Service configuration error. Please contact support.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  /**
   * Handle network-related errors
   */
  static handleNetworkError(error: any): string | null {
    console.error('Network Error:', error);
    
    if (error.message?.includes('Network request failed')) {
      return 'Unable to connect. Please check your internet connection.';
    }
    
    if (error.message?.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    return error.message || 'Network error occurred.';
  }

  /**
   * Handle async storage errors
   */
  static handleStorageError(error: any): void {
    console.error('Storage Error:', error);
    
    // Clear corrupted storage if needed
    if (error.message?.includes('corrupted') || error.message?.includes('invalid')) {
      this.clearCorruptedStorage();
    }
  }

  /**
   * Handle camera and media errors
   */
  static handleCameraError(error: any): string | null {
    console.error('Camera Error:', error);
    
    if (error.message?.includes('denied')) {
      return 'Camera permission denied. Please enable camera access in settings.';
    }
    
    if (error.message?.includes('unavailable')) {
      return 'Camera is not available on this device.';
    }
    
    return 'Camera operation failed. Please try again.';
  }

  /**
   * Emergency recovery procedures
   */
  private static performEmergencyRecovery(): void {
    console.warn('Performing emergency recovery...');
    
    try {
      // Clear any potentially corrupted caches
      this.clearCorruptedStorage();
      
      // Reset error counters
      this.errorCount = 0;
      this.lastErrorTime = 0;
    } catch (recoveryError) {
      console.error('Emergency recovery failed:', recoveryError);
    }
  }

  /**
   * Clear potentially corrupted storage
   */
  private static clearCorruptedStorage(): void {
    try {
      // This would be implemented with AsyncStorage.clear() if needed
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Validate app state before critical operations
   */
  static validateAppState(): { valid: boolean; error?: string } {
    try {
      // Check platform
      if (Platform.OS === 'web') {
        return { valid: true }; // Web validation handled separately
      }

      // Check for common APK issues
      const issues: string[] = [];

      // Add more validation as needed
      if (issues.length > 0) {
        return { 
          valid: false, 
          error: `App state issues detected: ${issues.join(', ')}` 
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('App state validation failed:', error);
      return { 
        valid: false, 
        error: 'App state validation failed' 
      };
    }
  }

  /**
   * Safe async operation wrapper
   */
  static async safeAsyncOperation<T>(
    operation: () => Promise<T>,
    errorHandler?: (error: any) => string | null
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const errorMessage = errorHandler 
        ? errorHandler(error) 
        : this.handleGenericError(error);
      
      return { 
        success: false, 
        error: errorMessage || 'Operation failed' 
      };
    }
  }

  /**
   * Generic error handler
   */
  private static handleGenericError(error: any): string {
    console.error('Generic Error:', error);
    
    if (error.message) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Create safe navigation function
   */
  static createSafeNavigation(navigationFunction: () => void): void {
    try {
      navigationFunction();
    } catch (error) {
      console.error('Navigation Error:', error);
      // Fallback navigation could be implemented here
    }
  }
}

export default APKErrorHandler;
