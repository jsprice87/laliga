/**
 * Money Board Component
 * Handles prize pool and earnings display
 */

import { Logger } from '../utils/logger.js';

export class MoneyBoard {
  constructor(state, dataService) {
    this.state = state;
    this.dataService = dataService;
    this.logger = new Logger('MoneyBoard');
    this.chart = null;
  }

  init() {
    this.logger.component('MoneyBoard', 'initialized');
  }

  render() {
    console.log('💰 MoneyBoard: Starting render process');
    this.updatePrizeBreakdown();
    this.updateHighScoreWinners();
    this.renderEarningsChart();
    console.log('💰 MoneyBoard: Render complete');
  }

  /**
   * Ensure team data is loaded before rendering charts
   */
  async ensureTeamDataLoaded() {
    const teams = this.state.getTeams();
    if (!teams || teams.length === 0) {
      console.log('MoneyBoard: Team data not loaded, requesting fresh data...');
      // Trigger data load via the app's data service
      if (window.laLigaApp && window.laLigaApp.loadSeasonData) {
        await window.laLigaApp.loadSeasonData(this.state.getCurrentYear());
      }
    }
  }

  updatePrizeBreakdown() {
    const moneyStats = this.state.getMoneyStats();
    
    console.log('MoneyBoard: Money stats:', moneyStats);
    
    const totalPaidElement = document.getElementById('total-paid');
    const remainingPoolElement = document.getElementById('remaining-pool');
    
    if (totalPaidElement) {
      const totalPaid = moneyStats?.totalPaid || 0;
      totalPaidElement.textContent = `$${totalPaid.toLocaleString()}`;
    }
    
    if (remainingPoolElement) {
      const remaining = moneyStats?.remaining || 2400; // Default pool size
      remainingPoolElement.textContent = `$${remaining.toLocaleString()}`;
    }
  }

  updateHighScoreWinners() {
    const winnersContainer = document.getElementById('winners-list');
    if (!winnersContainer) return;

    const currentYear = this.state.getCurrentYear();

    // Calculate actual weekly winners from matchup data
    console.log('💰 MoneyBoard: Calculating weekly high score winners...');
    const weeklyWinners = this.calculateWeeklyHighScoreWinners();
    console.log('💰 MoneyBoard: Found', weeklyWinners.length, 'weekly winners:', weeklyWinners);

    if (weeklyWinners.length === 0) {
      winnersContainer.innerHTML = '<div class="no-data-message">No weekly winners yet - matchup data loading...</div>';
      return;
    }

    // Display as a proper table
    winnersContainer.innerHTML = `
      <table class="winners-table">
        <thead>
          <tr>
            <th>WEEK</th>
            <th>TEAM</th>
            <th>SCORE</th>
            <th>PRIZE</th>
          </tr>
        </thead>
        <tbody>
          ${weeklyWinners.map(winner => `
            <tr>
              <td class="winner-week">${winner.week}</td>
              <td class="winner-team">${winner.teamName}</td>
              <td class="winner-score">${winner.score.toFixed(2)} pts</td>
              <td class="winner-prize">$50</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Calculate weekly high score winners from matchup data
   */
  calculateWeeklyHighScoreWinners() {
    const matchups = this.state.getMatchups();
    const winners = [];
    
    if (!matchups || matchups.length === 0) {
      return winners;
    }
    
    // Group matchups by week
    const weeklyMatchups = {};
    matchups.forEach(matchup => {
      if (!weeklyMatchups[matchup.week]) {
        weeklyMatchups[matchup.week] = [];
      }
      weeklyMatchups[matchup.week].push(matchup);
    });
    
    // Find highest scorer for each completed week
    Object.keys(weeklyMatchups).forEach(week => {
      const weekMatchups = weeklyMatchups[week];
      let highestScore = 0;
      let winnerData = null;
      
      weekMatchups.forEach(matchup => {
        // Check team1 score
        if (matchup.team1Score > highestScore) {
          highestScore = matchup.team1Score;
          winnerData = {
            week: parseInt(week),
            teamName: matchup.team1?.name || 'Unknown Team',
            score: matchup.team1Score
          };
        }
        
        // Check team2 score
        if (matchup.team2Score > highestScore) {
          highestScore = matchup.team2Score;
          winnerData = {
            week: parseInt(week),
            teamName: matchup.team2?.name || 'Unknown Team', 
            score: matchup.team2Score
          };
        }
      });
      
      if (winnerData && highestScore > 0) {
        winners.push(winnerData);
      }
    });
    
    return winners.sort((a, b) => a.week - b.week);
  }

  renderEarningsChart() {
    const canvas = document.getElementById('earningsChart');
    if (!canvas) {
      console.warn('MoneyBoard: earningsChart canvas not found');
      return;
    }

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
      console.warn('MoneyBoard: Chart.js not available, skipping chart render');
      return;
    }

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const teams = this.state.getTeams();

    if (!teams || teams.length === 0) {
      console.log('MoneyBoard: No teams data available for chart');
      // Display loading state message in canvas area
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00FFFF';
      ctx.font = '16px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('Loading team earnings data...', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Calculate earnings from weekly high score winners
    const weeklyWinners = this.calculateWeeklyHighScoreWinners();
    const earningsMap = {};

    // Initialize all teams with $0
    teams.forEach(team => {
      earningsMap[team.name] = 0;
    });

    // Add $50 for each weekly win
    weeklyWinners.forEach(winner => {
      if (earningsMap.hasOwnProperty(winner.teamName)) {
        earningsMap[winner.teamName] += 50;
      }
    });

    // Sort teams by earnings (highest first) for better visualization
    const sortedTeams = [...teams].sort((a, b) => {
      return (earningsMap[b.name] || 0) - (earningsMap[a.name] || 0);
    });

    const teamNames = sortedTeams.map(team => team.name || 'Unknown Team');
    const earnings = sortedTeams.map(team => earningsMap[team.name] || 0);

    console.log('MoneyBoard: Rendering chart with', teams.length, 'teams, earnings:', earnings);

    const ctx = canvas.getContext('2d');

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: teamNames,
        datasets: [{
          label: 'Earnings ($)',
          data: earnings,
          backgroundColor: 'rgba(0, 255, 255, 0.6)',
          borderColor: 'rgba(0, 255, 255, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#00ffff',
              font: {
                family: 'Orbitron'
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#00ffff',
              font: {
                family: 'Orbitron'
              },
              callback: function(value) {
                return '$' + value;
              }
            },
            grid: {
              color: 'rgba(0, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#00ffff',
              font: {
                family: 'Orbitron',
                size: 10
              },
              maxRotation: 45
            },
            grid: {
              color: 'rgba(0, 255, 255, 0.1)'
            }
          }
        }
      }
    });
  }

  handleResize() {
    if (this.chart) {
      this.chart.resize();
    }
  }

  refresh() {
    this.render();
  }
}