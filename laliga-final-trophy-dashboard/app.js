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

/********************
 * Data Management    *
 ********************/
// Demo team data for fallback when API fails
function getDemoTeamData() {
  return [
    { id: 1, name: "Kris P. Roni", owner: "Kris McKissack", record: "11-3-0", totalPoints: 1876.2, laLigaBucks: 24, espnRank: 1, espnComponent: 12, totalPointsComponent: 12, playoffSeed: 1, earnings: 200, weeklyHighScores: 4 },
    { id: 2, name: "Murican Futball Crusaders", owner: "Scott Williams", record: "10-4-0", totalPoints: 1834.5, laLigaBucks: 22, espnRank: 2, espnComponent: 11, totalPointsComponent: 11, playoffSeed: 2, earnings: 100, weeklyHighScores: 2 },
    { id: 3, name: "Vonnies Chubbies", owner: "Jeff Parr", record: "9-5-0", totalPoints: 1798.3, laLigaBucks: 20, espnRank: 3, espnComponent: 10, totalPointsComponent: 10, playoffSeed: 3, earnings: 50, weeklyHighScores: 1 },
    { id: 4, name: "Blondes Give Me A Chubb", owner: "Adam Haywood", record: "9-5-0", totalPoints: 1912.7, laLigaBucks: 21, espnRank: 4, espnComponent: 9, totalPointsComponent: 12, playoffSeed: 4, earnings: 150, weeklyHighScores: 3 },
    { id: 5, name: "The Peeping Tomlins", owner: "Eric Butler", record: "8-6-0", totalPoints: 1756.4, laLigaBucks: 17, espnRank: 5, espnComponent: 8, totalPointsComponent: 9, playoffSeed: 5, earnings: 100, weeklyHighScores: 2 },
    { id: 6, name: "Nothing to CTE Here", owner: "Matthew Kelsall", record: "7-7-0", totalPoints: 1689.5, laLigaBucks: 13, espnRank: 6, espnComponent: 7, totalPointsComponent: 6, playoffSeed: 6, earnings: 0, weeklyHighScores: 0 },
    { id: 7, name: "Hurts in the Brown Bachs", owner: "Niklas Markley", record: "6-8-0", totalPoints: 1642.8, laLigaBucks: 11, espnRank: 7, espnComponent: 6, totalPointsComponent: 5, playoffSeed: 7, earnings: 50, weeklyHighScores: 1 },
    { id: 8, name: "Purple Reign", owner: "Boston Weir", record: "5-9-0", totalPoints: 1623.1, laLigaBucks: 9, espnRank: 8, espnComponent: 5, totalPointsComponent: 4, playoffSeed: 8, earnings: 0, weeklyHighScores: 0 },
    { id: 9, name: "I am Magic Claw", owner: "Shane Williams", record: "4-10-0", totalPoints: 1587.2, laLigaBucks: 7, espnRank: 9, espnComponent: 4, totalPointsComponent: 3, playoffSeed: 9, earnings: 0, weeklyHighScores: 0 },
    { id: 10, name: "California Sunday School", owner: "Justin Price", record: "4-10-0", totalPoints: 1564.9, laLigaBucks: 5, espnRank: 10, espnComponent: 3, totalPointsComponent: 2, playoffSeed: 10, earnings: 0, weeklyHighScores: 0 },
    { id: 11, name: "The Annexation of Puerto Rico", owner: "Brian Butler", record: "3-11-0", totalPoints: 1521.4, laLigaBucks: 3, espnRank: 11, espnComponent: 2, totalPointsComponent: 1, playoffSeed: 11, earnings: 0, weeklyHighScores: 0 },
    { id: 12, name: "Show me your TDs", owner: "Mike Haywood", record: "2-12-0", totalPoints: 1478.6, laLigaBucks: 2, espnRank: 12, espnComponent: 1, totalPointsComponent: 1, playoffSeed: 12, earnings: 0, weeklyHighScores: 0 }
  ];
}

function showDataLoadingError(message) {
  const leaderboardBody = document.getElementById('leaderboard-body');
  if (leaderboardBody) {
    leaderboardBody.innerHTML = `
      <div class="data-error-container" style="
        grid-column: 1 / -1;
        padding: 40px;
        text-align: center;
        background: var(--game-bg-secondary);
        border: 2px solid var(--game-red);
        color: var(--game-red);
        font-weight: 700;
        font-size: 16px;
      ">
        <div style="font-size: 24px; margin-bottom: 16px;">⚠️ DATA LOADING ERROR</div>
        <div style="margin-bottom: 16px;">${message}</div>
        <div style="font-size: 14px; color: var(--game-gray);">
          Check that the ESPN API server is running and accessible.
        </div>
      </div>
    `;
  }
}

