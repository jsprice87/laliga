/**
 * Matchups Component
 * Handles matchup display and week selection
 */

import { Logger } from '../utils/logger.js';

export class Matchups {
  constructor(state, dataService) {
    this.state = state;
    this.dataService = dataService;
    this.logger = new Logger('Matchups');
    this.currentWeek = 1;
    this.dataSourceStatus = null;
  }

  init() {
    this.setupWeekSelector();
    this.updateCurrentWeek();
    this.logger.component('Matchups', 'initialized');
  }

  setupWeekSelector() {
    const weekSelect = document.getElementById('matchups-week-select');
    if (weekSelect) {
      weekSelect.addEventListener('change', async (e) => {
        this.currentWeek = parseInt(e.target.value);
        console.log(`📅 Week selector changed to: ${this.currentWeek}`);
        this.updateWeekDisplay();
        this.updateDataSourceStatus();
        
        // Load matchups for the new week if we don't have them
        await this.loadMatchupsForWeek(this.currentWeek);
        
        this.render();
      });
    }
  }

  /**
   * Load matchups for a specific week
   */
  async loadMatchupsForWeek(week) {
    const currentYear = this.state.getCurrentYear();
    console.log(`🔄 Loading matchups for week ${week}, year ${currentYear}`);
    
    try {
      // Check if we already have matchups for this week
      const existingMatchups = this.state.getMatchupsForWeek(week);
      if (existingMatchups.length > 0) {
        console.log(`✅ Already have ${existingMatchups.length} matchups for week ${week}`);
        return;
      }
      
      // Load matchups from API
      const matchupsData = await this.dataService.loadMatchups(week, currentYear);
      console.log(`📥 Loaded ${matchupsData?.length || 0} matchups for week ${week}`);
      
      if (matchupsData && matchupsData.length > 0) {
        // Add new matchups to existing state (don't replace all)
        const allMatchups = this.state.getMatchups();
        const updatedMatchups = [...allMatchups, ...matchupsData];
        this.state.setMatchups(updatedMatchups);
        console.log(`✅ Added week ${week} matchups to state`);
      }
    } catch (error) {
      console.error(`❌ Failed to load matchups for week ${week}:`, error);
    }
  }

  async render() {
    const container = document.getElementById('matchups-grid');
    if (!container) return;

    // Verbose logging for debugging
    console.group(`🏈 MATCHUPS DEBUG - Week ${this.currentWeek}`);
    console.log('Current year:', this.state.getCurrentYear());
    console.log('Current week:', this.currentWeek);
    
    // Get all matchups from state
    const allMatchups = this.state.getMatchups();
    console.log('All matchups in state:', allMatchups);
    
    // Get matchups for specific week
    let matchups = this.state.getMatchupsForWeek(this.currentWeek);
    console.log(`Found ${matchups.length} matchups for week ${this.currentWeek}`);
    
    // If no matchups exist for current week, try to load them
    if (matchups.length === 0 && allMatchups.length === 0) {
      console.log(`🔄 No matchups in state, loading for week ${this.currentWeek}...`);
      console.groupEnd();
      
      // Show loading state
      container.innerHTML = '<div class="empty-state"><div class="empty-message">Loading matchups...</div></div>';
      
      // Load matchups data
      await this.loadMatchupsForWeek(this.currentWeek);
      
      // Get matchups again after loading
      matchups = this.state.getMatchupsForWeek(this.currentWeek);
      
      // Re-start logging group
      console.group(`🏈 MATCHUPS DEBUG - After Load - Week ${this.currentWeek}`);
      console.log(`After loading: Found ${matchups.length} matchups for week ${this.currentWeek}`);
    }
    
    if (matchups.length === 0) {
      console.warn(`❌ Still no matchups found for week ${this.currentWeek}`);
      console.log('Available weeks in data:', [...new Set(this.state.getMatchups().map(m => m.week))].sort());
      console.groupEnd();
      container.innerHTML = '<div class="empty-state"><div class="empty-message">No matchups available for this week</div></div>';
      return;
    }

    console.log(`✅ Rendering ${matchups.length} matchups`);
    console.groupEnd();
    
    container.innerHTML = matchups.map(matchup => this.createMatchupCard(matchup)).join('');
  }

  createMatchupCard(matchup) {
    const status = this.getMatchupStatus(matchup);
    const statusClass = status.toLowerCase().replace(/\s+/g, '-');
    
    // Enhanced team name and score extraction with debugging
    console.log('Processing matchup card:', matchup);
    
    const team1Name = this.getTeamName(matchup.team1);
    const team2Name = this.getTeamName(matchup.team2);
    const team1Score = this.getTeamScore(matchup.team1, matchup.team1Score);
    const team2Score = this.getTeamScore(matchup.team2, matchup.team2Score);
    
    console.log(`Team names: ${team1Name} vs ${team2Name}`);
    console.log(`Scores: ${team1Score} vs ${team2Score}`);
    
    return `
      <div class="matchup-card game-panel">
        <div class="matchup-teams">
          <div class="team-matchup">
            <span class="team-name">${team1Name}</span>
            <span class="team-score">${team1Score}</span>
          </div>
          <div class="vs-divider">VS</div>
          <div class="team-matchup">
            <span class="team-name">${team2Name}</span>
            <span class="team-score">${team2Score}</span>
          </div>
        </div>
        <div class="matchup-status ${statusClass}">${status}</div>
      </div>
    `;
  }

