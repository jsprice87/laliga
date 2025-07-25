const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connectToMongoDB } = require('../database/connect');
const User = require('../database/models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const SALT_ROUNDS = 12;

/**
 * Register a new user
 */
async function registerUser(userData) {
  const db = await connectToMongoDB();
  const usersCollection = db.collection('users');

  // Check if user already exists
  const existingUser = await usersCollection.findOne({ 
    $or: [
      { email: userData.email },
      { username: userData.username }
    ]
  });

  if (existingUser) {
    throw new Error('User with this email or username already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

  // Create user object
  const user = new User({
    ...userData,
    password: hashedPassword
  });

  // Save to database
  const result = await usersCollection.insertOne(user.toDocument());
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: result.insertedId, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: user.toPublic(),
    token
  };
}

/**
 * Login user
 */
async function loginUser(email, password) {
  const db = await connectToMongoDB();
  const usersCollection = db.collection('users');

  // Find user by email or username
  const userDoc = await usersCollection.findOne({
    $or: [
      { email: email },
      { username: email }
    ],
    isActive: true
  });

  if (!userDoc) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, userDoc.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await usersCollection.updateOne(
    { _id: userDoc._id },
    { $set: { lastLogin: new Date() } }
  );

  const user = User.fromDocument(userDoc);

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: user.toPublic(),
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
 * Get user by ID
 */
async function getUserById(userId) {
  const db = await connectToMongoDB();
  const usersCollection = db.collection('users');

  const userDoc = await usersCollection.findOne({ _id: userId, isActive: true });
  if (!userDoc) {
    throw new Error('User not found');
  }

  return User.fromDocument(userDoc).toPublic();
}

/**
 * Update user profile
 */
async function updateUserProfile(userId, updateData) {
  const db = await connectToMongoDB();
  const usersCollection = db.collection('users');

  // Remove sensitive fields that shouldn't be updated via this method
  const { password, role, _id, createdAt, ...safeUpdateData } = updateData;

  const result = await usersCollection.updateOne(
    { _id: userId, isActive: true },
    { $set: safeUpdateData }
  );

  if (result.matchedCount === 0) {
    throw new Error('User not found');
  }

  return getUserById(userId);
}

/**
 * Change user password
 */
async function changePassword(userId, currentPassword, newPassword) {
  const db = await connectToMongoDB();
  const usersCollection = db.collection('users');

  const userDoc = await usersCollection.findOne({ _id: userId, isActive: true });
  if (!userDoc) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, userDoc.password);
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await usersCollection.updateOne(
    { _id: userId },
    { $set: { password: hashedPassword } }
  );

  return { success: true };
}

/**
 * Middleware to authenticate requests
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to require admin role
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  getUserById,
  updateUserProfile,
  changePassword,
  authenticateToken,
  requireAdmin
};