function getDemoMatchupData() {
  return [
    // Week 14 matchups
    { week: 14, team1: "Mahomes Sweet Home", team2: "Dawgs By 90", team1Score: 139.9, team2Score: 139.0, status: "final" },
    { week: 14, team1: "Purple Reign", team2: "Blondes Give Me A Chubb", team1Score: 120.7, team2Score: 126.3, status: "final" },
    { week: 14, team1: "Hurts in the Brown Bachs", team2: "Kris P. Roni", team1Score: 130.1, team2Score: 99.0, status: "final" },
    
    // Week 13 matchups
    { week: 13, team1: "Mahomes Sweet Home", team2: "Purple Reign", team1Score: 135.8, team2Score: 114.6, status: "final" },
    { week: 13, team1: "Dawgs By 90", team2: "Blondes Give Me A Chubb", team1Score: 131.7, team2Score: 129.5, status: "final" },
    { week: 13, team1: "Hurts in the Brown Bachs", team2: "Kris P. Roni", team1Score: 124.7, team2Score: 142.8, status: "final" },
    
    // Add more weeks as needed...
  ];
}

/********************
 * Banner Update System *
 ********************/
function updateBanners() {
  try {
    // Update champions banner
    const championsArray = appData.championsHistory || [];
    if (championsArray.length > 0) {
      const latestChampion = championsArray[0];
      const championsBannerElement = document.getElementById('champions-banner');
      if (championsBannerElement && latestChampion) {
        // Keep the trophy images and add the champion text
        championsBannerElement.innerHTML = championsBannerElement.innerHTML.replace(
          /REIGNING CHAMPION:.*/,
          `REIGNING CHAMPION: ${latestChampion.team} (${latestChampion.year})`
        );
      }
    }
    
    // Update sacko banner
    const sackoArray = appData.sackoHistory || [];
    if (sackoArray.length > 0) {
      const latestSacko = sackoArray[0];
      const sackoBannerElement = document.getElementById('sacko-banner');
      if (sackoBannerElement && latestSacko) {
        sackoBannerElement.textContent = `SACKO HOLDER: ${latestSacko.team} (${latestSacko.year})`;
      }
    }
    
    console.log('🏆 Banners updated successfully');
  } catch (error) {
    console.warn('⚠️ Error updating banners:', error);
  }
}

/********************
 * Ranking Change System *
 ********************/

// Store previous week rankings for comparison
let previousWeekRankings = {};
let currentWeekRankings = {};

// Calculate ranking changes between weeks
function calculateRankingChanges(teams, currentWeek) {
  const sortedTeams = [...teams].sort((a, b) => (b.laLigaBucks || 0) - (a.laLigaBucks || 0));
  
  // Generate current week rankings
  currentWeekRankings = {};
  sortedTeams.forEach((team, index) => {
    currentWeekRankings[team.id] = {
      rank: index + 1,
      laLigaBucks: team.laLigaBucks || 0,
      totalPoints: team.totalPoints || 0,
      record: team.record || '0-0-0',
      teamName: team.name || team.teamName
    };
  });
  
  // Calculate changes from previous week
  const rankingChanges = {};
  sortedTeams.forEach((team, index) => {
    const currentRank = index + 1;
    const previousRank = previousWeekRankings[team.id]?.rank;
    
    if (previousRank === undefined) {
      // New team or first week - treat as no change
      rankingChanges[team.id] = {
        type: 'same',
        change: 0,
        direction: 'same',
        previousRank: null,
        currentRank: currentRank
      };
    } else {
      const change = previousRank - currentRank; // Positive = moved up
      let direction = 'same';
      let type = 'same';
      
      if (change > 0) {
        direction = 'up';
        type = 'up';
      } else if (change < 0) {
        direction = 'down';
        type = 'down';
      }
      
      rankingChanges[team.id] = {
        type: type,
        change: Math.abs(change),
        direction: direction,
        previousRank: previousRank,
        currentRank: currentRank
      };
    }
    
    // Calculate week-over-week stats
    const previousStats = previousWeekRankings[team.id];
    if (previousStats) {
      rankingChanges[team.id].bucksChange = (team.laLigaBucks || 0) - (previousStats.laLigaBucks || 0);
      rankingChanges[team.id].pointsChange = (team.totalPoints || 0) - (previousStats.totalPoints || 0);
    }
  });
  
  return rankingChanges;
}

// Generate ranking change indicator HTML
function generateRankingIndicator(teamId, rankingChanges) {
  const change = rankingChanges[teamId];
  if (!change) return '';
  
  let html = '';
  let arrow = '';
  let text = '';
  
  switch (change.type) {
    case 'up':
      arrow = '▲';
      text = change.change > 0 ? `${change.change}` : '';
      html = `<span class="ranking-change up">
        <span class="ranking-arrow">${arrow}</span>${text}
      </span>`;
      break;
      
    case 'down':
      arrow = '▼';
      text = change.change > 0 ? `${change.change}` : '';
      html = `<span class="ranking-change down">
        <span class="ranking-arrow">${arrow}</span>${text}
      </span>`;
      break;
      
    case 'same':
      // No indicator for no change
      html = '';
      break;
  }
  
  return html;
}

