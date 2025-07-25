// La Liga del Fuego - 90s Video Game Style Fantasy Dashboard
'use strict';

/********************
 * Application Data *
 ********************/
const appData = {
  league: {
    name: "La Liga del Fuego",
    currentWeek: 14,
    totalWeeks: 17,
    teams: 12,
    prizePool: 2400,
    weeklyBonus: 50,
    season: 2025
  },
  teams: [], // Live data loaded from ESPN API
  matchups: [], // Live data loaded from ESPN API
  championsHistory: [
    { year: 2023, team: "Kris P. Roni", owner: "Kris McKissack" },
    { year: 2022, team: "Vonnies Chubbies", owner: "Jeff Parr" },
    { year: 2021, team: "Murican Futball Crusaders", owner: "Scott Williams" },
    { year: 2020, team: "Blondes Give Me A Chubb", owner: "Adam Haywood" }
  ],
  sackoHistory: [
    { year: 2023, team: "Purple Reign", owner: "Boston Weir" },
    { year: 2022, team: "Hurts in the Brown Bachs", owner: "Niklas Markley" },
    { year: 2021, team: "Nothing to CTE Here", owner: "Matthew Kelsall" },
    { year: 2020, team: "The Peeping Tomlins", owner: "Eric Butler" }
  ],
  commentary: [
    "🔥 KRIS P. RONI dominating with 35 total La Liga Bucks! The defending champ is looking UNSTOPPABLE with perfect scores in multiple components!",
    "💰 MONEY LEADERS emerge: Kris P. Roni ($200), Blondes Give Me A Chubb ($150), and multiple teams at $100. The weekly high score bonus race is HEATING UP!",
    "📊 PERFECT BALANCE in scoring system: ESPN Component leader (Kris P. Roni with 12), Cumulative leader (Blondes Give Me A Chubb with 12), and Weekly Average showing fierce competition!",
    "🏆 PLAYOFF PICTURE: Top 4 seeds locked in with championship-caliber teams leading the pack. The battle for seeding is INTENSE!",
    "⚡ WEEK 14 RECAP: Blondes Give Me A Chubb EXPLODED for 156.7 points! Kris P. Roni, Team Epsilon, and Murican Futball Crusaders also put up BIG NUMBERS!",
    "🎯 LA LIGA BUCKS SYSTEM working to PERFECTION: Each component maxes at 12 points, creating the most BALANCED competition in fantasy football!",
    "📈 EARNINGS TRACKER: $700 total paid out in weekly bonuses, with $500 remaining for playoff and championship GLORY!",
    "🏅 SACKO RACE: Multiple teams fighting to avoid the dreaded last place finish. The basement battle is getting DESPERATE!"
  ]
};

// Global state
let isAdminLoggedIn = false;
let currentWeek = 14;

/********************
 * Utility Functions *
 ********************/
const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const currency = (amount) => `$${amount.toLocaleString()}`;

/********************
 * Team Data Helpers *
 ********************/
function getTeamById(id) {
  return appData.teams.find(team => team.id === id);
}

function getTeamByName(name) {
  return appData.teams.find(team => team.name === name);
}

function sortTeams(criteria) {
  const teams = [...appData.teams];
  switch (criteria) {
    case 'espnRank':
      return teams.sort((a, b) => a.espnRank - b.espnRank);
    case 'totalPoints':
      return teams.sort((a, b) => b.totalPoints - a.totalPoints);
    case 'earnings':
      return teams.sort((a, b) => b.earnings - a.earnings);
    case 'playoffSeed':
      return teams.sort((a, b) => a.playoffSeed - b.playoffSeed);
    case 'bucks':
    default:
      return teams.sort((a, b) => b.laLigaBucks - a.laLigaBucks);
  }
}

