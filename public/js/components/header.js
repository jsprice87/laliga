/**
 * Header Component
 * Manages league header, year selector, and status display
 */

import { Logger } from '../utils/logger.js';

export class Header {
  constructor(state) {
    this.state = state;
    this.logger = new Logger('Header');
  }

  /**
   * Initialize header
   */
  init() {
    this.setupYearSelector();
    this.updateDisplay();
    this.logger.component('Header', 'initialized');
  }

  /**
   * Setup year selector functionality
   */
  setupYearSelector() {
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        const selectedYear = parseInt(e.target.value);
        this.handleYearChange(selectedYear);
      });
    }
  }

  /**
   * Handle year selection change
   */
  handleYearChange(year) {
    this.logger.userAction('year_change', { year });
    
    // Update state
    this.state.setCurrentYear(year);
    
    // Update display
    this.updateSeasonDisplay(year);
    
    // Fire year change event for other components to listen
    const event = new CustomEvent('yearchange', { detail: { year } });
    document.dispatchEvent(event);
  }

  /**
   * Update season display based on year
   */
  updateSeasonDisplay(year) {
    // Update logo subtitle
    const logoSubtitle = document.querySelector('.logo-subtitle');
    if (logoSubtitle) {
      logoSubtitle.textContent = `FANTASY FOOTBALL '${year.toString().slice(-2)}`;
    }

    // Update season status
    const currentIndicator = document.getElementById('current-indicator');
    if (currentIndicator) {
      if (year === 2025) {
        currentIndicator.textContent = 'CURRENT SEASON';
      } else {
        currentIndicator.textContent = 'SEASON TOTALS';
      }
    }

    // Update live indicator
    const liveIndicator = document.getElementById('live-indicator');
    if (liveIndicator) {
      const span = liveIndicator.querySelector('span:last-child');
      if (span) {
        if (year === 2025) {
          span.textContent = 'LIVE SEASON ACTIVE';
        } else {
          span.textContent = 'SEASON COMPLETE';
        }
      }
    }

    // Update league status
    this.updateLeagueStatus(year);
  }

  /**
   * Update league status display
   */
  updateLeagueStatus(year) {
    const statusElement = document.querySelector('#user-info .stat-value');
    if (statusElement) {
      if (year === 2025) {
        statusElement.textContent = 'PRE-SEASON';
      } else {
        statusElement.textContent = 'COMPLETE';
      }
    }
  }

  /**
   * Update header statistics
   */
  updateStats(stats = {}) {
    const league = this.state.getLeague();
    
    // Update prize pool
    const prizePoolElement = document.querySelector('.stat-box:nth-child(2) .stat-value');
    if (prizePoolElement) {
      prizePoolElement.textContent = `$${(stats.prizePool || league.prizePool).toLocaleString()}`;
    }

    // Update teams count
    const teamsCountElement = document.querySelector('.stat-box:nth-child(3) .stat-value');
    if (teamsCountElement) {
      teamsCountElement.textContent = stats.teamCount || league.teams;
    }
  }

  /**
   * Update current week display
   */
  updateCurrentWeek(week) {
    const currentWeek = this.state.getCurrentWeek();
    
    // Update any week displays in header if needed
    const weekElements = document.querySelectorAll('.current-week');
    weekElements.forEach(element => {
      element.textContent = week || currentWeek;
    });
  }

  /**
   * Set loading state
   */
  setLoading(isLoading) {
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      yearSelect.disabled = isLoading;
      
      if (isLoading) {
        yearSelect.style.opacity = '0.5';
      } else {
        yearSelect.style.opacity = '1';
      }
    }
  }

  /**
   * Add year option to selector
   */
  addYearOption(year, selected = false) {
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      const existingOption = yearSelect.querySelector(`option[value="${year}"]`);
      if (!existingOption) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (selected) {
          option.selected = true;
        }
        
        // Insert in correct chronological order (newest first)
        const options = Array.from(yearSelect.options);
        let inserted = false;
        
        for (let i = 0; i < options.length; i++) {
          if (parseInt(options[i].value) < year) {
            yearSelect.insertBefore(option, options[i]);
            inserted = true;
            break;
          }
        }
        
        if (!inserted) {
          yearSelect.appendChild(option);
        }
      }
    }
  }

  /**
   * Remove year option from selector
   */
  removeYearOption(year) {
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      const option = yearSelect.querySelector(`option[value="${year}"]`);
      if (option) {
        option.remove();
      }
    }
  }

  /**
   * Set selected year in selector
   */
  setSelectedYear(year) {
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      yearSelect.value = year;
      this.updateSeasonDisplay(year);
    }
  }

  /**
   * Get available years from selector
   */
  getAvailableYears() {
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      return Array.from(yearSelect.options).map(option => parseInt(option.value));
    }
    return [];
  }

  /**
   * Update entire header display
   */
  updateDisplay() {
    const currentYear = this.state.getCurrentYear();
    const league = this.state.getLeague();
    
    this.updateSeasonDisplay(currentYear);
    this.updateStats();
    this.setSelectedYear(currentYear);
  }

  /**
   * Refresh header with current state
   */
  refresh() {
    this.updateDisplay();
  }

  /**
   * Handle data loading states
   */
  showDataLoading() {
    this.setLoading(true);
    
    // Add loading indicator to stats
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(element => {
      if (!element.dataset.originalValue) {
        element.dataset.originalValue = element.textContent;
      }
      element.textContent = '...';
    });
  }

  /**
   * Hide data loading states
   */
  hideDataLoading() {
    this.setLoading(false);
    
    // Restore original values
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(element => {
      if (element.dataset.originalValue) {
        element.textContent = element.dataset.originalValue;
        delete element.dataset.originalValue;
      }
    });
  }

  /**
   * Show error state
   */
  showError(message) {
    this.logger.error('Header error:', message);
    
    // Could show error indicator in header
    const statusElement = document.querySelector('#user-info .stat-value');
    if (statusElement) {
      statusElement.textContent = 'ERROR';
      statusElement.style.color = 'var(--game-red)';
    }
  }

  /**
   * Clear error state
   */
  clearError() {
    const statusElement = document.querySelector('#user-info .stat-value');
    if (statusElement) {
      statusElement.style.color = '';
      this.updateDisplay();
    }
  }
}