// Generate week comparison badge
function generateWeekComparison(teamId, rankingChanges) {
  const change = rankingChanges[teamId];
  if (!change || change.bucksChange === undefined) return '';
  
  const bucksChange = change.bucksChange;
  let className = 'comparison-neutral';
  let arrow = '→';
  let prefix = '';
  
  if (bucksChange > 0) {
    className = 'comparison-positive';
    arrow = '↗';
    prefix = '+';
  } else if (bucksChange < 0) {
    className = 'comparison-negative';
    arrow = '↘';
  }
  
  return `<span class="week-comparison">
    <span class="comparison-arrow">${arrow}</span>
    <span class="${className}">${prefix}${bucksChange} BUCKS</span>
  </span>`;
}

// Calculate hot/cold streaks
function calculateStreaks(teams) {
  const streaks = {};
  
  teams.forEach(team => {
    // Simple streak calculation based on recent performance
    // This could be enhanced with more historical data
    const recentBucks = team.laLigaBucks || 0;
    const avgBucks = teams.reduce((sum, t) => sum + (t.laLigaBucks || 0), 0) / teams.length;
    
    if (recentBucks > avgBucks * 1.15) {
      streaks[team.id] = { type: 'hot', indicator: '🔥' };
    } else if (recentBucks < avgBucks * 0.85) {
      streaks[team.id] = { type: 'cold', indicator: '❄️' };
    }
  });
  
  return streaks;
}

// Store current rankings as previous for next week
function updatePreviousRankings() {
  previousWeekRankings = { ...currentWeekRankings };
  console.log('📊 Previous week rankings updated for comparison');
}

/********************
 * Invite System     *
 ********************/

