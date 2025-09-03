/**
 * Simple Router for Single Page Application
 * Handles URL-based navigation and browser history
 */

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.listeners = [];
  }

  /**
   * Initialize router
   */
  init() {
    // Register default routes
    this.addRoute('/', () => this.navigate('dashboard'));
    this.addRoute('/dashboard', () => this.showSection('dashboard'));
    this.addRoute('/leaderboard', () => this.showSection('dashboard'));
    this.addRoute('/matchups', () => this.showSection('matchups'));
    this.addRoute('/teams', () => this.showSection('teams'));
    this.addRoute('/playoff-bracket', () => this.showSection('playoff-bracket'));
    this.addRoute('/money', () => this.showSection('money'));
    this.addRoute('/commentary', () => this.showSection('commentary'));
    this.addRoute('/rules', () => this.showSection('rules'));

    // Listen for browser navigation
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });

    // Handle initial route
    this.handleRoute();
  }

  /**
   * Add route handler
   */
  addRoute(path, handler) {
    this.routes.set(path, handler);
  }

  /**
   * Navigate to path
   */
  navigate(path, pushState = true) {
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    
    if (pushState && window.location.pathname !== fullPath) {
      window.history.pushState({}, '', fullPath);
    }
    
    this.currentRoute = fullPath;
    this.handleRoute();
  }

  /**
   * Handle current route
   */
  handleRoute() {
    const path = window.location.pathname;
    const handler = this.routes.get(path);
    
    if (handler) {
      handler();
    } else {
      // Default to dashboard if route not found
      this.navigate('dashboard', false);
    }
    
    // Notify listeners
    this.notifyListeners(path);
  }

  /**
   * Show section (main navigation)
   */
  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Update navigation
    this.updateNavigation(sectionId);
    
    // Update URL if needed
    const expectedPath = `/${sectionId}`;
    if (window.location.pathname !== expectedPath) {
      window.history.replaceState({}, '', expectedPath);
    }
  }

  /**
   * Update navigation UI
   */
  updateNavigation(sectionId) {
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-button').forEach(button => {
      button.classList.remove('active');
    });

    // Add active class to current section button
    const activeButton = document.querySelector(`[data-tab="${sectionId}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  /**
   * Add route change listener
   */
  onRouteChange(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify route change listeners
   */
  notifyListeners(path) {
    this.listeners.forEach(callback => callback(path));
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute || window.location.pathname;
  }

  /**
   * Check if route is active
   */
  isActiveRoute(path) {
    return this.getCurrentRoute() === path;
  }

  /**
   * Get route parameters (for future URL params support)
   */
  getRouteParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    
    for (const [key, value] of urlParams) {
      params[key] = value;
    }
    
    return params;
  }

  /**
   * Update URL parameters
   */
  updateParams(params, replaceState = true) {
    const url = new URL(window.location);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    
    if (replaceState) {
      window.history.replaceState({}, '', url);
    } else {
      window.history.pushState({}, '', url);
    }
  }

  /**
   * Navigate back
   */
  back() {
    window.history.back();
  }

  /**
   * Navigate forward
   */
  forward() {
    window.history.forward();
  }
}