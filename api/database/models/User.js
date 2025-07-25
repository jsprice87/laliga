const { ObjectId } = require('mongodb');

class User {
  constructor(userData) {
    this._id = userData._id || new ObjectId();
    this.username = userData.username;
    this.email = userData.email;
    this.password = userData.password; // Will be hashed
    this.role = userData.role || 'user'; // 'user', 'admin'
    this.espnOwnerId = userData.espnOwnerId || null; // Link to ESPN team owner
    this.teamName = userData.teamName || null; // Their fantasy team name
    this.preferences = userData.preferences || {
      notifications: true,
      theme: 'retrowave'
    };
    this.createdAt = userData.createdAt || new Date();
    this.lastLogin = userData.lastLogin || null;
    this.isActive = userData.isActive !== undefined ? userData.isActive : true;
  }

  // Convert to database document
  toDocument() {
    return {
      _id: this._id,
      username: this.username,
      email: this.email,
      password: this.password,
      role: this.role,
      espnOwnerId: this.espnOwnerId,
      teamName: this.teamName,
      preferences: this.preferences,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin,
      isActive: this.isActive
    };
  }

  // Create from database document
  static fromDocument(doc) {
    return new User(doc);
  }

  // Remove sensitive data for client
  toPublic() {
    return {
      _id: this._id,
      username: this.username,
      email: this.email,
      role: this.role,
      teamName: this.teamName,
      preferences: this.preferences,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin
    };
  }
}

module.exports = User;