// Generate unique invite link
async function generateInviteLink(managerName, email) {
  try {
    const inviteData = {
      managerName: managerName,
      email: email,
      leagueId: 'laliga-del-fuego-2025',
      timestamp: Date.now(),
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    const response = await apiClient.fetch('/admin/generate-invite', {
      method: 'POST',
      body: JSON.stringify(inviteData)
    });
    
    if (response && response.success) {
      return response.data.inviteLink;
    }
    
    throw new Error('Failed to generate invite link');
  } catch (error) {
    console.error('Error generating invite link:', error);
    throw error;
  }
}

// Send invitation email
async function sendInvitationEmail(managerName, email, customMessage = '') {
  try {
    const inviteLink = await generateInviteLink(managerName, email);
    
    const emailData = {
      to: email,
      managerName: managerName,
      inviteLink: inviteLink,
      customMessage: customMessage,
      leagueDetails: {
        name: 'La Liga del Fuego',
        season: '2025',
        prizePool: '$2,400',
        entryFee: '$200',
        draftDate: 'TBD',
        commissioner: 'League Commissioner'
      }
    };
    
    const response = await apiClient.fetch('/admin/send-invite', {
      method: 'POST',
      body: JSON.stringify(emailData)
    });
    
    if (response && response.success) {
      console.log('✅ Invitation sent successfully to', email);
      return true;
    }
    
    throw new Error('Failed to send invitation email');
  } catch (error) {
    console.error('Error sending invitation:', error);
    throw error;
  }
}

// Bulk invite system
async function sendBulkInvitations(inviteList) {
  const results = [];
  
  for (const invite of inviteList) {
    try {
      await sendInvitationEmail(invite.name, invite.email, invite.message);
      results.push({ ...invite, status: 'sent', error: null });
      playGameSound('success');
    } catch (error) {
      results.push({ ...invite, status: 'failed', error: error.message });
      playGameSound('error');
    }
    
    // Small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// Preview invitation email
function previewInvitationEmail(managerName, customMessage = '') {
  const previewWindow = window.open('', '_blank', 'width=600,height=800');
  
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invitation Preview</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .preview-header { background: #f0f0f0; padding: 10px; margin-bottom: 20px; }
        .template-container { border: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <div class="preview-header">
        <h2>📧 Email Invitation Preview</h2>
        <p><strong>To:</strong> ${managerName} (example@email.com)</p>
        <p><strong>Subject:</strong> You're Invited to La Liga del Fuego 2025!</p>
      </div>
      <div class="template-container">
        <iframe src="../templates/invite-email.html" width="100%" height="600"></iframe>
      </div>
    </body>
    </html>
  `;
  
  previewWindow.document.write(emailTemplate);
  previewWindow.document.close();
}

// Track invitation responses
async function trackInviteResponse(inviteToken, response) {
  try {
    const trackingData = {
      inviteToken: inviteToken,
      response: response, // 'accepted', 'declined', 'viewed'
      timestamp: Date.now()
    };
    
    const result = await apiClient.fetch('/admin/track-invite', {
      method: 'POST',
      body: JSON.stringify(trackingData)
    });
    
    return result && result.success;
  } catch (error) {
    console.error('Error tracking invite response:', error);
    return false;
  }
}

// Get invitation statistics
async function getInvitationStats() {
  try {
    const response = await apiClient.fetch('/admin/invitation-stats');
    if (response && response.success) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching invitation stats:', error);
    return null;
  }
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
  // Retrowave color palette for team logos
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
  
  // Calculate ranking changes and streaks
  const rankingChanges = calculateRankingChanges(sortedTeams, appData.league.currentWeek);
  const streaks = calculateStreaks(sortedTeams);
  
  sortedTeams.forEach((team, idx) => {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    row.dataset.teamId = team.id;

    const displayRank = sortBy === 'playoffSeed' ? team.playoffSeed : (idx + 1);
    
    // Generate ranking indicators
    const rankingIndicator = generateRankingIndicator(team.id, rankingChanges);
    const weekComparison = generateWeekComparison(team.id, rankingChanges);
    const streak = streaks[team.id];
    const streakIndicator = streak ? `<span class="streak-indicator streak-${streak.type}">${streak.indicator}</span>` : '';

    row.innerHTML = `
      <div class="rank-col">
        <div class="team-rank">
          <span class="rank-number">${displayRank}</span>
          ${rankingIndicator}
          ${streakIndicator}
        </div>
      </div>
      <div class="team-col">
        <img class="team-logo" src="${generateTeamLogo(team.name, team.id)}" alt="${team.name}">
        <span class="team-name">${team.name}</span>
        ${weekComparison}
      </div>
      <div class="record-col team-record">${team.record}</div>
      <div class="points-col total-points">${team.totalPoints.toFixed(1)}</div>
      <div class="breakdown-col">
        <div class="breakdown-display">
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-segment espn-segment" style="width: ${(team.espnComponent / 12) * 50}%"></div>
              <div class="progress-segment points-segment" style="width: ${(team.totalPointsComponent / 12) * 50}%"></div>
            </div>
            <div class="progress-text">${team.laLigaBucks} Total Liga Bucks</div>
          </div>
          <div class="breakdown-details">
            <span class="breakdown-item">ESPN: ${team.espnComponent}</span>
            <span class="breakdown-item">Points: ${team.totalPointsComponent}</span>
          </div>
        </div>
      </div>
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
function setupSeasonSelectors() {
  const yearSelect = qs('#year-select');
  const weekSelect = qs('#week-select');
  const currentIndicator = qs('#current-indicator');
  
  if (!yearSelect || !weekSelect) {
    console.error('❌ Season selectors not found');
    return;
  }
  
  console.log('🎮 Setting up season selectors...');
  
  // Year change handler
  yearSelect.addEventListener('change', async (e) => {
    console.log('📅 Year changed to:', e.target.value);
    playGameSound('select');
    appData.league.season = parseInt(e.target.value);
    
    updateCurrentIndicator();
    await loadHistoricalData(appData.league.season, currentWeek);
  });
  
  // Week change handler
  weekSelect.addEventListener('change', async (e) => {
    console.log('📅 Week changed to:', e.target.value);
    playGameSound('select');
    currentWeek = parseInt(e.target.value);
    
    updateCurrentIndicator();
    
    // Update matchups week display
    const matchupsWeek = qs('#matchups-week');
    if (matchupsWeek) {
      matchupsWeek.textContent = String(currentWeek).padStart(2, '0');
    }
    
    // Reload data for new week
    if (appData.league.season === 2024) {
      // Re-render current sections for current year
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
    } else {
      await loadHistoricalData(appData.league.season, currentWeek);
    }
  });
  
  function updateCurrentIndicator() {
    if (currentIndicator) {
      if (appData.league.season === 2024 && currentWeek === appData.league.currentWeek) {
        currentIndicator.textContent = '[CURRENT]';
        currentIndicator.style.display = 'inline';
        currentIndicator.style.color = 'var(--game-magenta)';
      } else if (appData.league.season < 2024) {
        currentIndicator.textContent = '[HISTORICAL]';
        currentIndicator.style.display = 'inline';
        currentIndicator.style.color = 'var(--game-yellow)';
      } else {
        currentIndicator.textContent = '[HISTORICAL]';
        currentIndicator.style.display = 'inline';
        currentIndicator.style.color = 'var(--game-gray)';
      }
    }
  }
}

async function loadHistoricalData(year, week) {
  console.log(`📊 Loading historical data for ${year} Week ${week}`);
  
  try {
    if (window.laLigaAPI) {
      const historicalTeams = await window.laLigaAPI.getTeams(year, week);
      if (historicalTeams && historicalTeams.length > 0) {
        appData.teams = historicalTeams;
        console.log(`✅ Loaded ${historicalTeams.length} teams for ${year}`);
        
        const historicalMatchups = await window.laLigaAPI.getMatchups(year, week);
        if (historicalMatchups) {
          appData.matchups = historicalMatchups;
        }
        
        renderLeaderboard();
        renderMatchups();
        renderTeamProfiles();
      } else {
        showDataLoadingError(`No historical data available for ${year} Week ${week}`);
      }
    } else {
      showDataLoadingError('API client not available for historical data');
    }
  } catch (error) {
    console.error(`❌ Failed to load historical data for ${year}:`, error);
    showDataLoadingError(`Failed to load historical data for ${year}: ${error.message}`);
  }
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
  
  const totalComponents = team.espnComponent + team.totalPointsComponent;
  
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
          <p style="color: #FFFFFF; font-weight: 700;"><strong style="color: #FFD700;">TOTAL POINTS COMPONENT:</strong> ${team.totalPointsComponent}/12</p>
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
  
  // Set up tab switching
  setupAdminTabs();
  
  // Set up form handlers for history management
  setupHistoryManagement();
  
  // Set up user management
  setupUserManagement();
  
  // Set up data management
  setupDataManagement();
  
  // Set up analytics
  setupAnalytics();
  
  // Set up settings
  setupSettings();
  
  // Check if user is already authenticated and admin
  if (window.adminAuth && window.adminAuth.isAdmin()) {
    initializeAdminData();
  }
}

// Admin tab switching functionality
function setupAdminTabs() {
  const tabButtons = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.admin-tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      playGameSound('select');
      
      const targetTab = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show target tab content
      tabContents.forEach(content => {
        content.style.display = 'none';
      });
      
      const targetContent = document.getElementById(`admin-${targetTab}-tab`);
      if (targetContent) {
        targetContent.style.display = 'block';
        
        // Load tab-specific data
        loadTabData(targetTab);
      }
    });
  });
}

// Load data for specific admin tab
async function loadTabData(tab) {
  try {
    switch (tab) {
      case 'history':
        await loadHistoryData();
        break;
      case 'users':
        await loadUserData();
        break;
      case 'data':
        await loadDataStatus();
        break;
      case 'analytics':
        await loadAnalyticsData();
        break;
      case 'settings':
        await loadSettingsData();
        break;
    }
  } catch (error) {
    console.error(`Error loading ${tab} data:`, error);
  }
}

// History management setup
function setupHistoryManagement() {
  const addChampionBtn = qs('#add-champion');
  const addSackoBtn = qs('#add-sacko');
  
  if (addChampionBtn) {
    addChampionBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      playGameSound('select');
      
      const year = qs('#champion-year')?.value;
      const winner = qs('#champion-winner')?.value;
      
      if (year && winner) {
        await addChampion(year, winner);
        qs('#champion-year').value = '';
        qs('#champion-winner').value = '';
        await loadHistoryData();
      }
    });
  }
  
  if (addSackoBtn) {
    addSackoBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      playGameSound('select');
      
      const year = qs('#sacko-year')?.value;
      const loser = qs('#sacko-loser')?.value;
      
      if (year && loser) {
        await addSacko(year, loser);
        qs('#sacko-year').value = '';
        qs('#sacko-loser').value = '';
        await loadHistoryData();
      }
    });
  }
}