  /**
   * Get team name from matchup team data
   */
  getTeamName(teamData) {
    if (!teamData) return 'TBD';
    
    // Try different possible name fields
    if (teamData.name && teamData.name !== `Team ${teamData.id}`) {
      return teamData.name;
    }
    
    // If we have an ID, look up the team from state
    if (teamData.id) {
      const team = this.state.getTeamById(teamData.id);
      if (team && team.name) {
        return team.name;
      }
    }
    
    // If we have an espnId, try that too
    if (teamData.espnId) {
      const teams = this.state.getTeams();
      const team = teams.find(t => t.id === teamData.espnId || t.espnId === teamData.espnId);
      if (team && team.name) {
        return team.name;
      }
    }
    
    // Fallback to generic name
    return `Team ${teamData.id || teamData.espnId || '?'}`;
  }

  /**
   * Get team score from matchup data
   */
  getTeamScore(teamData, fallbackScore) {
    // Try different score fields
    if (teamData?.score !== undefined && teamData.score !== null) {
      return teamData.score;
    }
    
    if (fallbackScore !== undefined && fallbackScore !== null) {
      return fallbackScore;
    }
    
    return 0;
  }

  refresh() {
    this.updateCurrentWeek();
    this.updateDataSourceStatus();
    this.render();
  }

  /**
   * Update current week from state
   */
  updateCurrentWeek() {
    this.currentWeek = this.state.getCurrentWeek() || 1;
    
    // Update week selector
    const weekSelect = document.getElementById('matchups-week-select');
    if (weekSelect && weekSelect.value != this.currentWeek) {
      weekSelect.value = this.currentWeek;
    }
    
    this.updateWeekDisplay();
  }

  /**
   * Update week display in header
   */
  updateWeekDisplay() {
    const weekDisplay = document.getElementById('matchups-week');
    if (weekDisplay) {
      weekDisplay.textContent = this.currentWeek;
    }
  }

  /**
   * Update data source status indicator
   */
  updateDataSourceStatus() {
    const currentYear = this.state.getCurrentYear();
    const status = this.getDataSourceStatus(currentYear, this.currentWeek);
    this.dataSourceStatus = status;
    
    // Update live indicator
    const liveIndicator = document.getElementById('live-indicator');
    if (liveIndicator) {
      const statusSpan = liveIndicator.querySelector('span:last-child');
      const dotSpan = liveIndicator.querySelector('.live-dot');
      
      if (statusSpan && dotSpan) {
        statusSpan.textContent = status.displayText;
        
        // Update dot color based on status
        dotSpan.className = `live-dot ${status.dotClass}`;
        
        // Update live indicator styling
        liveIndicator.className = `live-indicator ${status.indicatorClass}`;
      }
    }
    
    this.logger.info(`Data source status updated: ${status.source} - ${status.displayText}`);
  }

  /**
   * Determine data source status for current year/week
   */
  getDataSourceStatus(year, week) {
    const isLiveSeason = year >= 2025;
    const isCurrentWeek = this.isCurrentWeek(year, week);
    const isLive = isLiveSeason && isCurrentWeek;
    
    if (year >= 2025) {
      if (isCurrentWeek) {
        return {
          source: 'live',
          status: 'LIVE',
          displayText: 'LIVE SEASON ACTIVE',
          dotClass: 'live',
          indicatorClass: 'live'
        };
      } else {
        return {
          source: 'cache',
          status: 'SCHEDULED',
          displayText: 'SCHEDULED',
          dotClass: 'scheduled',
          indicatorClass: 'scheduled'
        };
      }
    } else {
      return {
        source: 'cache',
        status: 'FINAL',
        displayText: 'SEASON COMPLETE',
        dotClass: 'final',
        indicatorClass: 'final'
      };
    }
  }

  /**
   * Check if a week is the current active week
   */
  isCurrentWeek(year, week) {
    // For 2025, season hasn't started yet - week 1 is "current"
    if (year >= 2025) {
      return week === 1;
    }
    
    // For historical seasons, no weeks are "current"
    if (year < new Date().getFullYear()) {
      return false;
    }
    
    // For current year, this would need to be calculated based on NFL schedule
    // Simplified implementation for now
    return false;
  }

  /**
   * Get enhanced matchup status
   */
  getMatchupStatus(matchup) {
    if (!matchup || !this.dataSourceStatus) {
      return 'Unknown';
    }
    
    // If we have live data source
    if (this.dataSourceStatus.source === 'live') {
      // Check if scores exist and are > 0
      const hasScore1 = matchup.team1Score && matchup.team1Score > 0;
      const hasScore2 = matchup.team2Score && matchup.team2Score > 0;
      
      if (hasScore1 || hasScore2) {
        return matchup.status === 'final' ? 'Final' : 'In Progress';
      } else {
        return 'Scheduled';
      }
    } else {
      // Historical data - always final
      return 'Final';
    }
  }
}