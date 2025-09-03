/**
 * Teams Component
 * Handles team grid display
 */

import { Logger } from '../utils/logger.js';

export class Teams {
  constructor(state, dataService) {
    this.state = state;
    this.dataService = dataService;
    this.logger = new Logger('Teams');
    this.currentYear = null;
  }

  init() {
    // Listen for year changes
    document.addEventListener('yearchange', (e) => {
      this.handleYearChange(e.detail.year);
    });
    
    this.currentYear = this.state.getCurrentYear();
    this.logger.component('Teams', 'initialized');
  }

  /**
   * Handle year change events
   */
  handleYearChange(year) {
    this.logger.info(`Teams component: Year changed to ${year}`);
    this.currentYear = year;
    this.refresh();
  }

  render() {
    const container = document.getElementById('teams-grid');
    if (!container) return;

    const teams = this.state.getTeams();
    this.currentYear = this.state.getCurrentYear();
    
    if (teams.length === 0) {
      container.innerHTML = this.createEmptyState();
      return;
    }

    // Sort teams by Liga Bucks or appropriate metric
    const sortedTeams = this.sortTeamsForDisplay(teams);
    container.innerHTML = sortedTeams.map(team => this.createTeamCard(team)).join('');
    
    this.logger.info(`Rendered ${sortedTeams.length} teams for year ${this.currentYear}`);
  }

