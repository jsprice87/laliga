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
    this.updatePrizeBreakdown();
    this.updateHighScoreWinners();
    this.renderEarningsChart();
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
    
    if (currentYear === 2025) {
      winnersContainer.innerHTML = '<div class="no-data-message">Season not started - no winners yet</div>';
      return;
    }

    // Mock data for now - would be loaded from API
    winnersContainer.innerHTML = '<div class="no-data-message">No weekly winners data available</div>';
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
      // Display empty state message in canvas area
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00FFFF';
      ctx.font = '16px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('No earnings data available', canvas.width / 2, canvas.height / 2);
      return;
    }

    const teamNames = teams.map(team => team.name || 'Unknown Team');
    const earnings = teams.map(team => team.earnings || 0);
    
    console.log('MoneyBoard: Rendering chart with', teams.length, 'teams, earnings:', earnings);

    const ctx = canvas.getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: teamNames,
        datasets: [{
          label: 'Earnings ($)',
          data: earnings,
          backgroundColor: 'rgba(0, 255, 255, 0.2)',
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