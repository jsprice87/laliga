// Authentication module for La Liga del Fuego Dashboard
'use strict';

/********************
 * Auth Manager Class *
 ********************/
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.token = localStorage.getItem('laliga_token');
    this.baseUrl = '/api/auth';
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.token && this.currentUser;
  }

  // Check if user is admin
  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Login user
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      this.token = data.token;
      this.currentUser = data.user;
      
      localStorage.setItem('laliga_token', this.token);
      localStorage.setItem('laliga_user', JSON.stringify(this.currentUser));

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      this.token = data.token;
      this.currentUser = data.user;
      
      localStorage.setItem('laliga_token', this.token);
      localStorage.setItem('laliga_user', JSON.stringify(this.currentUser));

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Logout user
  logout() {
    this.token = null;
    this.currentUser = null;
    
    localStorage.removeItem('laliga_token');
    localStorage.removeItem('laliga_user');
    
    // Redirect to login
    this.showAuthModal();
  }

  // Verify current session
  async verifySession() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const user = await response.json();
        this.currentUser = user;
        localStorage.setItem('laliga_user', JSON.stringify(user));
        return true;
      } else {
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Session verification error:', error);
      this.logout();
      return false;
    }
  }

  // Initialize auth state from localStorage
  async initialize() {
    const storedUser = localStorage.getItem('laliga_user');
    
    if (this.token && storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        const isValid = await this.verifySession();
        
        if (isValid) {
          this.updateUIForAuthenticatedUser();
          return true;
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        this.logout();
      }
    }
    
    this.showAuthModal();
    return false;
  }

  // Show authentication modal
  showAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.style.display = 'flex';
      this.showLoginForm();
    }
  }

  // Hide authentication modal  
  hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Show login form
  showLoginForm() {
    document.getElementById('auth-login-form').style.display = 'block';
    document.getElementById('auth-register-form').style.display = 'none';
    document.getElementById('auth-modal-title').textContent = 'LOGIN TO LA LIGA DEL FUEGO';
  }

  // Show registration form
  showRegisterForm() {
    document.getElementById('auth-login-form').style.display = 'none';
    document.getElementById('auth-register-form').style.display = 'block';
    document.getElementById('auth-modal-title').textContent = 'JOIN LA LIGA DEL FUEGO';
  }

  // Update UI for authenticated user
  updateUIForAuthenticatedUser() {
    const userInfo = document.getElementById('user-info');
    if (userInfo && this.currentUser) {
      userInfo.innerHTML = `
        <span class="user-welcome">Welcome, ${this.currentUser.username}!</span>
        <button class="btn btn-outline game-button" id="logout-btn">LOGOUT</button>
      `;
      
      // Add logout event listener
      document.getElementById('logout-btn').addEventListener('click', () => {
        this.logout();
      });
    }

    // Show/hide admin features
    const adminFeatures = document.querySelectorAll('.admin-only');
    adminFeatures.forEach(element => {
      element.style.display = this.isAdmin() ? 'block' : 'none';
    });

    this.hideAuthModal();
  }

  // Handle authentication errors
  handleAuthError(error, formId) {
    const errorDiv = document.querySelector(`#${formId} .auth-error`);
    if (errorDiv) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
  }

  // Clear authentication errors
  clearAuthError(formId) {
    const errorDiv = document.querySelector(`#${formId} .auth-error`);
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }
}

// Global auth manager instance
window.authManager = new AuthManager();

/********************
 * Auth UI Functions *
 ********************/

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();
  
  const form = event.target;
  const email = form.email.value;
  const password = form.password.value;
  
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.textContent = 'LOGGING IN...';
    submitBtn.disabled = true;
    
    authManager.clearAuthError('auth-login-form');
    
    await authManager.login(email, password);
    authManager.updateUIForAuthenticatedUser();
    
    console.log('✅ User logged in successfully');
    
    // Refresh dashboard data
    if (typeof renderLeaderboard === 'function') {
      renderLeaderboard();
    }
    
  } catch (error) {
    authManager.handleAuthError(error, 'auth-login-form');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Handle registration form submission
async function handleRegister(event) {
  event.preventDefault();
  
  const form = event.target;
  const userData = {
    username: form.username.value,
    email: form.email.value,
    password: form.password.value,
    teamName: form.teamName.value
  };
  
  const confirmPassword = form.confirmPassword.value;
  
  if (userData.password !== confirmPassword) {
    authManager.handleAuthError(new Error('Passwords do not match'), 'auth-register-form');
    return;
  }
  
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.textContent = 'CREATING ACCOUNT...';
    submitBtn.disabled = true;
    
    authManager.clearAuthError('auth-register-form');
    
    await authManager.register(userData);
    authManager.updateUIForAuthenticatedUser();
    
    console.log('✅ User registered successfully');
    
    // Refresh dashboard data
    if (typeof renderLeaderboard === 'function') {
      renderLeaderboard();
    }
    
  } catch (error) {
    authManager.handleAuthError(error, 'auth-register-form');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Set up form event listeners
  const loginForm = document.getElementById('auth-login-form');
  const registerForm = document.getElementById('auth-register-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Set up form toggle buttons
  const showRegisterBtn = document.getElementById('show-register');
  const showLoginBtn = document.getElementById('show-login');
  
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => {
      authManager.showRegisterForm();
    });
  }
  
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
      authManager.showLoginForm();
    });
  }
  
  // Initialize authentication state
  await authManager.initialize();
});