function generateTeamLogo(teamName, teamId) {
  // 90s style pixel art team logos
  const colors = [
    '#20B2AA', '#FF1493', '#8A2BE2', '#0080FF', '#32CD32', 
    '#FFD700', '#FF6347', '#4169E1', '#FF69B4', '#00CED1',
    '#FFA500', '#DC143C'
  ];
  
  const bgColor = colors[teamId % colors.length];
  const borderColor = colors[(teamId + 6) % colors.length];
  const textColor = '#FFFFFF';
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect x='2' y='2' width='36' height='36' fill='${encodeURIComponent(bgColor)}' stroke='${encodeURIComponent(borderColor)}' stroke-width='2'/%3E%3Ctext x='20' y='26' font-family='Orbitron,monospace' font-size='12' font-weight='bold' text-anchor='middle' fill='${encodeURIComponent(textColor)}'%3E${encodeURIComponent(teamName.substring(0, 2).toUpperCase())}%3C/text%3E%3C/svg%3E`;
}

/********************
 * Sound Effects     *
 ********************/
function playGameSound(type) {
  // In a real implementation, you would play actual 8-bit sounds
  console.log(`🔊 [90s GAME SOUND]: ${type.toUpperCase()}`);
}

/********************
 * Section Management *
 ********************/
function showSection(sectionId) {
  console.log('📺 Switching to section:', sectionId);
  
  // Hide all sections
  qsa('.content-section').forEach(section => {
    section.classList.remove('active');
    section.style.display = 'none';
  });
  
  // Show target section
  const targetSection = qs(`#${sectionId}`);
  if (targetSection) {
    targetSection.classList.add('active');
    targetSection.style.display = 'block';
    console.log('✅ Section shown:', sectionId);
    return true;
  } else {
    console.error('❌ Section not found:', sectionId);
    return false;
  }
}

/********************
 * Leaderboard Logic *
 ********************/
function renderLeaderboard() {
  console.log('🎮 Rendering 90s-style leaderboard...');
  const body = qs('#leaderboard-body');
  if (!body) {
    console.error('❌ Leaderboard body element not found');
    return;
  }
  
  playGameSound('menu_select');
  body.innerHTML = '';
  const sortBy = qs('#sort-by')?.value || 'bucks';
  const sortedTeams = sortTeams(sortBy);
  
  sortedTeams.forEach((team, idx) => {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    row.dataset.teamId = team.id;

    const displayRank = sortBy === 'playoffSeed' ? team.playoffSeed : (idx + 1);

    row.innerHTML = `
      <div class="rank-col">
        <span class="rank-display">${displayRank}</span>
      </div>
      <div class="team-col">
        <img class="team-logo" src="${generateTeamLogo(team.name, team.id)}" alt="${team.name}">
        <span class="team-name">${team.name}</span>
      </div>
      <div class="record-col team-record">${team.record}</div>
      <div class="points-col total-points">${team.totalPoints.toFixed(1)}</div>
      <div class="bucks-col">
        <div class="bucks-display">
          <span class="bucks-total">${team.laLigaBucks}</span>
          <span class="bucks-label">BUCKS</span>
        </div>
      </div>
      <div class="breakdown-col">
        <div class="breakdown-display">
          <div class="breakdown-item">
            <span class="breakdown-label">ESPN:</span>
            <span class="breakdown-value">${team.espnComponent}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">TOTAL:</span>
            <span class="breakdown-value">${team.cumulativeComponent}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">AVG:</span>
            <span class="breakdown-value">${team.weeklyAvgComponent}</span>
          </div>
        </div>
      </div>
      <div class="earnings-col earnings-display">${currency(team.earnings)}</div>
      <div class="high-scores-col high-scores-count">${team.weeklyHighScores}</div>
    `;

    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      console.log('🎮 Team clicked:', team.name);
      playGameSound('select');
      openTeamModal(team);
    });
    
    // Add hover sound effect
    row.addEventListener('mouseenter', () => {
      playGameSound('hover');
    });
    
    body.appendChild(row);
  });
  
  console.log('✅ 90s-style leaderboard rendered successfully');
}

/********************
 * Navigation        *
 ********************/
