/**
 * Navigation Component
 * Handles main navigation between sections
 */

import { Logger } from '../utils/logger.js';

export class Navigation {
  constructor(state) {
    this.state = state;
    this.logger = new Logger('Navigation');
    this.sectionChangeCallbacks = [];
  }

  /**
   * Initialize navigation
   */
  init() {
    this.setupEventListeners();
    this.logger.component('Navigation', 'initialized');
  }

  /**
   * Setup navigation event listeners
   */
  setupEventListeners() {
    const navButtons = document.querySelectorAll('.nav-button');
    
    navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = button.getAttribute('data-tab');
        this.navigateToSection(sectionId);
      });
    });
  }

  /**
   * Navigate to section
   */
  navigateToSection(sectionId) {
    this.logger.userAction('navigate', { section: sectionId });
    
    // Update state
    this.state.setCurrentSection(sectionId);
    
    // Update UI
    this.setActiveSection(sectionId);
    
    // Notify listeners
    this.notifySectionChange(sectionId);
  }

  /**
   * Set active section in navigation
   */
  setActiveSection(sectionId) {
    // Remove active class from all buttons
    document.querySelectorAll('.nav-button').forEach(button => {
      button.classList.remove('active');
    });

    // Add active class to selected button
    const activeButton = document.querySelector(`[data-tab="${sectionId}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  /**
   * Subscribe to section changes
   */
  onSectionChange(callback) {
    this.sectionChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.sectionChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.sectionChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify section change listeners
   */
  notifySectionChange(sectionId) {
    this.sectionChangeCallbacks.forEach(callback => callback(sectionId));
  }

  /**
   * Get current active section
   */
  getActiveSection() {
    const activeButton = document.querySelector('.nav-button.active');
    return activeButton ? activeButton.getAttribute('data-tab') : 'dashboard';
  }

  /**
   * Enable/disable navigation (for loading states)
   */
  setEnabled(enabled) {
    const navButtons = document.querySelectorAll('.nav-button');
    
    navButtons.forEach(button => {
      if (enabled) {
        button.removeAttribute('disabled');
        button.style.opacity = '1';
        button.style.pointerEvents = 'auto';
      } else {
        button.setAttribute('disabled', 'true');
        button.style.opacity = '0.5';
        button.style.pointerEvents = 'none';
      }
    });
  }

  /**
   * Add visual indicator for sections with new content
   */
  addNotificationIndicator(sectionId) {
    const button = document.querySelector(`[data-tab="${sectionId}"]`);
    if (button && !button.querySelector('.notification-dot')) {
      const dot = document.createElement('span');
      dot.className = 'notification-dot';
      dot.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        width: 8px;
        height: 8px;
        background: var(--game-red);
        border-radius: 50%;
        animation: pulse 2s infinite;
      `;
      button.style.position = 'relative';
      button.appendChild(dot);
    }
  }

  /**
   * Remove notification indicator
   */
  removeNotificationIndicator(sectionId) {
    const button = document.querySelector(`[data-tab="${sectionId}"]`);
    if (button) {
      const dot = button.querySelector('.notification-dot');
      if (dot) {
        dot.remove();
      }
    }
  }

  /**
   * Update navigation based on current state
   */
  refresh() {
    const currentSection = this.state.getCurrentSection();
    this.setActiveSection(currentSection);
  }
}