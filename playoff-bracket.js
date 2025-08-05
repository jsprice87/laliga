// Playoff Bracket System for La Liga del Fuego
'use strict';

/********************
 * Global Variables  *
 ********************/
let bracketData = {
  teams: [],
  championshipBracket: {},
  sackoBracket: {},
  currentWeek: 14,
  bracketLocked: false,
  currentView: 'championship' // 'championship' or 'sacko'
};

// API client instance
let apiClient;

/********************
 * Initialization    *
 ********************/
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🏆 Initializing Playoff Bracket System...');
  
  // Initialize API client
  apiClient = new APIClient();
  
  // Load initial data
  await initializeBracket();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup game sounds (if available)
  setupGameSounds();
  
  console.log('✅ Playoff Bracket System ready!');
});

/********************
 * Core Functions    *
 ********************/

// Initialize bracket system
async function initializeBracket() {
  try {
    // Load team data with current standings
    const teamData = await loadTeamData();
    if (teamData && teamData.length > 0) {
      bracketData.teams = teamData;
      
      // Determine bracket seeding based on La Liga Bucks
      generateBracketSeeding();
      
      // Load any existing bracket results
      await loadBracketResults();
      
      // Render both brackets
      renderChampionshipBracket();
      renderSackoBracket();
      
      // Update bracket status
      updateBracketStatus();
      
      console.log('✅ Bracket initialized with', teamData.length, 'teams');
    } else {
      console.warn('⚠️ No team data available for bracket');
      showBracketError('Unable to load team data');
    }
  } catch (error) {
    console.error('❌ Error initializing bracket:', error);
    showBracketError('Failed to initialize bracket system');
  }
}

// Load team data from API
async function loadTeamData() {
  try {
    const response = await apiClient.fetch(`/teams?live=true&week=${bracketData.currentWeek}&season=2025`);
    if (response && Array.isArray(response)) {
      return response.sort((a, b) => (b.laLigaBucks || 0) - (a.laLigaBucks || 0));
    }
    return [];
  } catch (error) {
    console.error('Error loading team data:', error);
    return [];
  }
}

// Generate bracket seeding based on La Liga Bucks standings
function generateBracketSeeding() {
  if (bracketData.teams.length < 12) {
    console.warn('⚠️ Not enough teams for full bracket');
    return;
  }
  
  // Sort teams by La Liga Bucks (descending)
  const sortedTeams = [...bracketData.teams].sort((a, b) => 
    (b.laLigaBucks || 0) - (a.laLigaBucks || 0)
  );
  
  // Championship bracket (top 6 teams)
  bracketData.championshipBracket = {
    // Top 2 get byes to semifinals
    seed1: sortedTeams[0],
    seed2: sortedTeams[1],
    
    // Wild card matchups (seeds 3-6)
    seed3: sortedTeams[2],
    seed4: sortedTeams[3], 
    seed5: sortedTeams[4],
    seed6: sortedTeams[5],
    
    // Bracket progression
    wildcard: {
      game1: { team1: sortedTeams[2], team2: sortedTeams[5], winner: null },
      game2: { team1: sortedTeams[3], team2: sortedTeams[4], winner: null }
    },
    semifinals: {
      game1: { team1: sortedTeams[0], team2: null, winner: null }, // vs WC winner
      game2: { team1: sortedTeams[1], team2: null, winner: null }  // vs WC winner
    },
    championship: {
      team1: null,
      team2: null,
      winner: null
    }
  };
  
  // Sacko bracket (bottom 6 teams)
  bracketData.sackoBracket = {
    // Bottom 2 get "byes" to semifinals (avoid elimination)
    seed11: sortedTeams[10],
    seed12: sortedTeams[11],
    
    // Wild card matchups (seeds 7-10)
    seed7: sortedTeams[6],
    seed8: sortedTeams[7],
    seed9: sortedTeams[8], 
    seed10: sortedTeams[9],
    
    // Bracket progression (winners advance toward Sacko)
    wildcard: {
      game1: { team1: sortedTeams[8], team2: sortedTeams[9], loser: null }, // Winner moves on
      game2: { team1: sortedTeams[6], team2: sortedTeams[7], loser: null }  // Winner moves on
    },
    semifinals: {
      game1: { team1: sortedTeams[10], team2: null, loser: null }, // vs WC winner
      game2: { team1: sortedTeams[11], team2: null, loser: null }  // vs WC winner
    },
    sackoBowl: {
      team1: null,
      team2: null,
      loser: null // The ultimate Sacko
    }
  };
  
  console.log('✅ Bracket seeding generated', {
    championship: Object.keys(bracketData.championshipBracket),
    sacko: Object.keys(bracketData.sackoBracket)
  });
}

