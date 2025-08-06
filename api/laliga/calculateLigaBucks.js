const { fetchCompleteSeasonData } = require('../espn/fetchTeams');
const { fetchESPNStandings } = require('../espn/fetchMatchups');

/**
 * Calculate Liga Bucks for all teams based on ESPN data
 * Uses 2-component system: ESPN Component + Total Points Component (max 24 total)
 */
async function calculateLigaBucksForSeason(leagueId, season) {
  try {
    // Fetch complete season data
    const seasonData = await fetchCompleteSeasonData(leagueId, season);
    const standings = await fetchESPNStandings(leagueId, season);
    
    if (!seasonData.teams || seasonData.teams.length === 0) {
      throw new Error(`No team data available for season ${season}`);
    }
    
    // Calculate ESPN rankings based on wins/losses first, then total points
    const espnRankings = calculateESPNRankings(standings);
    
    // Calculate total points rankings
    const totalPointsRankings = calculateTotalPointsRankings(seasonData.teams);
    
    // Calculate Liga Bucks components for each team
    const ligaBucksResults = seasonData.teams.map(team => {
      const espnRank = espnRankings.find(rank => rank.teamId === team.id);
      const pointsRank = totalPointsRankings.find(rank => rank.teamId === team.id);
      
      // ESPN Component (1-12 points, 1st place = 12 points, 12th place = 1 point)
      const espnComponent = espnRank ? (13 - espnRank.rank) : 0;
      
      // Total Points Component (1-12 points, highest points = 12 points, lowest = 1 point)
      const totalPointsComponent = pointsRank ? (13 - pointsRank.rank) : 0;
      
      // Total Liga Bucks (max 24)
      const totalLigaBucks = espnComponent + totalPointsComponent;
      
      return {
        teamId: team.id,
        teamName: team.location + ' ' + team.nickname,
        owner: `${team.primaryOwner || 'Unknown'}`,
        record: `${team.record?.overall?.wins || 0}-${team.record?.overall?.losses || 0}-${team.record?.overall?.ties || 0}`,
        totalPoints: team.record?.overall?.pointsFor || 0,
        espnRank: espnRank?.rank || 0,
        espnComponent: espnComponent,
        totalPointsComponent: totalPointsComponent,
        laLigaBucks: totalLigaBucks,
        playoffSeed: espnRank?.rank || 0
      };
    });
    
    // Sort by Liga Bucks descending
    ligaBucksResults.sort((a, b) => b.laLigaBucks - a.laLigaBucks);
    
    return {
      season: season,
      lastUpdated: new Date().toISOString(),
      teams: ligaBucksResults
    };
    
  } catch (error) {
    console.error(`Error calculating Liga Bucks for season ${season}:`, error.message);
    throw error;
  }
}

/**
 * Calculate ESPN rankings based on wins first, then total points as tiebreaker
 */
function calculateESPNRankings(teams) {
  const teamStats = teams.map(team => ({
    teamId: team.id,
    wins: team.record?.overall?.wins || 0,
    losses: team.record?.overall?.losses || 0,
    ties: team.record?.overall?.ties || 0,
    totalPoints: team.record?.overall?.pointsFor || 0
  }));
  
  // Sort by wins (descending), then by total points (descending) for tiebreaker
  teamStats.sort((a, b) => {
    if (a.wins !== b.wins) {
      return b.wins - a.wins; // More wins = better rank
    }
    return b.totalPoints - a.totalPoints; // More points = better rank (tiebreaker)
  });
  
  // Assign ranks
  return teamStats.map((team, index) => ({
    teamId: team.teamId,
    rank: index + 1
  }));
}

/**
 * Calculate total points rankings
 */
function calculateTotalPointsRankings(teams) {
  const teamStats = teams.map(team => ({
    teamId: team.id,
    totalPoints: team.record?.overall?.pointsFor || 0
  }));
  
  // Sort by total points descending
  teamStats.sort((a, b) => b.totalPoints - a.totalPoints);
  
  // Assign ranks
  return teamStats.map((team, index) => ({
    teamId: team.teamId,
    rank: index + 1
  }));
}

/**
 * Get matchup data for a specific week
 */
async function getWeeklyMatchups(leagueId, season, week) {
  try {
    const seasonData = await fetchCompleteSeasonData(leagueId, season);
    
    // Filter matchups for specific week
    const weeklyMatchups = seasonData.schedule.filter(matchup => 
      matchup.matchupPeriodId === week
    );
    
    return weeklyMatchups.map(matchup => ({
      week: matchup.matchupPeriodId,
      team1: {
        id: matchup.away?.teamId,
        name: getTeamName(matchup.away?.teamId, seasonData.teams),
        score: matchup.away?.totalPoints || 0
      },
      team2: {
        id: matchup.home?.teamId,
        name: getTeamName(matchup.home?.teamId, seasonData.teams),
        score: matchup.home?.totalPoints || 0
      },
      status: matchup.winner === 'UNDECIDED' ? 'scheduled' : 'completed'
    }));
  } catch (error) {
    console.error(`Error fetching matchups for week ${week}:`, error.message);
    throw error;
  }
}

function getTeamName(teamId, teams) {
  const team = teams.find(t => t.id === teamId);
  return team ? `${team.location} ${team.nickname}` : 'Unknown Team';
}

module.exports = {
  calculateLigaBucksForSeason,
  getWeeklyMatchups,
  calculateESPNRankings,
  calculateTotalPointsRankings
};