// User management setup
function setupUserManagement() {
  const refreshBtn = qs('#refresh-users');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      playGameSound('select');
      await loadUserData();
    });
  }
}

// Data management setup
function setupDataManagement() {
  const exportButtons = {
    'export-teams': () => exportData('teams'),
    'export-matchups': () => exportData('matchups'),
    'export-users': () => exportData('users'),
    'export-all': () => exportData('all')
  };
  
  const syncButtons = {
    'sync-current-week': () => syncData('current'),
    'sync-all-weeks': () => syncData('all'),
    'force-refresh': () => forceRefresh()
  };
  
  Object.entries(exportButtons).forEach(([id, handler]) => {
    const btn = qs(`#${id}`);
    if (btn) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        playGameSound('select');
        await handler();
      });
    }
  });
  
  Object.entries(syncButtons).forEach(([id, handler]) => {
    const btn = qs(`#${id}`);
    if (btn) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        playGameSound('select');
        await handler();
      });
    }
  });
}

// Analytics setup
function setupAnalytics() {
  // Analytics are loaded when tab is activated
}

// Settings setup
function setupSettings() {
  const saveBtn = qs('#save-settings');
  const maintenanceButtons = {
    'clear-cache': clearCache,
    'reset-session': resetSessions,
    'emergency-stop': emergencyStop
  };
  
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      playGameSound('select');
      await saveSettings();
    });
  }
  
  Object.entries(maintenanceButtons).forEach(([id, handler]) => {
    const btn = qs(`#${id}`);
    if (btn) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        playGameSound('select');
        await handler();
      });
    }
  });
}

// Initialize admin data when panel is accessed
async function initializeAdminData() {
  console.log('🔧 Initializing admin data...');
  await loadHistoryData();
}

/********************
 * Admin Data Functions *
 ********************/

// Load history data (champions and sackos)
async function loadHistoryData() {
  try {
    // Load champions
    const championsResponse = await apiClient.fetch('/history/champions');
    if (championsResponse.success) {
      renderChampionsList(championsResponse.data);
    }
    
    // Load sackos  
    const sackosResponse = await apiClient.fetch('/history/sackos');
    if (sackosResponse.success) {
      renderSackosList(sackosResponse.data);
    }
  } catch (error) {
    console.error('Error loading history data:', error);
  }
}

// Render champions list
function renderChampionsList(champions) {
  const list = qs('#champions-list');
  if (!list) return;
  
  list.innerHTML = champions.map(champion => `
    <div class="history-item">
      <span class="year">${champion.year}</span>
      <span class="name">${champion.winner}</span>
      <button class="delete-btn" onclick="deleteChampion('${champion.year}')">DELETE</button>
    </div>
  `).join('');
}