// Load existing bracket results from API
async function loadBracketResults() {
  try {
    const response = await apiClient.fetch('/playoff/results?season=2025');
    if (response && response.success) {
      // Update bracket with any completed games
      updateBracketWithResults(response.data);
    }
  } catch (error) {
    console.log('No existing bracket results found (this is normal for new brackets)');
  }
}

// Update bracket with completed game results
function updateBracketWithResults(results) {
  if (!results) return;
  
  // Update championship bracket results
  if (results.championship) {
    updateBracketRound(bracketData.championshipBracket, results.championship);
  }
  
  // Update Sacko bracket results
  if (results.sacko) {
    updateBracketRound(bracketData.sackoBracket, results.sacko);
  }
  
  console.log('✅ Bracket updated with existing results');
}

// Update specific bracket round with results
function updateBracketRound(bracket, results) {
  ['wildcard', 'semifinals', 'championship', 'sackoBowl'].forEach(round => {
    if (results[round]) {
      Object.assign(bracket[round] || {}, results[round]);
    }
  });
}

/********************
 * Rendering Functions *
 ********************/

// Render championship bracket
function renderChampionshipBracket() {
  const bracket = bracketData.championshipBracket;
  if (!bracket || !bracket.seed1) {
    console.warn('⚠️ Championship bracket data not available');
    return;
  }
  
  // Wild Card Games
  renderMatchup('championship-wc-1', {
    team1: bracket.seed3,
    team2: bracket.seed6,
    result: bracket.wildcard?.game1
  });
  
  renderMatchup('championship-wc-2', {
    team1: bracket.seed4,
    team2: bracket.seed5,
    result: bracket.wildcard?.game2
  });
  
  // Semifinals
  renderMatchup('championship-sf-1', {
    team1: bracket.seed1,
    team2: bracket.wildcard?.game1?.winner,
    result: bracket.semifinals?.game1,
    byeTeam: bracket.seed1
  });
  
  renderMatchup('championship-sf-2', {
    team1: bracket.seed2,
    team2: bracket.wildcard?.game2?.winner,
    result: bracket.semifinals?.game2,
    byeTeam: bracket.seed2
  });
  
  // Championship
  renderMatchup('championship-final', {
    team1: bracket.semifinals?.game1?.winner,
    team2: bracket.semifinals?.game2?.winner,
    result: bracket.championship
  });
  
  // Champion
  renderWinner('championship-winner', bracket.championship?.winner);
  
  console.log('✅ Championship bracket rendered');
}

// Render Sacko bracket
function renderSackoBracket() {
  const bracket = bracketData.sackoBracket;
  if (!bracket || !bracket.seed11) {
    console.warn('⚠️ Sacko bracket data not available');
    return;
  }
  
  // Wild Card Games (losers are eliminated from Sacko race)
  renderMatchup('sacko-wc-1', {
    team1: bracket.seed9,
    team2: bracket.seed10,
    result: bracket.wildcard?.game1,
    sackoMode: true
  });
  
  renderMatchup('sacko-wc-2', {
    team1: bracket.seed7,
    team2: bracket.seed8,
    result: bracket.wildcard?.game2,
    sackoMode: true
  });
  
  // Semifinals (winners advance toward Sacko)
  renderMatchup('sacko-sf-1', {
    team1: bracket.seed11,
    team2: bracket.wildcard?.game1?.winner,
    result: bracket.semifinals?.game1,
    byeTeam: bracket.seed11,
    sackoMode: true
  });
  
  renderMatchup('sacko-sf-2', {
    team1: bracket.seed12,
    team2: bracket.wildcard?.game2?.winner,
    result: bracket.semifinals?.game2,
    byeTeam: bracket.seed12,
    sackoMode: true
  });
  
  // Sacko Bowl
  renderMatchup('sacko-final', {
    team1: bracket.semifinals?.game1?.winner,
    team2: bracket.semifinals?.game2?.winner,
    result: bracket.sackoBowl,
    sackoMode: true
  });
  
  // Sacko Winner (loser of Sacko Bowl)
  renderWinner('sacko-winner', bracket.sackoBowl?.loser, true);
  
  console.log('✅ Sacko bracket rendered');
}

