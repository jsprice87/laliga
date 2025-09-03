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
    
    const totalPaidElement = document.getElementById('total-paid');
    const remainingPoolElement = document.getElementById('remaining-pool');
    
    if (totalPaidElement) {
      totalPaidElement.textContent = `$${moneyStats.totalPaid.toLocaleString()}`;
    }
    
    if (remainingPoolElement) {
      remainingPoolElement.textContent = `$${moneyStats.remaining.toLocaleString()}`;
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
    if (!canvas) return;

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const teams = this.state.getTeams();
    const teamNames = teams.map(team => team.name);
    const earnings = teams.map(team => team.earnings || 0);

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