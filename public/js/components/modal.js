/**
 * Modal Component
 * Handles team detail modal display
 */

import { Logger } from '../utils/logger.js';

export class Modal {
  constructor(state) {
    this.state = state;
    this.logger = new Logger('Modal');
    this.isOpen = false;
  }

  init() {
    this.setupEventListeners();
    this.logger.component('Modal', 'initialized');
  }

  setupEventListeners() {
    // Listen for team modal open events
    document.addEventListener('openteammodal', (e) => {
      const { team, teamId } = e.detail;
      if (team) {
        this.openTeamModal(team);
      } else if (teamId) {
        const teamData = this.state.getTeamById(teamId);
        if (teamData) {
          this.openTeamModal(teamData);
        }
      }
    });

    // Close modal handlers
    const closeButton = document.getElementById('close-modal');
    const overlay = document.getElementById('team-modal-overlay');
    
    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeModal());
    }
    
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal();
        }
      });
    }

    // Escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeModal();
      }
    });
  }

  openTeamModal(team) {
    this.logger.userAction('team_modal_open', { teamId: team.id });
    
    const overlay = document.getElementById('team-modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalTeamName = document.getElementById('modal-team-name');
    
    if (!overlay || !modalBody || !modalTeamName) {
      this.logger.error('Modal elements not found');
      return;
    }

    // Update modal content
    modalTeamName.innerHTML = `
      <img src="assets/trophy-small.png" class="panel-trophy" alt="Trophy">
      ${team.name}
    `;
    
    modalBody.innerHTML = this.generateTeamDetails(team);
    
    // Show modal
    overlay.style.display = 'block';
    this.isOpen = true;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  generateTeamDetails(team) {
    return `
      <div class="team-detail-content">
        <div class="team-overview">
          ${this.generateTeamLogoLarge(team.name, team.id, team.logo)}
          <div class="team-basic-info">
            <h3>${team.name}</h3>
            <p class="team-owner">Owner: ${team.owner || 'TBD'}</p>
            <p class="team-record">Record: ${this.formatRecord(team.record)}</p>
          </div>
        </div>
        
        <div class="team-stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Points</div>
            <div class="stat-value">${(team.totalPoints || 0).toFixed(1)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">ESPN Rank</div>
            <div class="stat-value">#${team.espnRank || 'N/A'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Playoff Seed</div>
            <div class="stat-value">#${team.playoffSeed || 'N/A'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Earnings</div>
            <div class="stat-value">$${(team.earnings || 0).toLocaleString()}</div>
          </div>
        </div>
        
        <div class="bucks-breakdown-detail">
          <h4>La Liga Bucks Breakdown</h4>
          <div class="component-details">
            <div class="component-item">
              <span class="component-label">ESPN Component:</span>
              <span class="component-value espn-component">${team.espnComponent || 0}</span>
            </div>
            <div class="component-item">
              <span class="component-label">Cumulative Component:</span>
              <span class="component-value cumulative-component">${team.cumulativeComponent || 0}</span>
            </div>
            <div class="component-item">
              <span class="component-label">Weekly Average Component:</span>
              <span class="component-value weekly-component">${team.weeklyAverageComponent || 0}</span>
            </div>
            <div class="component-total">
              <span class="component-label">Total La Liga Bucks:</span>
              <span class="component-value total-bucks">${team.laLigaBucks || 0}</span>
            </div>
          </div>
        </div>
        
        <div class="team-performance">
          <h4>Season Performance</h4>
          <div class="performance-metrics">
            <div class="metric-item">
              <span class="metric-label">Points Per Game:</span>
              <span class="metric-value">${this.calculatePointsPerGame(team)}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Win Percentage:</span>
              <span class="metric-value">${this.calculateWinPercentage(team)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Weekly High Scores:</span>
              <span class="metric-value">${team.weeklyHighScores || 0}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate large team logo for modal
   */
  generateTeamLogoLarge(teamName, teamId, logoUrl) {
    // If we have a logo URL from ESPN, use it as a background image
    if (logoUrl && logoUrl.trim() !== '') {
      return `<div class="team-logo-large espn-logo" data-team-id="${teamId}" style="background-image: url('${logoUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center;"></div>`;
    }
    
    // Fallback to colored ovals if no logo URL
    const logoClass = this.getTeamLogoClass(teamName);
    return `<div class="team-logo-large ${logoClass}" data-team-id="${teamId}"></div>`;
  }

  getTeamLogoClass(teamName) {
    const hash = teamName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const logoIndex = Math.abs(hash) % 12 + 1;
    return `logo-${logoIndex}`;
  }

  formatRecord(record) {
    if (!record) return '0-0-0';
    const wins = record.wins || 0;
    const losses = record.losses || 0;
    const ties = record.ties || 0;
    return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
  }

  calculatePointsPerGame(team) {
    const currentWeek = this.state.getCurrentWeek();
    const gamesPlayed = currentWeek > 0 ? currentWeek : 1;
    const ppg = (team.totalPoints || 0) / gamesPlayed;
    return ppg.toFixed(1);
  }

  calculateWinPercentage(team) {
    if (!team.record) return '0.0';
    const { wins = 0, losses = 0, ties = 0 } = team.record;
    const totalGames = wins + losses + ties;
    if (totalGames === 0) return '0.0';
    const winPct = (wins / totalGames) * 100;
    return winPct.toFixed(1);
  }

  closeModal() {
    this.logger.userAction('team_modal_close');
    
    const overlay = document.getElementById('team-modal-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    this.isOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  refresh() {
    // Modal content is generated on demand, no refresh needed
  }
}