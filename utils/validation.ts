// Input validation and sanitization utilities
import { SecurityEnhanced } from '@/config/securityEnhanced';

export class ValidationUtils {
  // Email validation
  static isValidEmail(email: string): boolean {
    return SecurityEnhanced.isValidEmail(email);
  }

  // Phone number validation (supports international formats)
  static isValidPhone(phone: string): boolean {
    return SecurityEnhanced.isValidPhone(phone);
  }

  // Password strength validation
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const enhancedValidation = SecurityEnhanced.validatePassword(password);
    return {
      isValid: enhancedValidation.isValid,
      errors: enhancedValidation.errors,
      strength: enhancedValidation.strength === 'very-strong' ? 'strong' : enhancedValidation.strength
    };
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
    
    return Math.min(score, 100);
  }

  // Name validation
  static isValidName(name: string): boolean {
    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    const trimmedName = name.trim();
    
    return trimmedName.length >= 2 && 
           trimmedName.length <= 50 && 
           nameRegex.test(trimmedName);
  }

  // Text input sanitization
  static sanitizeInput(input: string): string {
    return SecurityEnhanced.sanitizeInput(input);
  }

  // Device type validation
  static isValidDeviceType(deviceType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(deviceType.trim());
  }

  // Service validation
  static isValidService(service: string, allowedServices: string[]): boolean {
    return allowedServices.includes(service.trim());
  }

  // Issue description validation
  static isValidIssueDescription(description: string): {
    isValid: boolean;
    error?: string;
  } {
    const trimmed = description.trim();
    
    if (trimmed.length < 10) {
      return { isValid: false, error: 'Please provide more details about the issue (minimum 10 characters)' };
    }
    
    if (trimmed.length > 1000) {
      return { isValid: false, error: 'Description is too long (maximum 1000 characters)' };
    }
    
    // Check for potential XSS
    if (/<script|javascript:|on\w+=/i.test(trimmed)) {
      return { isValid: false, error: 'Invalid characters in description' };
    }
    
    return { isValid: true };
  }

  // Comprehensive form validation
  static validateRegistrationForm(data: {
    email: string;
    password: string;
    phone?: string;
    name?: string;
  }): {
    isValid: boolean;
    errors: Record<string, string[]>;
  } {
    const errors: Record<string, string[]> = {};

    // Email validation
    if (!data.email) {
      errors.email = ['Email is required'];
    } else if (!this.isValidEmail(data.email)) {
      errors.email = ['Please enter a valid email address'];
    }

    // Password validation
    if (!data.password) {
      errors.password = ['Password is required'];
    } else {
      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors;
      }
    }

    // Phone validation (optional)
    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.phone = ['Please enter a valid phone number'];
    }

    // Name validation (optional)
    if (data.name && !this.isValidName(data.name)) {
      errors.name = ['Please enter a valid name (letters, spaces, hyphens, and apostrophes only)'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateBookingForm(data: {
    name: string;
    phone: string;
    deviceType: string;
    model: string;
    issue: string;
    service: string;
  }, allowedDeviceTypes: string[], allowedServices: string[]): {
    isValid: boolean;
    errors: Record<string, string[]>;
  } {
    const errors: Record<string, string[]> = {};

    // Name validation
    if (!data.name) {
      errors.name = ['Name is required'];
    } else if (!this.isValidName(data.name)) {
      errors.name = ['Please enter a valid name'];
    }

    // Phone validation
    if (!data.phone) {
      errors.phone = ['Phone number is required'];
    } else if (!this.isValidPhone(data.phone)) {
      errors.phone = ['Please enter a valid phone number'];
    }

    // Device type validation
    if (!data.deviceType) {
      errors.deviceType = ['Device type is required'];
    } else if (!this.isValidDeviceType(data.deviceType, allowedDeviceTypes)) {
      errors.deviceType = ['Invalid device type selected'];
    }

    // Model validation
    if (!data.model || data.model.trim().length < 2) {
      errors.model = ['Please enter a valid device model'];
    }

    // Issue validation
    const issueValidation = this.isValidIssueDescription(data.issue);
    if (!issueValidation.isValid) {
      errors.issue = [issueValidation.error!];
    }

    // Service validation
    if (!data.service) {
      errors.service = ['Service is required'];
    } else if (!this.isValidService(data.service, allowedServices)) {
      errors.service = ['Invalid service selected'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Rate limiting utilities
export class RateLimitUtils {
  private static attempts = new Map<string, { count: number; lastAttempt: number }>();

  static isRateLimited(identifier: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    // Reset if window has passed
    if (now - record.lastAttempt > windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    // Increment count
    record.count++;
    record.lastAttempt = now;

    return record.count > maxAttempts;
  }

  static getRemainingAttempts(identifier: string, maxAttempts: number, windowMs: number): number {
    const record = this.attempts.get(identifier);
    if (!record) return maxAttempts;

    const now = Date.now();
    if (now - record.lastAttempt > windowMs) return maxAttempts;

    return Math.max(0, maxAttempts - record.count);
  }

  static getLockoutTimeRemaining(identifier: string, windowMs: number): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;

    const now = Date.now();
    const timeSinceLastAttempt = now - record.lastAttempt;
    
    return Math.max(0, windowMs - timeSinceLastAttempt);
  }

  static clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }
}
