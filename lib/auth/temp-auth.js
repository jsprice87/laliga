const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('../email/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const SALT_ROUNDS = 12;

// Temporary in-memory user store for testing
let users = [];
let userIdCounter = 1;

// Temporary in-memory password reset tokens
let passwordResetTokens = [];

/**
 * Register a new user (in-memory version)
 */
async function registerUser(userData) {
  console.log('🔄 Attempting in-memory user registration:', { ...userData, password: '[HIDDEN]' });

  // Check if user already exists
  const existingUser = users.find(user => 
    user.email === userData.email || user.username === userData.username
  );

  if (existingUser) {
    throw new Error('User with this email or username already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

  // Create user object
  const user = {
    _id: userIdCounter++,
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    role: 'user',
    teamName: userData.teamName || null,
    preferences: {
      notifications: true,
      theme: 'retrowave'
    },
    createdAt: new Date(),
    lastLogin: null,
    isActive: true
  };

  // Save to memory
  users.push(user);
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('✅ In-memory user registration successful for:', user.username);

  return {
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      teamName: user.teamName,
      preferences: user.preferences,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    },
    token
  };
}

/**
 * Login user (in-memory version)
 */
async function loginUser(email, password) {
  console.log('🔄 Attempting in-memory user login for:', email);

  // Find user by email or username
  const userDoc = users.find(user => 
    (user.email === email || user.username === email) && user.isActive
  );

  if (!userDoc) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, userDoc.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  userDoc.lastLogin = new Date();

  // Generate JWT token
  const token = jwt.sign(
    { userId: userDoc._id, username: userDoc.username, role: userDoc.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('✅ In-memory user login successful for:', userDoc.username);

  return {
    user: {
      _id: userDoc._id,
      username: userDoc.username,
      email: userDoc.email,
      role: userDoc.role,
      teamName: userDoc.teamName,
      preferences: userDoc.preferences,
      createdAt: userDoc.createdAt,
      lastLogin: userDoc.lastLogin
    },
    token
  };
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Get user by ID (in-memory version)
 */
async function getUserById(userId) {
  const userDoc = users.find(user => user._id === userId && user.isActive);
  if (!userDoc) {
    throw new Error('User not found');
  }

  return {
    _id: userDoc._id,
    username: userDoc.username,
    email: userDoc.email,
    role: userDoc.role,
    teamName: userDoc.teamName,
    preferences: userDoc.preferences,
    createdAt: userDoc.createdAt,
    lastLogin: userDoc.lastLogin
  };
}

/**
 * Get all users (for admin)
 */
function getAllUsers() {
  return users.filter(user => user.isActive).map(user => ({
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    teamName: user.teamName,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  }));
}

/**
 * Generate password reset token and send email
 */
async function generateResetToken(email) {
  // Find user by email
  const user = users.find(u => u.email === email && u.isActive);
  if (!user) {
    throw new Error('No user found with that email address');
  }

  // Generate a secure reset token
  const resetToken = jwt.sign(
    { userId: user._id, email: user.email, type: 'password-reset' },
    JWT_SECRET,
    { expiresIn: '1h' } // Token expires in 1 hour
  );

  // Store reset token with expiration
  const tokenData = {
    token: resetToken,
    userId: user._id,
    email: user.email,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    used: false
  };

  passwordResetTokens.push(tokenData);

  console.log('🔑 Password reset token generated for:', user.email);

  // Send password reset email
  const emailResult = await emailService.sendPasswordResetEmail(
    user.email, 
    user.username, 
    resetToken
  );

  return {
    resetToken,
    user: { email: user.email, username: user.username },
    emailResult
  };
}

/**
 * Verify reset token and reset password
 */
async function resetPassword(token, newPassword) {
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }

    // Find token in store
    const tokenData = passwordResetTokens.find(t => 
      t.token === token && !t.used && new Date() < t.expiresAt
    );

    if (!tokenData) {
      throw new Error('Invalid or expired reset token');
    }

    // Find user
    const user = users.find(u => u._id === decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user password
    user.password = hashedPassword;
    user.lastPasswordReset = new Date();

    // Mark token as used
    tokenData.used = true;

    console.log('✅ Password reset successful for:', user.email);
    return { success: true, message: 'Password reset successfully' };

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid reset token');
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('Reset token has expired');
    }
    throw error;
  }
}

/**
 * Validate reset token (without resetting password)
 */
function validateResetToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'password-reset') {
      return { valid: false, error: 'Invalid token type' };
    }

    const tokenData = passwordResetTokens.find(t => 
      t.token === token && !t.used && new Date() < t.expiresAt
    );

    if (!tokenData) {
      return { valid: false, error: 'Token not found or expired' };
    }

    return { 
      valid: true, 
      email: decoded.email,
      expiresAt: tokenData.expiresAt 
    };

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token has expired' };
    }
    return { valid: false, error: 'Invalid token' };
  }
}

/**
 * Clean up expired tokens (maintenance function)
 */
function cleanupExpiredTokens() {
  const now = new Date();
  const initialCount = passwordResetTokens.length;
  
  passwordResetTokens = passwordResetTokens.filter(token => 
    new Date(token.expiresAt) > now && !token.used
  );
  
  const removedCount = initialCount - passwordResetTokens.length;
  if (removedCount > 0) {
    console.log(`🧹 Cleaned up ${removedCount} expired password reset tokens`);
  }
}

// Clean up expired tokens every 10 minutes
setInterval(cleanupExpiredTokens, 10 * 60 * 1000);

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  getUserById,
  getAllUsers,
  generateResetToken,
  resetPassword,
  validateResetToken,
  cleanupExpiredTokens
};