// Render individual matchup
function renderMatchup(matchupId, data) {
  const matchupElement = document.getElementById(matchupId);
  if (!matchupElement) {
    console.warn(`⚠️ Matchup element ${matchupId} not found`);
    return;
  }
  
  const team1Slot = matchupElement.querySelector('.team-slot:first-of-type');
  const team2Slot = matchupElement.querySelector('.team-slot:last-of-type');
  
  if (!team1Slot || !team2Slot) {
    console.warn(`⚠️ Team slots not found in ${matchupId}`);
    return;
  }
  
  // Render team 1
  renderTeamSlot(team1Slot, data.team1, data.result, data.byeTeam, data.sackoMode);
  
  // Render team 2  
  renderTeamSlot(team2Slot, data.team2, data.result, data.byeTeam, data.sackoMode);
}

// Render individual team slot
function renderTeamSlot(slot, team, result, byeTeam, sackoMode = false) {
  const nameElement = slot.querySelector('.team-name');
  const scoreElement = slot.querySelector('.team-score');
  
  if (!nameElement || !scoreElement) {
    console.warn('⚠️ Team slot elements not found');
    return;
  }
  
  // Clear previous classes
  slot.classList.remove('winner', 'loser', 'bye-team');
  
  if (!team) {
    nameElement.textContent = 'TBD';
    scoreElement.textContent = '-';
    return;
  }
  
  // Set team name
  nameElement.textContent = team.name || team.teamName || 'Unknown Team';
  
  // Handle bye week
  if (byeTeam && team.id === byeTeam.id) {
    slot.classList.add('bye-team');
    scoreElement.textContent = 'BYE';
    return;
  }
  
  // Set score if game is completed
  if (result) {
    const isWinner = sackoMode ? 
      (result.loser && team.id !== result.loser.id) :
      (result.winner && team.id === result.winner.id);
    
    if (result.team1Score !== undefined && result.team2Score !== undefined) {
      const score = (team.id === result.team1?.id) ? result.team1Score : result.team2Score;
      scoreElement.textContent = score;
      
      if (isWinner) {
        slot.classList.add('winner');
      } else {
        slot.classList.add('loser');
      }
    } else {
      scoreElement.textContent = '-';
    }
  } else {
    scoreElement.textContent = '-';
  }
}

// Render winner/loser slot
function renderWinner(slotId, winner, isSacko = false) {
  const slot = document.getElementById(slotId);
  if (!slot) {
    console.warn(`⚠️ Winner slot ${slotId} not found`);
    return;
  }
  
  const nameElement = slot.querySelector(isSacko ? '.sacko-name' : '.champion-name');
  const scoreElement = slot.querySelector(isSacko ? '.sacko-score' : '.champion-score');
  
  if (!nameElement || !scoreElement) {
    console.warn(`⚠️ Winner slot elements not found in ${slotId}`);
    return;
  }
  
  if (winner) {
    nameElement.textContent = winner.name || winner.teamName || 'Unknown Team';
    scoreElement.textContent = winner.finalScore || '-';
  } else {
    nameElement.textContent = 'TBD';
    scoreElement.textContent = '-';
  }
}

/********************
 * Event Handlers    *
 ********************/

// Setup event listeners
function setupEventListeners() {
  // Bracket type toggle buttons
  const championshipBtn = document.getElementById('championship-bracket-btn');
  const sackoBtn = document.getElementById('sacko-bracket-btn');
  
  if (championshipBtn) {
    championshipBtn.addEventListener('click', () => showChampionshipBracket());
  }
  
  if (sackoBtn) {
    sackoBtn.addEventListener('click', () => showSackoBracket());
  }
  
  // Back to dashboard button
  const backBtn = document.getElementById('back-to-dashboard');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
  
  // Refresh bracket data periodically
  setInterval(async () => {
    await refreshBracketData();
  }, 30000); // Refresh every 30 seconds
}

// Show championship bracket
function showChampionshipBracket() {
  bracketData.currentView = 'championship';
  
  document.getElementById('championship-bracket').style.display = 'block';
  document.getElementById('sacko-bracket').style.display = 'none';
  
  document.getElementById('championship-bracket-btn').classList.add('btn-secondary');
  document.getElementById('championship-bracket-btn').classList.remove('btn-outline');
  document.getElementById('sacko-bracket-btn').classList.add('btn-outline');
  document.getElementById('sacko-bracket-btn').classList.remove('btn-secondary');
  
  document.getElementById('bracket-type').textContent = 'CHAMPIONSHIP';
  
  playGameSound('select');
  console.log('🏆 Switched to championship bracket view');
}