function setupNavigation() {
  console.log('🎮 Setting up 90s-style navigation...');
  const buttons = qsa('.nav-button');
  const sections = qsa('.content-section');

  console.log(`Found ${buttons.length} nav buttons and ${sections.length} sections`);

  buttons.forEach((button, index) => {
    console.log(`Setting up button ${index}:`, button.dataset.tab);
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('🎮 Nav button clicked:', button.dataset.tab);
      playGameSound('menu_select');
      
      // Remove active from all buttons
      buttons.forEach(b => b.classList.remove('active'));
      
      // Add active to clicked button
      button.classList.add('active');
      
      // Show target section
      const targetSectionId = `${button.dataset.tab}-section`;
      const success = showSection(targetSectionId);
      
      if (success) {
        // Initialize section-specific functionality
        switch (button.dataset.tab) {
          case 'teams':
            renderTeamsGrid();
            break;
          case 'money':
            renderMoneyBoard();
            setTimeout(() => renderEarningsChart(), 200);
            break;
          case 'commentary':
            renderCommentary();
            break;
          case 'matchups':
            renderMatchups();
            break;
          case 'dashboard':
            renderLeaderboard();
            break;
          case 'rules':
            // Rules section is static, no special rendering needed
            break;
          case 'admin':
            // Admin section is handled by forms, no special rendering needed
            break;
        }
      }
    });
    
    // Add hover effects
    button.addEventListener('mouseenter', () => {
      playGameSound('hover');
    });
  });
  
  console.log('✅ 90s-style navigation setup complete');
}

/********************
 * Week Selection    *
 ********************/
function setupWeekSelector() {
  const weekSelect = qs('#week-select');
  const currentIndicator = qs('#current-indicator');
  
  if (!weekSelect) {
    console.error('❌ Week selector not found');
    return;
  }
  
  console.log('🎮 Setting up week selector...');
  
  weekSelect.addEventListener('change', (e) => {
    console.log('📅 Week changed to:', e.target.value);
    playGameSound('select');
    currentWeek = parseInt(e.target.value);
    
    if (currentIndicator) {
      if (currentWeek === appData.league.currentWeek) {
        currentIndicator.textContent = '[CURRENT]';
        currentIndicator.style.display = 'inline';
      } else {
        currentIndicator.textContent = '[HISTORICAL]';
        currentIndicator.style.display = 'inline';
      }
    }
    
    // Update matchups week display
    const matchupsWeek = qs('#matchups-week');
    if (matchupsWeek) {
      matchupsWeek.textContent = String(currentWeek).padStart(2, '0');
    }
    
    // Re-render current section
    const activeSection = qs('.content-section.active');
    if (activeSection) {
      const sectionId = activeSection.id;
      switch (sectionId) {
        case 'dashboard-section':
          renderLeaderboard();
          break;
        case 'matchups-section':
          renderMatchups();
          break;
      }
    }
  });
}

/********************
 * Matchups Section  *
 ********************/
function renderMatchups() {
  console.log('🎮 Rendering 90s-style matchups...');
  const grid = qs('#matchups-grid');
  const weekSpan = qs('#matchups-week');
  
  if (!grid) {
    console.error('❌ Matchups grid element not found');
    return;
  }
  
  if (weekSpan) {
    weekSpan.textContent = String(currentWeek).padStart(2, '0');
  }
  
  grid.innerHTML = '';
  
  const weekMatchups = appData.matchups.filter(m => m.week === currentWeek);
  
  if (weekMatchups.length === 0) {
    grid.innerHTML = '<div style="color: #CCCCCC; text-align: center; grid-column: 1 / -1; padding: 40px; border: 2px solid #8A2BE2; background: #162447;">NO MATCHUP DATA AVAILABLE FOR THIS WEEK</div>';
    return;
  }
  
  weekMatchups.forEach(matchup => {
    const team1 = getTeamByName(matchup.team1);
    const team2 = getTeamByName(matchup.team2);
    
    if (!team1 || !team2) {
      console.warn('⚠️ Could not find teams for matchup:', matchup);
      return;
    }
    
    const team1Won = matchup.team1Score > matchup.team2Score;
    const team2Won = matchup.team2Score > matchup.team1Score;
    
    const card = document.createElement('div');
    card.className = 'matchup-card';
    
    card.innerHTML = `
      <div class="matchup-teams">
        <div class="matchup-team">
          <img src="${generateTeamLogo(team1.name, team1.id)}" alt="${team1.name}" style="width: 40px; height: 40px;">
          <div class="matchup-team-name">${team1.name}</div>
          <div class="matchup-score ${team1Won ? 'matchup-winner' : ''}">${matchup.team1Score}</div>
        </div>
        <div class="matchup-vs">VS</div>
        <div class="matchup-team">
          <img src="${generateTeamLogo(team2.name, team2.id)}" alt="${team2.name}" style="width: 40px; height: 40px;">
          <div class="matchup-team-name">${team2.name}</div>
          <div class="matchup-score ${team2Won ? 'matchup-winner' : ''}">${matchup.team2Score}</div>
        </div>
      </div>
      <div class="matchup-status">${matchup.status}</div>
    `;
    
    card.addEventListener('mouseenter', () => playGameSound('hover'));
    grid.appendChild(card);
  });
  
  console.log('✅ 90s-style matchups rendered');
}