  /**
   * Create empty state message based on current year
   */
  createEmptyState() {
    const year = this.currentYear || this.state.getCurrentYear();
    
    if (year >= 2025) {
      return `
        <div class="empty-state">
          <div class="empty-message">
            <h3>2025 Season Preview</h3>
            <p>Team rosters will be available once the season begins.</p>
            <p>Check back after the draft!</p>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="empty-state">
          <div class="empty-message">
            <h3>No Team Data Available</h3>
            <p>Unable to load team information for ${year} season.</p>
            <p>Please try refreshing or select a different year.</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Sort teams for display based on current context
   */
  sortTeamsForDisplay(teams) {
    const year = this.currentYear || this.state.getCurrentYear();
    
    // For current/future seasons, sort by Liga Bucks
    if (year >= 2025) {
      return teams.sort((a, b) => (b.laLigaBucks || 0) - (a.laLigaBucks || 0));
    }
    
    // For historical seasons, sort by final Liga Bucks then by total points
    return teams.sort((a, b) => {
      const bucksA = a.laLigaBucks || 0;
      const bucksB = b.laLigaBucks || 0;
      
      if (bucksB !== bucksA) {
        return bucksB - bucksA; // Higher Liga Bucks first
      }
      
      // Tiebreaker: total points
      return (b.totalPoints || 0) - (a.totalPoints || 0);
    });
  }

  createTeamCard(team) {
    const year = this.currentYear || this.state.getCurrentYear();
    const cardClass = this.getTeamCardClass(team, year);
    const stats = this.getTeamStatsForYear(team, year);
    
    return `
      <div class="team-card game-panel ${cardClass}" onclick="this.openTeamModal('${team.id}')">
        <div class="team-header">
          ${this.generateTeamLogo(team.name, team.id, team.logo)}
          <div class="team-name">${team.name}</div>
        </div>
        <div class="team-stats">
          ${stats.map(stat => `
            <div class="stat-item">
              <span class="stat-label">${stat.label}</span>
              <span class="stat-value ${stat.class || ''}">${stat.value}</span>
            </div>
          `).join('')}
        </div>
        ${this.getTeamProgressBar(team)}
      </div>
    `;
  }

  /**
   * Get team card CSS class based on performance
   */
  getTeamCardClass(team, year) {
    const classes = ['team-card-base'];
    
    if (year >= 2025) {
      // For current/future seasons
      classes.push('season-active');
    } else {
      // For historical seasons, add performance-based classes
      const rank = this.getTeamRank(team);
      if (rank === 1) classes.push('champion');
      if (rank === 12) classes.push('sacko');
      if (rank <= 6) classes.push('playoff-team');
    }
    
    return classes.join(' ');
  }

  /**
   * Get team stats array for display based on year
   */
  getTeamStatsForYear(team, year) {
    const stats = [];
    
    // Always show record
    stats.push({
      label: 'Record',
      value: this.formatRecord(team.record),
      class: this.getRecordClass(team.record)
    });
    
    // Always show total points
    stats.push({
      label: 'Points',
      value: (team.totalPoints || 0).toFixed(1),
      class: 'points-value'
    });
    
    // Liga Bucks with breakdown for historical data
    if (year >= 2025) {
      stats.push({
        label: 'Liga Bucks',
        value: team.laLigaBucks || 0,
        class: 'liga-bucks-current'
      });
    } else {
      stats.push({
        label: 'Liga Bucks',
        value: `${team.laLigaBucks || 0}`,
        class: 'liga-bucks-final'
      });
      
      // Add rank for historical seasons
      stats.push({
        label: 'Final Rank',
        value: this.getOrdinalRank(this.getTeamRank(team)),
        class: 'final-rank'
      });
    }
    
    return stats;
  }

  /**
   * Get team badges (champion, sacko) using hardcoded historical data
   */
  getTeamBadges(team, year) {
    if (year >= 2025) return ''; // No badges for current/future seasons yet
    
    const badges = [];
    
    // Check if team was champion for this year
    if (this.isChampion(team.name, year)) {
      badges.push('<span class="team-badge champion-badge">🏆 Champion</span>');
    }
    
    // Check if team was sacko for this year
    if (this.isSacko(team.name, year)) {
      badges.push('<span class="team-badge sacko-badge">💩 Sacko</span>');
    }
    
    return badges.length > 0 ? `<div class="team-badges">${badges.join('')}</div>` : '';
  }

  /**
   * Check if team was champion for given year using hardcoded data
   */
  isChampion(teamName, year) {
    const championsHistory = [
      { year: 2024, team: "Kris P. Roni" },
      { year: 2023, team: "Scott A Williams" },
      { year: 2022, team: "Stephen L Parr" },
      { year: 2021, team: "Stephen L Parr" },
      { year: 2019, team: "Justin S Price" },
      { year: 2018, team: "Justin S Price" },
      { year: 2017, team: "Justin S Price" },
      { year: 2016, team: "Scott A Williams" },
      { year: 2015, team: "Evan A Lengrich" },
      { year: 2014, team: "Jeffrey L Parr" },
      { year: 2013, team: "Justin S Price" }
    ];
    
    const champion = championsHistory.find(champ => champ.year === year);
    return champion && champion.team === teamName;
  }

  /**
   * Check if team was sacko for given year using hardcoded data
   */
  isSacko(teamName, year) {
    const sackoHistory = [
      { year: 2024, team: "Show me your TDs" },
      { year: 2023, team: "Un-Evan Languish" },
      { year: 2022, team: "Kwiss McKissass" },
      { year: 2021, team: "Justine Prissy" },
      { year: 2019, team: "Adum Limpwood" },
      { year: 2018, team: "Eric Butthurt" },
      { year: 2017, team: "Adum Limpwood" },
      { year: 2016, team: "Justine Prissy" },
      { year: 2015, team: "Eric Butthurt" },
      { year: 2014, team: "Nik'less Murky" }
    ];
    
    const sacko = sackoHistory.find(s => s.year === year);
    return sacko && sacko.team === teamName;
  }

  /**
   * Get Liga Bucks progress bar
   */
  getTeamProgressBar(team) {
    if (!team.laLigaBucks) return '';
    
    const maxBucks = 24; // Maximum possible Liga Bucks
    const percentage = (team.laLigaBucks / maxBucks) * 100;
    
    return `
      <div class="liga-bucks-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="progress-text">${team.laLigaBucks}/${maxBucks}</div>
      </div>
    `;
  }

  /**
   * Get team rank (simplified - would need proper ranking logic)
   */
  getTeamRank(team) {
    const teams = this.state.getTeams();
    const sortedTeams = teams.sort((a, b) => (b.laLigaBucks || 0) - (a.laLigaBucks || 0));
    return sortedTeams.findIndex(t => t.id === team.id) + 1;
  }

  /**
   * Convert rank to ordinal (1st, 2nd, 3rd, etc.)
   */
  getOrdinalRank(rank) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = rank % 100;
    return rank + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  /**
   * Get CSS class for record display
   */
  getRecordClass(record) {
    if (!record) return 'record-unknown';
    
    const wins = record.wins || 0;
    const losses = record.losses || 0;
    
    if (wins > losses) return 'record-winning';
    if (losses > wins) return 'record-losing';
    return 'record-even';
  }

  /**
   * Generate team logo
   */
  generateTeamLogo(teamName, teamId, logoUrl) {
    // If we have a logo URL from ESPN, use it as a background image
    if (logoUrl && logoUrl.trim() !== '') {
      return `<div class="team-logo espn-logo" data-team-id="${teamId}" style="background-image: url('${logoUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center;"></div>`;
    }
    
    // Fallback to colored ovals if no logo URL
    const logoClass = this.getTeamLogoClass(teamName);
    return `<div class="team-logo ${logoClass}" data-team-id="${teamId}"></div>`;
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

  openTeamModal(teamId) {
    const event = new CustomEvent('openteammodal', { detail: { teamId } });
    document.dispatchEvent(event);
  }

  refresh() {
    this.render();
  }
}