// Show Sacko bracket
function showSackoBracket() {
  bracketData.currentView = 'sacko';
  
  document.getElementById('championship-bracket').style.display = 'none';
  document.getElementById('sacko-bracket').style.display = 'block';
  
  document.getElementById('sacko-bracket-btn').classList.add('btn-secondary');
  document.getElementById('sacko-bracket-btn').classList.remove('btn-outline');
  document.getElementById('championship-bracket-btn').classList.add('btn-outline');
  document.getElementById('championship-bracket-btn').classList.remove('btn-secondary');
  
  document.getElementById('bracket-type').textContent = 'SACKO';
  
  playGameSound('select');
  console.log('💀 Switched to Sacko bracket view');
}

/********************
 * Utility Functions *
 ********************/

// Update bracket status display
function updateBracketStatus() {
  const currentWeek = bracketData.currentWeek;
  let status = 'PREPARING';
  
  if (currentWeek >= 17) {
    status = 'COMPLETE';
  } else if (currentWeek >= 15) {
    status = 'IN PROGRESS';
  } else if (currentWeek >= 14) {
    status = 'SEEDING LOCKED';
  }
  
  const championshipStatus = document.getElementById('championship-status');
  const sackoStatus = document.getElementById('sacko-status');
  
  if (championshipStatus) championshipStatus.textContent = status;
  if (sackoStatus) sackoStatus.textContent = status;
  
  const currentWeekElement = document.getElementById('current-week');
  if (currentWeekElement) currentWeekElement.textContent = currentWeek;
}

// Refresh bracket data
async function refreshBracketData() {
  try {
    const teamData = await loadTeamData();
    if (teamData && teamData.length > 0) {
      bracketData.teams = teamData;
      
      // Only regenerate seeding if bracket isn't locked
      if (!bracketData.bracketLocked) {
        generateBracketSeeding();
      }
      
      // Always reload results in case games completed
      await loadBracketResults();
      
      // Re-render current view
      if (bracketData.currentView === 'championship') {
        renderChampionshipBracket();
      } else {
        renderSackoBracket();
      }
      
      updateBracketStatus();
    }
  } catch (error) {
    console.error('Error refreshing bracket data:', error);
  }
}

// Show bracket error
function showBracketError(message) {
  console.error('Bracket Error:', message);
  
  // Create error display (could enhance with modal)
  const errorDiv = document.createElement('div');
  errorDiv.className = 'bracket-error';
  errorDiv.innerHTML = `
    <div class="error-message">
      <h3>⚠️ BRACKET ERROR</h3>
      <p>${message}</p>
      <button onclick="location.reload()" class="btn btn-primary game-button">RETRY</button>
    </div>
  `;
  
  document.querySelector('.main-content').appendChild(errorDiv);
}

// Setup game sounds (if sound system is available)
function setupGameSounds() {
  // Check if playGameSound function exists (from main app)
  if (typeof playGameSound !== 'function') {
    window.playGameSound = function(sound) {
      // Fallback - could implement basic sound system here
      console.log(`🔊 Playing sound: ${sound}`);
    };
  }
}

/********************
 * Admin Functions   *
 ********************/

// Manually update bracket results (admin function)
async function updateBracketResult(gameId, team1Score, team2Score) {
  try {
    const response = await apiClient.fetch('/playoff/update-result', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        team1Score,
        team2Score,
        season: 2025
      })
    });
    
    if (response && response.success) {
      await refreshBracketData();
      playGameSound('success');
      console.log('✅ Bracket result updated');
    }
  } catch (error) {
    console.error('Error updating bracket result:', error);
    playGameSound('error');
  }
}

// Lock bracket seeding (admin function)
async function lockBracketSeeding() {
  try {
    const response = await apiClient.fetch('/playoff/lock-seeding', {
      method: 'POST',
      body: JSON.stringify({ season: 2025 })
    });
    
    if (response && response.success) {
      bracketData.bracketLocked = true;
      updateBracketStatus();
      playGameSound('success');
      console.log('🔒 Bracket seeding locked');
    }
  } catch (error) {
    console.error('Error locking bracket seeding:', error);
    playGameSound('error');
  }
}

// Export functions for global access
window.bracketSystem = {
  showChampionshipBracket,
  showSackoBracket,
  refreshBracketData,
  updateBracketResult,
  lockBracketSeeding
};

console.log('📋 Playoff Bracket System loaded successfully');