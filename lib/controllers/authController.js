/**
 * Authentication Controller - User registration, login, and password management
 * Handles user authentication, registration, password resets, and profile management
 */

const { 
  registerUser, 
  loginUser, 
  getUserById, 
  generateResetToken, 
  resetPassword, 
  validateResetToken,
  verifyToken 
} = require('../auth/temp-auth');

class AuthController {
  /**
   * Register a new user account
   * POST /api/auth/register
   * Body: { username, email, password, teamName }
   */
  static async register(req, res) {
    try {
      console.log('🔍 Register request received:', { body: req.body, headers: req.headers['content-type'] });
      
      const { username, email, password, teamName } = req.body || {};
      
      // Validate required fields
      const validation = AuthController.validateRegistration({ username, email, password });
      if (!validation.isValid) {
        console.log('❌ Missing required fields:', { username: !!username, email: !!email, password: !!password });
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.errors 
        });
      }

      console.log('🔄 Attempting to register user:', { username, email, teamName });
      const result = await registerUser({ username, email, password, teamName });
      console.log('✅ User registered successfully:', result.user.username);
      
      return res.status(201).json(result);
    } catch (error) {
      console.error('❌ Registration error:', error.message);
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * User login
   * POST /api/auth/login
   * Body: { email, password }
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body || {};
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await loginUser(email, password);
      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Login error:', error.message);
      return res.status(401).json({ error: error.message });
    }
  }

  /**
   * Get current user information
   * GET /api/auth/me
   * Headers: Authorization: Bearer <token>
   */
  static async getCurrentUser(req, res) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const decoded = verifyToken(token);
      const user = await getUserById(decoded.userId);
      return res.status(200).json(user);
    } catch (error) {
      console.error('❌ Get current user error:', error.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   * Headers: Authorization: Bearer <token>
   * Body: { username, teamName, etc. }
   */
  static async updateProfile(req, res) {
    // TODO: Implement profile update with authentication middleware
    return res.status(200).json({ 
      message: 'Profile update endpoint - authentication required',
      todo: 'Implement with proper authentication middleware' 
    });
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   * Body: { email }
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body || {};
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const result = await generateResetToken(email);
      
      console.log('🔑 Password reset requested for:', email);
      console.log('📧 Email result:', result.emailResult);
      
      // Prepare response based on email success
      let response = {
        message: 'Password reset instructions sent to your email'
      };

      // In development mode, include additional info for debugging
      if (process.env.NODE_ENV !== 'production') {
        if (result.emailResult.success) {
          response.emailSent = true;
          
          // Include preview URL for development mode (Ethereal Email)
          if (result.emailResult.previewUrl) {
            response.previewUrl = result.emailResult.previewUrl;
            response.devMessage = 'Email sent! View it at the preview URL';
          }
        } else {
          // Email failed, provide token as fallback for development
          response.emailSent = false;
          response.resetToken = result.resetToken;
          response.resetUrl = `http://localhost:8000/reset-password.html?token=${result.resetToken}`;
          response.devMessage = 'Email failed to send, using token fallback for development';
        }
      }
      
      return res.status(200).json(response);
    } catch (error) {
      console.error('❌ Password reset request error:', error.message);
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Validate password reset token
   * POST /api/auth/validate-reset-token
   * Body: { token }
   */
  static async validateResetToken(req, res) {
    try {
      const { token } = req.body || {};
      
      if (!token) {
        return res.status(400).json({ error: 'Reset token is required' });
      }

      const validation = validateResetToken(token);
      return res.status(200).json(validation);
    } catch (error) {
      console.error('❌ Token validation error:', error.message);
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   * Body: { token, newPassword }
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body || {};
      
      // Validate required fields
      const validation = AuthController.validatePasswordReset({ token, newPassword });
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.errors 
        });
      }

      const result = await resetPassword(token, newPassword);
      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Password reset error:', error.message);
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Validate user registration data
   * @param {Object} data - Registration data
   * @returns {Object} Validation result
   */
  static validateRegistration(data) {
    const { username, email, password } = data;
    const errors = [];

    if (!username) {
      errors.push('Username is required');
    }

    if (!email) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.push('Email format is invalid');
    }

    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate password reset data
   * @param {Object} data - Password reset data
   * @returns {Object} Validation result
   */
  static validatePasswordReset(data) {
    const { token, newPassword } = data;
    const errors = [];

    if (!token) {
      errors.push('Reset token is required');
    }

    if (!newPassword) {
      errors.push('New password is required');
    } else if (newPassword.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = AuthController;