/**
 * Leaderboard Component
 * Handles the main La Liga Bucks standings display
 */

import { Logger } from '../utils/logger.js';

export class Leaderboard {
  constructor(state, dataService) {
    this.state = state;
    this.dataService = dataService;
    this.logger = new Logger('Leaderboard');
    this.currentSortCriteria = 'bucks';
  }

  /**
   * Initialize leaderboard
   */
  init() {
    this.setupSortControls();
    this.render();
    this.logger.component('Leaderboard', 'initialized');
  }

  /**
   * Setup sort controls
   */
  setupSortControls() {
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.handleSortChange(e.target.value);
      });
    }
  }

  /**
   * Handle sort criteria change
   */
  handleSortChange(criteria) {
    this.logger.userAction('sort_change', { criteria });
    this.currentSortCriteria = criteria;
    this.render();
  }

  /**
   * Render leaderboard
   */
  render() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) {
      this.logger.error('Leaderboard body element not found');
      return;
    }

    try {
      const teams = this.getSortedTeams();
      
      if (teams.length === 0) {
        this.renderEmptyState(leaderboardBody);
        return;
      }

      this.renderTeams(leaderboardBody, teams);
      
      // Render progression chart after teams are rendered
      this.renderProgressionChart(teams);
      
    } catch (error) {
      this.logger.error('Failed to render leaderboard:', error);
      this.renderErrorState(leaderboardBody);
    }
  }

  /**
   * Get teams sorted by current criteria
   */
  getSortedTeams() {
    return this.state.sortTeams(this.currentSortCriteria);
  }

  /**
   * Render teams in leaderboard
   */
  renderTeams(container, teams) {
    container.innerHTML = '';
    
    teams.forEach((team, index) => {
      const row = this.createTeamRow(team, index + 1);
      container.appendChild(row);
    });
  }

  /**
   * Create team row element
   */
  createTeamRow(team, rank) {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    row.onclick = () => this.openTeamModal(team);
    
    row.innerHTML = `
      <div class="rank-col">
        <span class="rank-number">${rank}</span>
        ${this.generateRankingIndicator(team)}
      </div>
      <div class="team-col">
        <div class="team-info">
          ${this.generateTeamLogo(team.name, team.id, team.logo)}
          <div class="team-details">
            <div class="team-name">${team.name}</div>
            <div class="team-owner">${team.owner || 'TBD'}</div>
          </div>
        </div>
      </div>
      <div class="record-col">
        <div class="record-display">
          <span class="record-text">${this.formatRecord(team.record)}</span>
          ${this.generateStreakIndicator(team)}
        </div>
      </div>
      <div class="points-col">
        <div class="points-display">
          <span class="points-value">${(team.totalPoints || 0).toFixed(1)}</span>
          <span class="points-label">PTS</span>
        </div>
      </div>
      <div class="breakdown-col">
        <div class="total-bucks">${(() => {
          console.log('🎯 LEADERBOARD RENDER - Team:', team.name, 'laLigaBucks:', team.laLigaBucks, 'type:', typeof team.laLigaBucks);
          
          // Handle both object format {total: X} and direct number format
          let ligaBucksValue = 0;
          if (typeof team.laLigaBucks === 'object' && team.laLigaBucks !== null) {
            ligaBucksValue = team.laLigaBucks.total || 0;
          } else if (typeof team.laLigaBucks === 'number') {
            ligaBucksValue = team.laLigaBucks;
          }
          
          console.log('🎯 LIGA BUCKS DISPLAY VALUE:', ligaBucksValue);
          return ligaBucksValue;
        })()}</div>
      </div>
      <div class="power-bar-spanning">
        ${this.generatePowerBar(team)}
      </div>
    `;

    return row;
  }

  /**
   * Generate enhanced Liga Bucks power bar with clear labels
   */
  generatePowerBar(team) {
    const espnComponent = team.espnComponent || 0;
    const pointsComponent = team.cumulativeComponent || 0;
    const totalBucks = espnComponent + pointsComponent;
    
    const maxBucks = 24; // Maximum possible Liga Bucks (12 + 12)
    
    // Calculate percentages for the power bar
    const totalPercentage = Math.min((totalBucks / maxBucks) * 100, 100);
    const espnPercentage = totalPercentage > 0 ? (espnComponent / totalBucks) * totalPercentage : 0;
    const pointsPercentage = totalPercentage - espnPercentage;
    
    console.log('🚨 NEW ENHANCED POWER BAR LOADED - Team:', team.name, {
      espnComponent: espnComponent,
      pointsComponent: pointsComponent, 
      calculatedTotalBucks: totalBucks,
      teamLaLigaBucks: team.laLigaBucks,
      totalPercentage: totalPercentage,
      espnPercentage: espnPercentage,
      pointsPercentage: pointsPercentage,
      CACHE_BUSTER: 'v2.0_ENHANCED'
    });
    
    return `
      <div class="wide-power-bar">
        <div class="power-segments">
          <div class="espn-segment" style="width: ${espnPercentage}%" title="ESPN Rank Component: ${espnComponent}/12">
            <span class="segment-label">ESPN: ${espnComponent}</span>
          </div>
          <div class="points-segment" style="width: ${pointsPercentage}%" title="Total Points Component: ${pointsComponent}/12">
            <span class="segment-label">PTS: ${pointsComponent}</span>
          </div>
        </div>
      </div>
    `;
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

  /**
   * Get team logo CSS class
   */
  getTeamLogoClass(teamName) {
    // Simple hash-based logo assignment
    const hash = teamName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const logoIndex = Math.abs(hash) % 12 + 1;
    return `logo-${logoIndex}`;
  }

  /**
   * Generate ranking indicator (up/down arrows)
   */
  generateRankingIndicator(team) {
    if (!team.previousRank || team.previousRank === team.currentRank) {
      return '<span class="rank-change rank-same">—</span>';
    }
    
    if (team.currentRank < team.previousRank) {
      const change = team.previousRank - team.currentRank;
      return `<span class="rank-change rank-up" title="Up ${change} spots">↑${change}</span>`;
    } else {
      const change = team.currentRank - team.previousRank;
      return `<span class="rank-change rank-down" title="Down ${change} spots">↓${change}</span>`;
    }
  }

  /**
   * Generate streak indicator
   */
  generateStreakIndicator(team) {
    if (!team.streak || team.streak.length === 0) {
      return '';
    }

    const currentStreak = team.streak.current;
    const type = currentStreak > 0 ? 'win' : 'loss';
    const count = Math.abs(currentStreak);
    
    if (count < 2) {
      return '';
    }

    const streakClass = type === 'win' ? 'streak-hot' : 'streak-cold';
    const streakText = type === 'win' ? `🔥${count}W` : `❄️${count}L`;
    
    return `<span class="streak-indicator ${streakClass}" title="${count} game ${type} streak">${streakText}</span>`;
  }

  /**
   * Format team record
   */
  formatRecord(record) {
    if (!record) {
      return '0-0-0';
    }
    
    const wins = record.wins || 0;
    const losses = record.losses || 0;
    const ties = record.ties || 0;
    
    return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
  }

  /**
   * Open team modal
   */
  openTeamModal(team) {
    this.logger.userAction('team_modal_open', { teamId: team.id });
    
    // Fire event for modal component to handle
    const event = new CustomEvent('openteammodal', { detail: { team } });
    document.dispatchEvent(event);
  }

  /**
   * Render empty state
   */
  renderEmptyState(container) {
    const currentYear = this.state.getCurrentYear();
    const message = currentYear === 2025 
      ? 'Season not started - standings will appear here once the season begins'
      : 'No team data available for this season';

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-message">${message}</div>
      </div>
    `;
  }

  /**
   * Render error state
   */
  renderErrorState(container) {
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-message">Failed to load leaderboard data</div>
        <button class="retry-button" onclick="this.retry()">Retry</button>
      </div>
    `;
  }

  /**
   * Retry loading data
   */
  retry() {
    this.logger.userAction('leaderboard_retry');
    this.render();
  }

  /**
   * Render progression chart
   */
  renderProgressionChart(teams) {
    const canvas = document.getElementById('progressionChart');
    if (!canvas || !window.Chart) {
      console.warn('Chart.js not available or canvas not found');
      return;
    }

    // Destroy existing chart if it exists
    if (this.progressionChart) {
      this.progressionChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    // Generate progression data for regular season only (weeks 1-14)
    const weeks = Array.from({length: 14}, (_, i) => `Week ${i + 1}`);
    const chartData = this.generateProgressionData(teams, weeks);

    this.progressionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: weeks,
        datasets: chartData
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Liga Bucks Rankings - Regular Season (Weeks 1-14)',
            color: '#00FFFF',
            font: {
              family: 'Orbitron',
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'right',
            labels: {
              color: '#FFFFFF',
              font: {
                family: 'Orbitron',
                size: 11
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Week',
              color: '#00FFFF',
              font: {
                family: 'Orbitron',
                weight: 'bold'
              }
            },
            ticks: {
              color: '#FFFFFF',
              font: {
                family: 'Orbitron'
              }
            },
            grid: {
              color: 'rgba(255, 0, 255, 0.2)'
            }
          },
          y: {
            reverse: true, // Lower rank numbers (1st, 2nd) should be higher on chart
            min: 1,
            max: 12,
            title: {
              display: true,
              text: 'Ranking',
              color: '#00FFFF',
              font: {
                family: 'Orbitron',
                weight: 'bold'
              }
            },
            ticks: {
              color: '#FFFFFF',
              font: {
                family: 'Orbitron'
              },
              stepSize: 1
            },
            grid: {
              color: 'rgba(0, 255, 255, 0.2)'
            }
          }
        },
        elements: {
          line: {
            tension: 0.2,
            borderWidth: 2
          },
          point: {
            radius: 3,
            hoverRadius: 5
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }
    });
  }

  /**
   * Generate sample progression data for teams
   */
  generateProgressionData(teams, weeks) {
    const colors = [
      '#FF00FF', '#00FFFF', '#FFFF00', '#00FF00', '#FF8000', '#FF0080',
      '#80FF00', '#0080FF', '#8000FF', '#FF0000', '#00FF80', '#8080FF'
    ];

    // Calculate week-by-week Liga Bucks rankings for each team
    const weeklyRankings = this.calculateWeeklyLigaBucksRankings(teams, weeks.length);
    
    // Sort teams by final Liga Bucks ranking to ensure consistent ordering
    const sortedTeams = [...teams].sort((a, b) => (a.ligaBucksRank || 99) - (b.ligaBucksRank || 99));

    return sortedTeams.slice(0, 12).map((team, index) => {
      const teamId = team.id || team.name;
      // Get this team's week-by-week rankings, fallback to final rank if data unavailable
      const data = weeks.map((_, weekIndex) => {
        return weeklyRankings[teamId]?.[weekIndex] || (team.ligaBucksRank || (index + 1));
      });

      return {
        label: team.name || `Team ${team.id}`,
        data: data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        fill: false
      };
    });
  }

  /**
   * Calculate Liga Bucks rankings for each week (1-14) of the regular season
   */
  calculateWeeklyLigaBucksRankings(teams, totalWeeks) {
    const weeklyRankings = {};
    
    // Initialize rankings object for each team
    teams.forEach(team => {
      const teamId = team.id || team.name;
      weeklyRankings[teamId] = [];
    });

    // For each week, calculate what the Liga Bucks rankings would have been
    for (let week = 1; week <= totalWeeks; week++) {
      // Simulate cumulative stats through this week (simplified approach)
      const weekTeams = teams.map(team => ({
        ...team,
        // Simulate progressive season development
        weekProgress: week / totalWeeks,
        simulatedESPNRank: this.simulateWeeklyESPNRank(team, week),
        simulatedPoints: this.simulateWeeklyPoints(team, week, totalWeeks)
      }));

      // Calculate Liga Bucks components for this week
      weekTeams.forEach(team => {
        team.weeklyESPNComponent = Math.max(1, Math.min(12, 13 - team.simulatedESPNRank));
      });

      // Sort by simulated points and assign points component
      const pointsSorted = [...weekTeams].sort((a, b) => b.simulatedPoints - a.simulatedPoints);
      pointsSorted.forEach((team, index) => {
        team.weeklyCumulativeComponent = Math.max(1, 12 - index);
      });

      // Calculate weekly Liga Bucks and rank teams
      weekTeams.forEach(team => {
        team.weeklyLigaBucks = team.weeklyESPNComponent + team.weeklyCumulativeComponent;
      });

      // Sort by Liga Bucks with tiebreaker and assign rankings
      const ligaBucksSorted = [...weekTeams].sort((a, b) => {
        if (a.weeklyLigaBucks !== b.weeklyLigaBucks) {
          return b.weeklyLigaBucks - a.weeklyLigaBucks;
        }
        // Use simulated points against as tiebreaker
        return (a.simulatedPointsAgainst || 0) - (b.simulatedPointsAgainst || 0);
      });

      // Assign rankings for this week (1-12, no ties)
      ligaBucksSorted.forEach((team, index) => {
        const teamId = team.id || team.name;
        weeklyRankings[teamId][week - 1] = index + 1;
      });
    }

    return weeklyRankings;
  }

  /**
   * Simulate ESPN ranking progression throughout season
   */
  simulateWeeklyESPNRank(team, week) {
    const finalESPNRank = team.espnRank || 6;
    const startingRank = 6 + (Math.random() - 0.5) * 4; // Random start around middle
    const progress = Math.min(week / 8, 1); // Converge by week 8
    return Math.round(startingRank + (finalESPNRank - startingRank) * progress);
  }

  /**
   * Simulate points progression throughout season
   */
  simulateWeeklyPoints(team, week, totalWeeks) {
    const finalPoints = team.totalPoints || 1000;
    const weeklyAvg = finalPoints / totalWeeks;
    // Add some realistic variance week-to-week
    const variance = (Math.random() - 0.5) * 100;
    return Math.max(0, Math.round((weeklyAvg * week) + variance));
  }

  /**
   * Update sort selection in UI
   */
  updateSortSelection(criteria) {
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
      sortSelect.value = criteria;
    }
  }

  /**
   * Calculate component rankings for display
   */
  calculateComponentRankings(teams) {
    // ESPN Component rankings
    const espnSorted = [...teams].sort((a, b) => (a.espnRank || 0) - (b.espnRank || 0));
    espnSorted.forEach((team, index) => {
      team.espnComponent = 12 - index;
    });

    // Cumulative Points rankings
    const pointsSorted = [...teams].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    pointsSorted.forEach((team, index) => {
      team.cumulativeComponent = 12 - index;
    });

    // Weekly Average rankings (placeholder calculation)
    const avgSorted = [...teams].sort((a, b) => (b.weeklyAverage || 0) - (a.weeklyAverage || 0));
    avgSorted.forEach((team, index) => {
      team.weeklyAverageComponent = 12 - index;
    });

    // Calculate total La Liga Bucks
    teams.forEach(team => {
      team.laLigaBucks = (team.espnComponent || 0) + 
                       (team.cumulativeComponent || 0) + 
                       (team.weeklyAverageComponent || 0);
    });

    return teams;
  }

  /**
   * Refresh leaderboard with current data
   */
  refresh() {
    this.render();
  }

  /**
   * Handle data loading
   */
  setLoading(isLoading) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;

    if (isLoading) {
      leaderboardBody.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <div class="loading-message">Loading leaderboard...</div>
        </div>
      `;
    }
  }

  /**
   * Update with new team data
   */
  updateTeams(teams) {
    // Calculate component rankings
    const rankedTeams = this.calculateComponentRankings(teams);
    
    // Update state
    this.state.setTeams(rankedTeams);
    
    // Re-render
    this.render();
  }

  /**
   * Export leaderboard data
   */
  exportData() {
    const teams = this.getSortedTeams();
    const csvData = this.generateCSV(teams);
    this.downloadCSV(csvData, 'laliga-leaderboard.csv');
  }

  /**
   * Generate CSV data
   */
  generateCSV(teams) {
    const headers = ['Rank', 'Team', 'Owner', 'Record', 'Points', 'ESPN', 'Cumulative', 'Weekly', 'Total Bucks'];
    const rows = teams.map((team, index) => [
      index + 1,
      team.name,
      team.owner || 'TBD',
      this.formatRecord(team.record),
      team.totalPoints || 0,
      team.espnComponent || 0,
      team.cumulativeComponent || 0,
      team.weeklyAverageComponent || 0,
      team.laLigaBucks || 0
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Download CSV file
   */
  downloadCSV(csvData, filename) {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}