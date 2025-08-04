// Security utilities for La Liga del Fuego Dashboard
'use strict';

/********************
 * Security Class    *
 ********************/
class Security {
  constructor() {
    this.rateLimits = new Map();
    this.maxRequests = 100; // requests per minute
    this.timeWindow = 60000; // 1 minute
    this.bannedPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi
    ];
  }

  /********************
   * Input Validation  *
   ********************/

  // Sanitize HTML input
  sanitizeHTML(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Validate username (alphanumeric + underscore, 3-30 chars)
  validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  }

  // Validate password strength
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      valid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
      requirements: {
        length: password.length >= minLength,
        uppercase: hasUpperCase,
        lowercase: hasLowerCase,
        numbers: hasNumbers,
        special: hasSpecialChar
      },
      score: [
        password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      ].filter(Boolean).length
    };
  }

  // Validate team name (allow spaces, letters, numbers, some special chars)
  validateTeamName(teamName) {
    if (!teamName || teamName.length < 1 || teamName.length > 50) return false;
    const teamNameRegex = /^[a-zA-Z0-9\s\-_'.!]{1,50}$/;
    return teamNameRegex.test(teamName);
  }

  // Check for malicious patterns
  containsMaliciousCode(input) {
    if (typeof input !== 'string') return false;
    
    return this.bannedPatterns.some(pattern => pattern.test(input));
  }

  // Validate API request data
  validateApiData(data, schema) {
    const errors = [];
    
    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];
      
      // Required field validation
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} is required`);
        continue;
      }
      
      // Skip validation if field is optional and empty
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }
      
      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}`);
        continue;
      }
      
      // Length validation
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${key} must be no more than ${rules.maxLength} characters`);
      }
      
      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} format is invalid`);
      }
      
      // Custom validation
      if (rules.validator && !rules.validator(value)) {
        errors.push(rules.message || `${key} is invalid`);
      }
      
      // Malicious code check
      if (typeof value === 'string' && this.containsMaliciousCode(value)) {
        errors.push(`${key} contains invalid content`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /********************
   * Rate Limiting     *
   ********************/

  // Check if request is rate limited
  isRateLimited(identifier) {
    const now = Date.now();
    const userRequests = this.rateLimits.get(identifier) || [];
    
    // Remove old requests outside time window
    const recentRequests = userRequests.filter(time => now - time < this.timeWindow);
    
    // Check if exceeded limit
    if (recentRequests.length >= this.maxRequests) {
      logger?.warn('Rate limit exceeded', { identifier, requests: recentRequests.length });
      return true;
    }
    
    // Add current request
    recentRequests.push(now);
    this.rateLimits.set(identifier, recentRequests);
    
    return false;
  }

  // Get rate limit status
  getRateLimitStatus(identifier) {
    const now = Date.now();
    const userRequests = this.rateLimits.get(identifier) || [];
    const recentRequests = userRequests.filter(time => now - time < this.timeWindow);
    
    return {
      requests: recentRequests.length,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - recentRequests.length),
      resetTime: now + this.timeWindow
    };
  }

  /********************
   * CSRF Protection   *
   ********************/

  // Generate CSRF token
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Set CSRF token in session
  setCSRFToken() {
    const token = this.generateCSRFToken();
    sessionStorage.setItem('csrf_token', token);
    return token;
  }

  // Get CSRF token
  getCSRFToken() {
    let token = sessionStorage.getItem('csrf_token');
    if (!token) {
      token = this.setCSRFToken();
    }
    return token;
  }

  // Validate CSRF token
  validateCSRFToken(providedToken) {
    const sessionToken = sessionStorage.getItem('csrf_token');
    return sessionToken && providedToken === sessionToken;
  }

  /********************
   * Content Security  *
   ********************/

  // Secure localStorage operations
  secureStorage = {
    set: (key, value) => {
      try {
        const encrypted = this.encrypt(JSON.stringify(value));
        localStorage.setItem(key, encrypted);
        return true;
      } catch (error) {
        logger?.error('Failed to store data securely', { key, error: error.message });
        return false;
      }
    },

    get: (key) => {
      try {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        
        const decrypted = this.decrypt(encrypted);
        return JSON.parse(decrypted);
      } catch (error) {
        logger?.error('Failed to retrieve data securely', { key, error: error.message });
        return null;
      }
    },

    remove: (key) => {
      localStorage.removeItem(key);
    }
  };

  // Simple encryption for localStorage (not for sensitive data)
  encrypt(text) {
    // Simple base64 encoding with salt - not cryptographically secure
    // For production, use proper encryption libraries
    const salt = Math.random().toString(36).substring(2, 15);
    return btoa(salt + '|' + text);
  }

  decrypt(encrypted) {
    try {
      const decoded = atob(encrypted);
      const parts = decoded.split('|');
      return parts.slice(1).join('|');
    } catch (error) {
      throw new Error('Invalid encrypted data');
    }
  }

  /********************
   * API Security      *
   ********************/

  // Secure API request wrapper
  async secureApiRequest(url, options = {}) {
    // Check rate limiting
    const identifier = this.getClientIdentifier();
    if (this.isRateLimited(identifier)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': this.getCSRFToken()
      };
    }

    // Add request timestamp
    options.headers = {
      ...options.headers,
      'X-Request-Time': Date.now().toString()
    };

    // Validate request data if provided
    if (options.body && typeof options.body === 'string') {
      try {
        const data = JSON.parse(options.body);
        this.validateRequestData(data);
      } catch (error) {
        throw new Error('Invalid request data: ' + error.message);
      }
    }

    return fetch(url, options);
  }

  // Get client identifier for rate limiting
  getClientIdentifier() {
    // Use combination of IP (if available) and session
    return sessionStorage.getItem('client_id') || this.generateClientId();
  }

  generateClientId() {
    const id = 'client_' + this.generateCSRFToken().substring(0, 16);
    sessionStorage.setItem('client_id', id);
    return id;
  }

  // Validate common request data
  validateRequestData(data) {
    // Check for common attack patterns
    const jsonString = JSON.stringify(data);
    
    if (this.containsMaliciousCode(jsonString)) {
      throw new Error('Request contains invalid content');
    }

    // Check data size
    if (jsonString.length > 1024 * 1024) { // 1MB limit
      throw new Error('Request data too large');
    }

    return true;
  }

  /********************
   * Utility Methods   *
   ********************/

  // Check if running over HTTPS in production
  ensureSecureConnection() {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      logger?.warn('Insecure connection detected in production environment');
      return false;
    }
    return true;
  }

  // Clean up sensitive data from memory
  clearSensitiveData() {
    // Clear any sensitive variables
    sessionStorage.removeItem('csrf_token');
    sessionStorage.removeItem('client_id');
    
    // Clear rate limit cache
    this.rateLimits.clear();
    
    logger?.info('Sensitive data cleared from memory');
  }
}