// Render sackos list
function renderSackosList(sackos) {
  const list = qs('#sackos-list');
  if (!list) return;
  
  list.innerHTML = sackos.map(sacko => `
    <div class="history-item">
      <span class="year">${sacko.year}</span>
      <span class="name">${sacko.loser}</span>
      <button class="delete-btn" onclick="deleteSacko('${sacko.year}')">DELETE</button>
    </div>
  `).join('');
}

// Add champion
async function addChampion(year, winner) {
  try {
    const response = await apiClient.fetch('/history/champions', {
      method: 'POST',
      body: JSON.stringify({ year: parseInt(year), winner })
    });
    
    if (response.success) {
      playGameSound('success');
      console.log('✅ Champion added successfully');
    }
  } catch (error) {
    console.error('Error adding champion:', error);
    playGameSound('error');
  }
}

// Add sacko
async function addSacko(year, loser) {
  try {
    const response = await apiClient.fetch('/history/sackos', {
      method: 'POST',
      body: JSON.stringify({ year: parseInt(year), loser })
    });
    
    if (response.success) {
      playGameSound('success');
      console.log('✅ Sacko added successfully');
    }
  } catch (error) {
    console.error('Error adding sacko:', error);
    playGameSound('error');
  }
}

// Delete champion
async function deleteChampion(year) {
  if (confirm(`Delete champion record for ${year}?`)) {
    try {
      const response = await apiClient.fetch(`/history/champions/${year}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        playGameSound('success');
        await loadHistoryData();
      }
    } catch (error) {
      console.error('Error deleting champion:', error);
      playGameSound('error');
    }
  }
}

// Delete sacko
async function deleteSacko(year) {
  if (confirm(`Delete sacko record for ${year}?`)) {
    try {
      const response = await apiClient.fetch(`/history/sackos/${year}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        playGameSound('success');
        await loadHistoryData();
      }
    } catch (error) {
      console.error('Error deleting sacko:', error);
      playGameSound('error');
    }
  }
}

