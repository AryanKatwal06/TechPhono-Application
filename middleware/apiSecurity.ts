import { SecurityEnhanced } from '@/config/securityEnhanced';
import { supabase } from '@/services/supabaseClient';

// API Security Middleware
export class APISecurity {
  private static readonly REQUEST_LOG_KEY = 'api_request_log';
  private static readonly SUSPICIOUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /union\s+select/gi,
    /drop\s+table/gi,
    /insert\s+into/gi,
    /delete\s+from/gi,
    /update\s+set/gi
  ];

  // Request validation and sanitization
  static async validateRequest(requestData: {
    method: string;
    endpoint: string;
    body?: any;
    headers?: Record<string, string>;
    userId?: string;
  }): Promise<{ valid: boolean; errors: string[]; sanitized?: any }> {
    const errors: string[] = [];
    let sanitized = requestData.body;

    // Check rate limiting
    const identifier = requestData.userId || 'anonymous';
    const rateLimitResult = await SecurityEnhanced.checkRateLimit(
      `${identifier}:${requestData.endpoint}`,
      20, // 20 requests per minute
      60000
    );

    if (!rateLimitResult.allowed) {
      errors.push(`Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.remainingTime || 0) / 1000)} seconds`);
    }

    // Validate HTTP method
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!allowedMethods.includes(requestData.method.toUpperCase())) {
      errors.push('Invalid HTTP method');
    }

    // Validate endpoint
    if (!this.isValidEndpoint(requestData.endpoint)) {
      errors.push('Invalid endpoint');
    }

    // Sanitize and validate body if present
    if (requestData.body) {
      const bodyValidation = this.sanitizeAndValidateBody(requestData.body);
      if (!bodyValidation.valid) {
        errors.push(...bodyValidation.errors);
      }
      sanitized = bodyValidation.sanitized;
    }

    // Log the request for security monitoring
    await this.logRequest({
      ...requestData,
      body: sanitized,
      valid: errors.length === 0,
      errors
    });

    return {
      valid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // CSRF Protection
  static async generateCSRFToken(userId: string): Promise<string> {
    const token = await SecurityEnhanced.generateSecureToken(32);
    const tokenData = {
      token,
      userId,
      timestamp: Date.now(),
      userAgent: 'mobile-app' // In real app, get from request
    };

    // Store token securely
    await this.storeCSRFToken(userId, tokenData);
    return token;
  }

  static async validateCSRFToken(
    userId: string, 
    token: string
  ): Promise<boolean> {
    try {
      const storedTokenData = await this.getCSRFToken(userId);
      if (!storedTokenData) return false;

      // Check if token matches
      if (storedTokenData.token !== token) return false;

      // Check if token is not expired (1 hour)
      const isExpired = Date.now() - storedTokenData.timestamp > 3600000;
      if (isExpired) {
        await this.deleteCSRFToken(userId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ CSRF validation error:', error);
      return false;
    }
  }

  private static async storeCSRFToken(userId: string, tokenData: any): Promise<void> {
    const key = `csrf_token_${userId}`;
    await supabase
      .from('security_tokens')
      .upsert({
        user_id: userId,
        token_type: 'csrf',
        token_data: JSON.stringify(tokenData),
        expires_at: new Date(Date.now() + 3600000).toISOString()
      })
      .eq('user_id', userId)
      .eq('token_type', 'csrf');
  }

  private static async getCSRFToken(userId: string): Promise<any> {
    const { data } = await supabase
      .from('security_tokens')
      .select('token_data')
      .eq('user_id', userId)
      .eq('token_type', 'csrf')
      .single();

    return data ? JSON.parse(data.token_data) : null;
  }

  private static async deleteCSRFToken(userId: string): Promise<void> {
    await supabase
      .from('security_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token_type', 'csrf');
  }

  // Input sanitization for API requests
  private static sanitizeAndValidateBody(body: any): {
    valid: boolean;
    errors: string[];
    sanitized: any;
  } {
    const errors: string[] = [];
    const sanitized: any = {};

    try {
      // Recursively sanitize object
      const sanitizeObject = (obj: any): any => {
        if (typeof obj === 'string') {
          return this.sanitizeString(obj);
        }
        if (Array.isArray(obj)) {
          return obj.map(sanitizeObject);
        }
        if (typeof obj === 'object' && obj !== null) {
          const sanitizedObj: any = {};
          for (const [key, value] of Object.entries(obj)) {
            // Sanitize key names too
            const sanitizedKey = this.sanitizeString(key);
            sanitizedObj[sanitizedKey] = sanitizeObject(value);
          }
          return sanitizedObj;
        }
        return obj;
      };

      const sanitizedBody = sanitizeObject(body);

      // Check for suspicious patterns
      const bodyString = JSON.stringify(sanitizedBody);
      for (const pattern of this.SUSPICIOUS_PATTERNS) {
        if (pattern.test(bodyString)) {
          errors.push('Request contains potentially malicious content');
          break;
        }
      }

      // Size validation
      const bodySize = JSON.stringify(sanitizedBody).length;
      if (bodySize > 1024 * 1024) { // 1MB limit
        errors.push('Request body too large');
      }

      return {
        valid: errors.length === 0,
        errors,
        sanitized: sanitizedBody
      };
    } catch (error) {
      errors.push('Invalid request body format');
      return {
        valid: false,
        errors,
        sanitized: {}
      };
    }
  }

  private static sanitizeString(input: string): string {
    if (typeof input !== 'string') return input;
    
    return SecurityEnhanced.sanitizeInput(input, 10000);
  }

  private static isValidEndpoint(endpoint: string): boolean {
    // Whitelist of valid endpoints
    const validEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/logout',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/api/repairs',
      '/api/repairs/create',
      '/api/repairs/update',
      '/api/repairs/delete',
      '/api/cart',
      '/api/products',
      '/api/feedback'
    ];

    // Check if endpoint starts with any valid endpoint
    return validEndpoints.some(valid => endpoint.startsWith(valid));
  }

  // Request logging for security monitoring
  private static async logRequest(requestData: {
    method: string;
    endpoint: string;
    body?: any;
    userId?: string;
    valid: boolean;
    errors: string[];
  }): Promise<void> {
    const logEntry = {
      timestamp: Date.now(),
      method: requestData.method,
      endpoint: requestData.endpoint,
      userId: requestData.userId || 'anonymous',
      valid: requestData.valid,
      errors: requestData.errors,
      userAgent: 'mobile-app', // In real app, get from request
      ipAddress: 'mobile-device' // In real app, get from request
    };

    // Store in security logs
    await SecurityEnhanced.logSecurityEvent({
      type: requestData.valid ? 'data_access' : 'suspicious_activity',
      userId: requestData.userId,
      identifier: `${requestData.method}:${requestData.endpoint}`,
      details: logEntry,
      severity: requestData.valid ? 'low' : 'medium'
    });
  }

  // Response security headers
  static getSecureResponseHeaders(): Record<string, string> {
    return {
      ...SecurityEnhanced.getSecurityHeaders(),
      'X-Request-ID': this.generateRequestId(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    };
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Data validation for specific API endpoints
  static validateRepairData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Name is required and must be a string');
    }
    if (!data.phone || typeof data.phone !== 'string') {
      errors.push('Phone is required and must be a string');
    }
    if (!data.deviceType || typeof data.deviceType !== 'string') {
      errors.push('Device type is required and must be a string');
    }
    if (!data.issue || typeof data.issue !== 'string') {
      errors.push('Issue description is required and must be a string');
    }
    if (!data.service || typeof data.service !== 'string') {
      errors.push('Service is required and must be a string');
    }

    // Field validations
    if (data.name && (data.name.length < 2 || data.name.length > 100)) {
      errors.push('Name must be between 2 and 100 characters');
    }
    if (data.phone && !SecurityEnhanced.isValidPhone(data.phone)) {
      errors.push('Invalid phone number format');
    }
    if (data.issue && (data.issue.length < 10 || data.issue.length > 1000)) {
      errors.push('Issue description must be between 10 and 1000 characters');
    }
    if (data.model && data.model.length > 100) {
      errors.push('Model must be less than 100 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Authentication token validation
  static async validateAuthToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      if (!token || typeof token !== 'string') {
        return { valid: false, error: 'Invalid token format' };
      }

      // Check token length
      if (token.length < 10 || token.length > 500) {
        return { valid: false, error: 'Invalid token length' };
      }

      // Validate with Supabase
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        return { valid: false, error: error.message };
      }

      if (!data.user) {
        return { valid: false, error: 'User not found' };
      }

      return { valid: true, userId: data.user.id };
    } catch (error) {
      return { valid: false, error: 'Token validation failed' };
    }
  }
}