/********************
 * Global Security   *
 ********************/

// Initialize global security instance
const security = new Security();

// Set up initial CSRF token
security.setCSRFToken();

// Make security available globally
window.security = security;

// Validation schemas for common forms
window.validationSchemas = {
  login: {
    email: {
      required: true,
      type: 'string',
      maxLength: 254,
      validator: security.validateEmail.bind(security),
      message: 'Please enter a valid email address'
    },
    password: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 128
    }
  },
  
  register: {
    username: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 30,
      validator: security.validateUsername.bind(security),
      message: 'Username must be 3-30 characters, letters, numbers, and underscores only'
    },
    email: {
      required: true,
      type: 'string',
      maxLength: 254,
      validator: security.validateEmail.bind(security),
      message: 'Please enter a valid email address'
    },
    password: {
      required: true,
      type: 'string',
      minLength: 8,
      maxLength: 128,
      validator: (password) => security.validatePassword(password).valid,
      message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
    },
    teamName: {
      required: false,
      type: 'string',
      maxLength: 50,
      validator: (name) => !name || security.validateTeamName(name),
      message: 'Team name must be 1-50 characters'
    }
  }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Security;
}

logger?.info('🔒 Security system initialized', {
  csrfEnabled: true,
  rateLimitEnabled: true,
  validationEnabled: true
});

console.log('🔒 Security system loaded successfully');