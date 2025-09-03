// Transform ESPN matchup data to our Matchup model format
const { fetchESPNTeams } = require('../espn/fetchTeams');
const { getTeams } = require('../database/schemas');

async function transformESPNMatchups(espnMatchups, week, season) {
  if (!espnMatchups || !Array.isArray(espnMatchups)) {
    console.warn(`⚠️ Invalid ESPN matchups data for Week ${week}, Season ${season}:`, {
      type: typeof espnMatchups,
      isArray: Array.isArray(espnMatchups),
      length: espnMatchups?.length
    });
    return [];
  }

  console.log(`🔄 Transforming ${espnMatchups.length} ESPN matchups for Week ${week}, Season ${season}`);

  // We need team data to map teamId to team names
  let teamsData = {};
  
  // Try ESPN API first, then fallback to MongoDB cached data
  try {
    const teams = await fetchESPNTeams(process.env.ESPN_LEAGUE_ID, season);
    if (teams && teams.length > 0) {
      teamsData = teams.reduce((acc, team) => {
        acc[team.espnId || team.id] = team;
        return acc;
      }, {});
      console.log(`✅ Loaded ${Object.keys(teamsData).length} team names from ESPN API`);
    } else {
      throw new Error('ESPN API returned empty teams data');
    }
  } catch (error) {
    console.warn('ESPN API failed for teams, trying MongoDB fallback:', error.message);
    
    // Always try MongoDB fallback when ESPN fails or returns insufficient data
    try {
      const cachedTeams = await getTeams(season);
      if (cachedTeams && cachedTeams.length > 0) {
        teamsData = cachedTeams.reduce((acc, team) => {
          acc[team.espnId] = { name: team.name, espnId: team.espnId };
          return acc;
        }, {});
        console.log(`✅ Loaded ${Object.keys(teamsData).length} team names from MongoDB cache`);
      } else {
        console.warn('MongoDB also returned no team data');
      }
    } catch (mongoError) {
      console.warn('MongoDB team data also failed:', mongoError.message);
    }
  }
  
  // If we still don't have enough team data, force MongoDB fallback
  if (Object.keys(teamsData).length < 12) {
    console.warn(`Only ${Object.keys(teamsData).length} teams loaded, forcing MongoDB fallback`);
    try {
      const cachedTeams = await getTeams(season);
      if (cachedTeams && cachedTeams.length > 0) {
        teamsData = cachedTeams.reduce((acc, team) => {
          acc[team.espnId] = { name: team.name, espnId: team.espnId };
          return acc;
        }, {});
        console.log(`✅ Force-loaded ${Object.keys(teamsData).length} team names from MongoDB cache`);
      }
    } catch (mongoError) {
      console.warn('Force MongoDB team data also failed:', mongoError.message);
    }
  }

  const transformedMatchups = espnMatchups
    .filter(espnMatchup => {
      // CRITICAL FIX: Only include matchups for the specific week
      return espnMatchup.matchupPeriodId === week && 
             espnMatchup.away && 
             espnMatchup.home &&
             espnMatchup.away.teamId &&
             espnMatchup.home.teamId;
    })
    .map((espnMatchup, index) => {
      try {
        // ESPN uses away/home structure, we use team1/team2
        const awayTeamId = espnMatchup.away?.teamId;
        const homeTeamId = espnMatchup.home?.teamId;
        
        // Get team names from teams data, fallback to generic names
        const awayTeam = teamsData[awayTeamId] || { name: `Team ${awayTeamId}`, espnId: awayTeamId };
        const homeTeam = teamsData[homeTeamId] || { name: `Team ${homeTeamId}`, espnId: homeTeamId };
      
      // Extract scores - ESPN stores in totalPoints or pointsByScoringPeriod
      const awayScore = espnMatchup.away?.totalPoints || 
                        espnMatchup.away?.pointsByScoringPeriod?.[week] || 0;
      const homeScore = espnMatchup.home?.totalPoints || 
                        espnMatchup.home?.pointsByScoringPeriod?.[week] || 0;
      
      // Determine status based on ESPN data
      let status = 'scheduled';
      if (espnMatchup.winner) {
        status = 'final';
      } else if (awayScore > 0 || homeScore > 0) {
        status = 'live';
      }

      const transformed = {
        week: week,
        season: season,
        team1: {
          id: awayTeamId,
          name: awayTeam.name,
          score: awayScore,
          projected: espnMatchup.away?.projectedScore || 0
        },
        team2: {
          id: homeTeamId,
          name: homeTeam.name,
          score: homeScore,
          projected: espnMatchup.home?.projectedScore || 0
        },
        status: status,
        isPlayoff: espnMatchup.matchupPeriodId > 14, // Weeks 15+ are playoffs
        espnMatchupId: espnMatchup.id
      };
      
      console.log(`🔄 Transformed matchup ${index + 1}: ${awayTeam.name} vs ${homeTeam.name} (${awayScore}-${homeScore}, ${status})`);
      return transformed;
    } catch (error) {
      console.error(`❌ Error transforming matchup ${index + 1}:`, error.message, espnMatchup);
      return null;
    }
  }).filter(Boolean); // Remove null entries

  console.log(`🔄 Transformed ${transformedMatchups.length} ESPN matchups for Week ${week}, Season ${season}`);
  return transformedMatchups;
}

module.exports = { transformESPNMatchups };