/********************
 * Teams Section     *
 ********************/
function renderTeamsGrid() {
  console.log('🎮 Rendering 90s-style teams grid...');
  const grid = qs('#teams-grid');
  if (!grid) {
    console.error('❌ Teams grid element not found');
    return;
  }
  
  grid.innerHTML = '';
  const sortedTeams = sortTeams('playoffSeed');
  
  sortedTeams.forEach(team => {
    const card = document.createElement('div');
    card.className = 'team-card';
    
    card.innerHTML = `
      <div class="team-card-header" style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #8A2BE2;">
        <img src="${generateTeamLogo(team.name, team.id)}" alt="${team.name}" style="width: 40px; height: 40px;">
        <div>
          <h4 style="margin: 0; color: #20B2AA; font-weight: 900; text-shadow: 1px 1px 0 #333333;">${team.name}</h4>
          <p style="margin: 4px 0; color: #CCCCCC; font-size: 12px; font-weight: 700;">OWNER: ${team.owner.toUpperCase()} • SEED: ${team.playoffSeed}</p>
        </div>
      </div>
      <div class="team-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; font-weight: 700;">
        <div class="stat" style="color: #FFFFFF;"><strong style="color: #FFD700;">ESPN RANK:</strong> ${team.espnRank}</div>
        <div class="stat" style="color: #FFFFFF;"><strong style="color: #FFD700;">RECORD:</strong> ${team.record}</div>
        <div class="stat" style="color: #FFFFFF;"><strong style="color: #FFD700;">POINTS FOR:</strong> ${team.totalPoints.toFixed(1)}</div>
        <div class="stat" style="color: #FFFFFF;"><strong style="color: #FFD700;">LA LIGA BUCKS:</strong> ${team.laLigaBucks}</div>
        <div class="stat" style="color: #FFFFFF;"><strong style="color: #FFD700;">EARNINGS:</strong> ${currency(team.earnings)}</div>
        <div class="stat" style="color: #FFFFFF;"><strong style="color: #FFD700;">HIGH SCORES:</strong> ${team.weeklyHighScores}</div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      playGameSound('select');
      openTeamModal(team);
    });
    
    card.addEventListener('mouseenter', () => playGameSound('hover'));
    grid.appendChild(card);
  });
  
  console.log('✅ 90s-style teams grid rendered');
}

/********************
 * Money Board       *
 ********************/
function renderMoneyBoard() {
  console.log('🎮 Rendering 90s-style money board...');
  const totalPaid = appData.teams.reduce((sum, team) => sum + team.earnings, 0);
  const totalPaidEl = qs('#total-paid');
  const remainingEl = qs('#remaining-pool');
  
  if (totalPaidEl) totalPaidEl.textContent = currency(totalPaid);
  if (remainingEl) remainingEl.textContent = currency(appData.league.prizePool - totalPaid);

  const winnersList = qs('#winners-list');
  if (!winnersList) return;
  
  winnersList.innerHTML = '';
  const winners = appData.teams.filter(team => team.weeklyHighScores > 0);
  
  if (winners.length === 0) {
    winnersList.innerHTML = '<div style="color: #CCCCCC; text-align: center; padding: 20px; border: 2px solid #8A2BE2; background: #1a1a2e;">NO WEEKLY HIGH SCORE WINNERS YET</div>';
    return;
  }
  
  winners.forEach(team => {
    for (let i = 0; i < team.weeklyHighScores; i++) {
      const item = document.createElement('div');
      item.className = 'winner-item';
      item.style.cssText = `
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        margin-bottom: 4px;
        background: #1a1a2e;
        border: 1px solid #8A2BE2;
        color: #FFFFFF;
        font-weight: 700;
        font-size: 12px;
      `;
      item.innerHTML = `
        <span>${team.name}</span>
        <span style="color: #32CD32; font-weight: 900;">${currency(appData.league.weeklyBonus)}</span>
      `;
      winnersList.appendChild(item);
    }
  });
}

function renderEarningsChart() {
  console.log('🎮 Creating 90s-style earnings chart...');
  const canvas = qs('#earningsChart');
  
  if (!canvas) {
    console.error('❌ Earnings chart canvas not found');
    return;
  }
  
  if (typeof Chart === 'undefined') {
    console.error('❌ Chart.js is not loaded');
    canvas.parentElement.innerHTML = '<div style="color: #CCCCCC; text-align: center; padding: 40px;">CHART.JS FAILED TO LOAD</div>';
    return;
  }
  
  const ctx = canvas.getContext('2d');
  
  if (window.earningsChart && typeof window.earningsChart.destroy === 'function') {
    window.earningsChart.destroy();
  }
  
  canvas.style.display = 'block';
  canvas.width = canvas.offsetWidth || 800;
  canvas.height = 400;
  
  const chartData = appData.teams
    .sort((a, b) => b.earnings - a.earnings)
    .map(team => ({
      name: team.name.length > 15 ? team.name.substring(0, 15) + '...' : team.name,
      earnings: team.earnings
    }));
  
  try {
    window.earningsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.name),
        datasets: [{
          label: 'EARNINGS ($)',
          data: chartData.map(d => d.earnings),
          backgroundColor: '#20B2AA',
          borderColor: '#FFFFFF',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#FFFFFF',
              font: {
                family: 'Orbitron, monospace',
                weight: 'bold'
              }
            },
            grid: {
              color: '#8A2BE2'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#FFFFFF',
              font: {
                family: 'Orbitron, monospace',
                weight: 'bold'
              },
              callback: function(value) {
                return '$' + value;
              }
            },
            grid: {
              color: '#8A2BE2'
            }
          }
        }
      }
    });
    
    console.log('✅ 90s-style earnings chart created');
    
  } catch (error) {
    console.error('❌ Error creating earnings chart:', error);
    canvas.parentElement.innerHTML = `
      <div class="panel-header">TEAM EARNINGS COMPARISON</div>
      <div style="color: #CCCCCC; text-align: center; padding: 40px;">
        <p>CHART FAILED TO RENDER: ${error.message}</p>
      </div>
    `;
  }
}

/********************
 * Commentary        *
 ********************/
function renderCommentary() {
  console.log('🎮 Rendering 90s-style commentary...');
  const container = qs('#commentary-container');
  if (!container) {
    console.error('❌ Commentary container not found');
    return;
  }
  
  container.innerHTML = '';
  appData.commentary.forEach(comment => {
    const item = document.createElement('div');
    item.className = 'commentary-item';
    item.textContent = comment;
    container.appendChild(item);
  });
}

/********************
 * Team Modal        *
 ********************/
function openTeamModal(team) {
  console.log('🎮 Opening 90s-style team modal for:', team.name);
  playGameSound('select');
  
  const overlay = qs('#team-modal-overlay');
  const nameEl = qs('#modal-team-name');
  const bodyEl = qs('#modal-body');
  
  if (!overlay || !nameEl || !bodyEl) {
    console.error('❌ Modal elements not found');
    return;
  }
  
  nameEl.innerHTML = `
    <img src="https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/e0e0d2d9-5f81-49e5-9100-c536e96857b5.png" class="panel-trophy" alt="Trophy">
    ${team.name.toUpperCase()}
  `;
  
  const totalComponents = team.espnComponent + team.cumulativeComponent + team.weeklyAvgComponent;
  
  bodyEl.innerHTML = `
    <div class="team-modal-content" style="color: #FFFFFF;">
      <div class="team-header" style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #20B2AA;">
        <img src="${generateTeamLogo(team.name, team.id)}" alt="${team.name}" style="width: 60px; height: 60px;">
        <div>
          <h3 style="color: #20B2AA; margin: 0; font-weight: 900; text-shadow: 2px 2px 0 #333333;">${team.name}</h3>
          <p style="margin: 4px 0; color: #CCCCCC; font-weight: 700;"><strong>OWNER:</strong> ${team.owner.toUpperCase()}</p>
          <p style="margin: 4px 0; color: #CCCCCC; font-weight: 700;"><strong>PLAYOFF SEED:</strong> ${team.playoffSeed}</p>
        </div>
      </div>
      
      <div class="team-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
        <div class="stat-group" style="background: #162447; padding: 16px; border: 2px solid #8A2BE2;">
          <h4 style="color: #20B2AA; margin-bottom: 12px; font-weight: 900;">SEASON STATS</h4>
          <p style="color: #FFFFFF; font-weight: 700;"><strong style="color: #FFD700;">ESPN RANK:</strong> ${team.espnRank}</p>
          <p style="color: #FFFFFF; font-weight: 700;"><strong style="color: #FFD700;">RECORD:</strong> ${team.record}</p>
          <p style="color: #FFFFFF; font-weight: 700;"><strong style="color: #FFD700;">TOTAL POINTS:</strong> ${team.totalPoints.toFixed(2)}</p>
        </div>
        
        <div class="stat-group" style="background: #162447; padding: 16px; border: 2px solid #FF1493;">
          <h4 style="color: #20B2AA; margin-bottom: 12px; font-weight: 900;">LA LIGA BUCKS</h4>
          <p style="color: #FFFFFF; font-weight: 700;"><strong style="color: #FFD700;">ESPN COMPONENT:</strong> ${team.espnComponent}/12</p>
          <p style="color: #FFFFFF; font-weight: 700;"><strong style="color: #FFD700;">CUMULATIVE COMPONENT:</strong> ${team.cumulativeComponent}/12</p>
          <p style="color: #FFFFFF; font-weight: 700;"><strong style="color: #FFD700;">WEEKLY AVG COMPONENT:</strong> ${team.weeklyAvgComponent}/12</p>
          <p style="color: #20B2AA; font-weight: 900; font-size: 16px;"><strong>TOTAL LA LIGA BUCKS:</strong> ${team.laLigaBucks}</p>
        </div>
        
        <div class="stat-group" style="background: #162447; padding: 16px; border: 2px solid #32CD32;">
          <h4 style="color: #20B2AA; margin-bottom: 12px; font-weight: 900;">MONEY STATS</h4>
          <p style="color: #FFFFFF; font-weight: 700;"><strong style="color: #FFD700;">HIGH SCORE WEEKS:</strong> ${team.weeklyHighScores}</p>
          <p style="color: #FFFFFF; font-weight: 700;"><strong style="color: #FFD700;">WEEKLY BONUSES:</strong> ${currency(team.weeklyHighScores * appData.league.weeklyBonus)}</p>
          <p style="color: #32CD32; font-weight: 900; font-size: 16px;"><strong>TOTAL EARNINGS:</strong> ${currency(team.earnings)}</p>
        </div>
      </div>
    </div>
  `;
  
  overlay.classList.add('active');
}

function setupModalClose() {
  console.log('🎮 Setting up modal close handlers...');
  const overlay = qs('#team-modal-overlay');
  const closeBtn = qs('#close-modal');
  
  if (!overlay || !closeBtn) {
    console.error('❌ Modal elements not found for close setup');
    return;
  }
  
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    playGameSound('back');
    overlay.classList.remove('active');
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      playGameSound('back');
      overlay.classList.remove('active');
    }
  });
  
  closeBtn.addEventListener('mouseenter', () => playGameSound('hover'));
}

/********************
 * Admin Panel       *
 ********************/
function setupAdmin() {
  console.log('🎮 Setting up admin panel...');
  const loginBtn = qs('#admin-login-btn');
  const logoutBtn = qs('#admin-logout');
  const usernameInput = qs('#admin-username');
  const passwordInput = qs('#admin-password');
  const loginSection = qs('#admin-login');
  const panelSection = qs('#admin-panel');
  
  if (!loginBtn) {
    console.error('❌ Admin login button not found');
    return;
  }
  
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    playGameSound('select');
    
    const username = usernameInput?.value;
    const password = passwordInput?.value;
    
    if (username === 'admin' && password === 'laliga2024') {
      console.log('✅ Admin login successful');
      isAdminLoggedIn = true;
      playGameSound('success');
      
      if (loginSection) loginSection.style.display = 'none';
      if (panelSection) panelSection.style.display = 'block';
      
      if (usernameInput) usernameInput.value = '';
      if (passwordInput) passwordInput.value = '';
    } else {
      console.log('❌ Admin login failed');
      playGameSound('error');
      alert('⚠️ INVALID CREDENTIALS! TRY: admin / laliga2024');
    }
  });
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      playGameSound('back');
      isAdminLoggedIn = false;
      if (loginSection) loginSection.style.display = 'block';
      if (panelSection) panelSection.style.display = 'none';
    });
  }
  
  // Admin button hover effects
  [loginBtn, logoutBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('mouseenter', () => playGameSound('hover'));
    }
  });
  
  // Handle adding champions and sackos
  const addChampionBtn = qs('#add-champion');
  const addSackoBtn = qs('#add-sacko');
  
  if (addChampionBtn) {
    addChampionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      playGameSound('select');
      const year = parseInt(qs('#champion-year')?.value);
      const winner = qs('#champion-winner')?.value;
      
      if (year && winner) {
        appData.championsHistory.unshift({ year, team: winner, owner: 'Admin' });
        updateBanners();
        qs('#champion-year').value = '';
        qs('#champion-winner').value = '';
        playGameSound('success');
        alert('🏆 CHAMPION ADDED TO HALL OF FAME!');
      } else {
        playGameSound('error');
        alert('⚠️ PLEASE ENTER BOTH YEAR AND WINNER NAME!');
      }
    });
    
    addChampionBtn.addEventListener('mouseenter', () => playGameSound('hover'));
  }
  
  if (addSackoBtn) {
    addSackoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      playGameSound('select');
      const year = parseInt(qs('#sacko-year')?.value);
      const loser = qs('#sacko-loser')?.value;
      
      if (year && loser) {
        appData.sackoHistory.unshift({ year, team: loser, owner: 'Admin' });
        updateBanners();
        qs('#sacko-year').value = '';
        qs('#sacko-loser').value = '';
        playGameSound('success');
        alert('💀 SACKO ADDED TO HALL OF SHAME!');
      } else {
        playGameSound('error');
        alert('⚠️ PLEASE ENTER BOTH YEAR AND LOSER NAME!');
      }
    });
    
    addSackoBtn.addEventListener('mouseenter', () => playGameSound('hover'));
  }
}

function updateBanners() {
  console.log('🎮 Updating 90s-style banners...');
  const championsBanner = qs('#champions-banner');
  const sackoBanner = qs('#sacko-banner');
  
  if (championsBanner) {
    const championsText = appData.championsHistory
      .map(c => `${c.year} ${c.team}`)
      .join(' ★ ');
    championsBanner.innerHTML = `
      <img src="https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/98e35486-b07f-4353-95ef-c032a1dc9655.png" class="banner-trophy" alt="Trophy">
      CHAMPIONS: ${championsText}
      <img src="https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/98e35486-b07f-4353-95ef-c032a1dc9655.png" class="banner-trophy" alt="Trophy">
    `;
  }
  
  if (sackoBanner) {
    const sackoText = appData.sackoHistory
      .map(s => `${s.year} ${s.team}`)
      .join(' ▼ ');
    sackoBanner.textContent = `▼ SACKO HALL OF SHAME: ${sackoText} ▼`;
  }
}

/********************
 * Sorting           *
 ********************/
function setupSorting() {
  console.log('🎮 Setting up sorting...');
  const sortSelect = qs('#sort-by');
  if (!sortSelect) {
    console.error('❌ Sort select element not found');
    return;
  }
  
  sortSelect.addEventListener('change', (e) => {
    console.log('🔄 Sort changed to:', e.target.value);
    playGameSound('select');
    renderLeaderboard();
  });
  
  sortSelect.addEventListener('mouseenter', () => playGameSound('hover'));
}

/********************
 * Initialization    *
 ********************/
async function init() {
  console.log('🎮 INITIALIZING LA LIGA DEL FUEGO - 90S STYLE DASHBOARD...');
  console.log('📺 LOADING CLASSIC MADDEN VIBES WITH PIXEL ART TROPHIES...');
  
  try {
    // Play startup sound
    playGameSound('startup');
    
    // Initialize API connection
    console.log('🔌 Connecting to La Liga del Fuego API...');
    const apiConnected = await initializeAPI();
    
    if (apiConnected) {
      console.log('✅ API CONNECTION ESTABLISHED - LOADING LIVE DATA!');
      
      // Load live team data
      try {
        const liveTeams = await loadLiveTeamData(appData.league.currentWeek, appData.league.season);
        if (liveTeams && liveTeams.length > 0) {
          appData.teams = liveTeams;
          console.log('✅ LIVE TEAM DATA LOADED FROM ESPN API!');
        }
      } catch (error) {
        console.warn('⚠️ Failed to load live team data, using static data:', error);
      }
      
      // Load live matchup data
      try {
        const liveMatchups = await loadMatchupData(appData.league.currentWeek, appData.league.season);
        if (liveMatchups && liveMatchups.length > 0) {
          appData.matchups = liveMatchups;
          console.log('✅ LIVE MATCHUP DATA LOADED FROM ESPN API!');
        }
      } catch (error) {
        console.warn('⚠️ Failed to load live matchup data, using static data:', error);
      }
    } else {
      console.warn('⚠️ API CONNECTION FAILED - USING STATIC DATA');
    }
    
    // Update banners with latest data
    updateBanners();
    
    // Ensure dashboard section is visible on load
    showSection('dashboard-section');
    
    // Render initial content with potentially live data
    renderLeaderboard();
    renderCommentary();
    
    // Setup all interactive components
    setupNavigation();
    setupWeekSelector();
    setupAdmin();
    setupModalClose();
    setupSorting();
    
    // Add hover effects to all buttons
    qsa('.game-button, .nav-button, .game-select, .game-input').forEach(element => {
      element.addEventListener('mouseenter', () => playGameSound('hover'));
    });
    
    console.log('✅ 90S STYLE DASHBOARD WITH PIXEL TROPHIES INITIALIZED SUCCESSFULLY!');
    console.log('🕹️  READY FOR FANTASY FOOTBALL ACTION!');
    
    // Setup periodic data refresh if API is available
    if (apiConnected) {
      setInterval(async () => {
        try {
          console.log('🔄 Refreshing live data...');
          const updatedTeams = await loadLiveTeamData(appData.league.currentWeek);
          if (updatedTeams && updatedTeams.length > 0) {
            appData.teams = updatedTeams;
            renderLeaderboard(); // Re-render with updated data
          }
        } catch (error) {
          console.warn('Failed to refresh data:', error);
        }
      }, 5 * 60 * 1000); // Refresh every 5 minutes
    }
    
    // Show welcome message
    setTimeout(() => {
      console.log('🏆 WELCOME TO LA LIGA DEL FUEGO - THE ULTIMATE 90S FANTASY EXPERIENCE!');
    }, 1000);
    
  } catch (error) {
    console.error('❌ ERROR DURING 90S DASHBOARD INITIALIZATION:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}