// Load user data
async function loadUserData() {
  try {
    const response = await apiClient.fetch('/admin/users');
    if (response.success) {
      const users = response.data;
      
      // Update user statistics
      qs('#total-users').textContent = users.length;
      qs('#active-users').textContent = users.filter(u => u.lastLogin).length;
      qs('#admin-users').textContent = users.filter(u => u.role === 'admin').length;
      
      // Render users table
      renderUsersTable(users);
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Render users table
function renderUsersTable(users) {
  const tbody = qs('#users-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.teamName || 'Not set'}</td>
      <td>${user.role}</td>
      <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editUser('${user._id}')">EDIT</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">DELETE</button>
      </td>
    </tr>
  `).join('');
}

// Load data status
async function loadDataStatus() {
  try {
    const response = await apiClient.fetch('/admin/sync-status');
    if (response.success) {
      qs('#last-sync-time').textContent = response.data.lastSync ? 
        new Date(response.data.lastSync).toLocaleString() : 'Never';
    }
  } catch (error) {
    console.error('Error loading data status:', error);
  }
}

// Load analytics data
async function loadAnalyticsData() {
  try {
    const response = await apiClient.fetch('/admin/analytics');
    if (response.success) {
      const analytics = response.data;
      
      qs('#highest-score').textContent = analytics.highestScore || 0;
      qs('#most-bucks').textContent = analytics.mostBucks || 0;
      qs('#total-points').textContent = analytics.totalPoints || 0;
      qs('#avg-score').textContent = analytics.avgScore || 0;
      
      // Render analytics chart
      renderAnalyticsChart(analytics.chartData);
    }
  } catch (error) {
    console.error('Error loading analytics data:', error);
  }
}

// Load settings data
async function loadSettingsData() {
  try {
    const response = await apiClient.fetch('/admin/settings');
    if (response.success) {
      const settings = response.data;
      
      qs('#settings-current-week').value = settings.currentWeek || 14;
      qs('#settings-prize-pool').value = settings.prizePool || 2400;
      qs('#settings-weekly-bonus').value = settings.weeklyBonus || 50;
    }
  } catch (error) {
    console.error('Error loading settings data:', error);
  }
}

/********************
 * Admin Operations *
 ********************/

// Export data
async function exportData(type) {
  try {
    const response = await apiClient.fetch(`/admin/export/${type}`);
    if (response.success) {
      // Create and download file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laliga-${type}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      playGameSound('success');
      console.log(`✅ ${type} data exported successfully`);
    }
  } catch (error) {
    console.error(`Error exporting ${type} data:`, error);
    playGameSound('error');
  }
}

// Sync data
async function syncData(scope) {
  try {
    const response = await apiClient.fetch('/admin/sync', {
      method: 'POST',
      body: JSON.stringify({ scope })
    });
    
    if (response.success) {
      playGameSound('success');
      console.log(`✅ ${scope} data synced successfully`);
      await loadDataStatus();
    }
  } catch (error) {
    console.error(`Error syncing ${scope} data:`, error);
    playGameSound('error');
  }
}

// Force refresh  
async function forceRefresh() {
  if (confirm('Force refresh will reload all data from ESPN API. Continue?')) {
    try {
      const response = await apiClient.fetch('/admin/force-refresh', {
        method: 'POST'
      });
      
      if (response.success) {
        playGameSound('success');
        console.log('✅ Force refresh completed successfully');
        await loadDataStatus();
        // Refresh main dashboard
        await initializeApp();
      }
    } catch (error) {
      console.error('Error during force refresh:', error);
      playGameSound('error');
    }
  }
}

// Save settings
async function saveSettings() {
  try {
    const settings = {
      currentWeek: parseInt(qs('#settings-current-week').value),
      prizePool: parseInt(qs('#settings-prize-pool').value),
      weeklyBonus: parseInt(qs('#settings-weekly-bonus').value)
    };
    
    const response = await apiClient.fetch('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    
    if (response.success) {
      playGameSound('success');
      console.log('✅ Settings saved successfully');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    playGameSound('error');
  }
}

// Maintenance functions
async function clearCache() {
  if (confirm('Clear all cached data?')) {
    try {
      const response = await apiClient.fetch('/admin/clear-cache', {
        method: 'POST'
      });
      
      if (response.success) {
        playGameSound('success');
        console.log('✅ Cache cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      playGameSound('error'); 
    }
  }
}

async function resetSessions() {
  if (confirm('Reset all user sessions? Users will need to login again.')) {
    try {
      const response = await apiClient.fetch('/admin/reset-sessions', {
        method: 'POST'
      });
      
      if (response.success) {
        playGameSound('success');
        console.log('✅ Sessions reset successfully');
      }
    } catch (error) {
      console.error('Error resetting sessions:', error);
      playGameSound('error');
    }
  }
}

async function emergencyStop() {
  if (confirm('EMERGENCY STOP: This will disable all API endpoints except admin. Continue?')) {
    try {
      const response = await apiClient.fetch('/admin/emergency-stop', {
        method: 'POST'
      });
      
      if (response.success) {
        playGameSound('success');
        console.log('✅ Emergency stop activated');
      }
    } catch (error) {
      console.error('Error activating emergency stop:', error);
      playGameSound('error');
    }
  }
}

// Helper functions for user management
async function editUser(userId) {
  try {
    // Get user data
    const response = await apiClient.fetch(`/admin/users/${userId}`);
    if (!response.success) {
      throw new Error('Failed to load user data');
    }
    
    const user = response.data;
    
    // Create edit modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'edit-user-modal';
    modal.innerHTML = `
      <div class="modal-content game-panel">
        <div class="modal-header">
          <div class="panel-header">
            <img src="https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/e0e0d2d9-5f81-49e5-9100-c536e96857b5.png" class="panel-trophy" alt="Trophy">
            EDIT USER: ${user.username}
          </div>
          <button class="close-modal" onclick="closeEditUserModal()">✕</button>
        </div>
        <div class="modal-body">
          <form id="edit-user-form">
            <div class="form-group">
              <label class="form-label">USERNAME</label>
              <input type="text" name="username" class="form-control game-input" value="${user.username}" required>
            </div>
            <div class="form-group">
              <label class="form-label">EMAIL</label>
              <input type="email" name="email" class="form-control game-input" value="${user.email}" required>
            </div>
            <div class="form-group">
              <label class="form-label">TEAM NAME</label>
              <input type="text" name="teamName" class="form-control game-input" value="${user.teamName || ''}" placeholder="Optional">
            </div>
            <div class="form-group">
              <label class="form-label">ROLE</label>
              <select name="role" class="form-control game-select" required>
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>USER</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>ADMIN</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">ESPN OWNER ID</label>
              <input type="text" name="espnOwnerId" class="form-control game-input" value="${user.espnOwnerId || ''}" placeholder="Optional">
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" name="resetPassword" class="game-checkbox"> 
                SEND PASSWORD RESET EMAIL
              </label>
            </div>
            <div class="form-buttons">
              <button type="submit" class="btn btn-primary game-button">SAVE CHANGES</button>
              <button type="button" class="btn btn-outline game-button" onclick="closeEditUserModal()">CANCEL</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Handle form submission
    const form = document.getElementById('edit-user-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleUserEdit(userId, new FormData(form));
    });
    
    playGameSound('select');
    
  } catch (error) {
    console.error('Error opening user edit modal:', error);
    playGameSound('error');
    alert('Failed to load user data for editing');
  }
}

// Handle user edit form submission
async function handleUserEdit(userId, formData) {
  try {
    const submitBtn = document.querySelector('#edit-user-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'SAVING...';
    submitBtn.disabled = true;
    
    const userData = {
      username: formData.get('username'),
      email: formData.get('email'),
      teamName: formData.get('teamName'),
      role: formData.get('role'),
      espnOwnerId: formData.get('espnOwnerId'),
      resetPassword: formData.get('resetPassword') === 'on'
    };
    
    const response = await apiClient.fetch(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    
    if (response.success) {
      playGameSound('success');
      closeEditUserModal();
      await loadUserData(); // Refresh user list
      console.log('✅ User updated successfully');
    } else {
      throw new Error(response.error || 'Failed to update user');
    }
    
  } catch (error) {
    console.error('Error updating user:', error);
    playGameSound('error');
    alert('Failed to update user: ' + error.message);
  } finally {
    const submitBtn = document.querySelector('#edit-user-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'SAVE CHANGES';
      submitBtn.disabled = false;
    }
  }
}

// Close edit user modal
function closeEditUserModal() {
  const modal = document.getElementById('edit-user-modal');
  if (modal) {
    modal.remove();
    playGameSound('back');
  }
}

async function deleteUser(userId) {
  if (confirm('Delete this user? This action cannot be undone.')) {
    try {
      const response = await apiClient.fetch(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        playGameSound('success');
        await loadUserData();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      playGameSound('error');
    }
  }
}

// Render analytics chart
function renderAnalyticsChart(chartData) {
  const canvas = qs('#analytics-chart');
  if (!canvas || !chartData) return;
  
  // Simple chart implementation - could use Chart.js for more advanced charts
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw basic bar chart
  ctx.fillStyle = '#00ffff';
  ctx.font = '12px Orbitron';
  
  chartData.forEach((item, index) => {
    const x = (index * 50) + 20;
    const height = (item.value / chartData.reduce((max, d) => Math.max(max, d.value), 0)) * 150;
    const y = 180 - height;
    
    ctx.fillRect(x, y, 40, height);
    ctx.fillText(item.label, x, 195);
  });
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
// Function to populate banners from league history
function populateBanners() {
  try {
    // Populate champions banner
    const championsElement = document.getElementById('champions-banner');
    if (championsElement && LEAGUE_HISTORY.champions) {
      let championsHtml = '';
      LEAGUE_HISTORY.champions.forEach((champion, index) => {
        if (champion.winner && champion.winner.trim() !== '') {
          championsHtml += `<img src="https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/98e35486-b07f-4353-95ef-c032a1dc9655.png" class="banner-trophy" alt="Trophy">`;
          if (index === 0) {
            championsHtml += `CHAMPIONS: ${champion.year} ${champion.winner} `;
          } else {
            championsHtml += `${champion.year} ${champion.winner} `;
          }
        }
      });
      if (championsHtml.endsWith(' ')) {
        championsHtml += '<img src="https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/98e35486-b07f-4353-95ef-c032a1dc9655.png" class="banner-trophy" alt="Trophy">';
      }
      championsElement.innerHTML = championsHtml;
    }

    // Populate sackos banner
    const sackosElement = document.getElementById('sacko-banner');
    if (sackosElement && LEAGUE_HISTORY && LEAGUE_HISTORY.sackos) {
      let sackosHtml = '';
      LEAGUE_HISTORY.sackos.forEach((sacko, index) => {
        if (sacko.loser && sacko.loser.trim() !== '') {
          if (index === 0) {
            sackosHtml += `▼ SACKO HALL OF SHAME: ${sacko.year} ${sacko.loser} ▼ `;
          } else {
            sackosHtml += `${sacko.year} ${sacko.loser} ▼ `;
          }
        }
      });
      sackosElement.innerHTML = sackosHtml;
    }
    
    console.log('✅ Banners populated from league history data');
  } catch (error) {
    console.error('❌ Error populating banners:', error);
  }
}

async function init() {
  console.log('🎮 INITIALIZING LA LIGA DEL FUEGO - 90S STYLE DASHBOARD...');
  console.log('📺 LOADING CLASSIC MADDEN VIBES WITH PIXEL ART TROPHIES...');
  
  try {
    // Small delay to ensure league-history.js is fully loaded
    setTimeout(() => {
      populateBanners();
    }, 100);
    
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
        } else {
          console.error('❌ No live team data available from ESPN API');
          console.log('⚠️ Loading fallback demo data with all 12 teams...');
          appData.teams = getDemoTeamData();
        }
      } catch (error) {
        console.error('❌ Failed to load live team data:', error);
        console.log('⚠️ Loading fallback demo data with all 12 teams...');
        appData.teams = getDemoTeamData();
      }
      
      // Load live matchup data
      try {
        const liveMatchups = await loadMatchupData(appData.league.currentWeek, appData.league.season);
        if (liveMatchups && liveMatchups.length > 0) {
          appData.matchups = liveMatchups;
          console.log('✅ LIVE MATCHUP DATA LOADED FROM ESPN API!');
        } else {
          console.log('⚠️ No live matchup data available, loading demo data...');
          appData.matchups = getDemoMatchupData();
        }
      } catch (error) {
        console.warn('⚠️ Failed to load live matchup data, using demo data:', error);
        appData.matchups = getDemoMatchupData();
      }
    } else {
      console.error('❌ API CONNECTION FAILED - Loading demo data');
      console.log('⚠️ Loading fallback demo data with all 12 teams...');
      appData.teams = getDemoTeamData();
      appData.matchups = getDemoMatchupData();
    }
    
    // Banners already populated by populateBanners() from league-history.js
    
    // Ensure dashboard section is visible on load
    showSection('dashboard-section');
    
    // Render initial content with potentially live data
    renderLeaderboard();
    renderCommentary();
    
    // Setup all interactive components
    setupNavigation();
    setupSeasonSelectors();
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