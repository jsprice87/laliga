// Clean data ingestion with direct ESPN API calls and proper filtering
const axios = require('axios');
const { saveTeams, saveMatchups, saveLeague } = require('../database/schemas');

// Direct ESPN API call with proper authentication
async function fetchESPNDirect(season, week = null) {
  const leagueId = process.env.ESPN_LEAGUE_ID;
  const espnS2 = process.env.ESPN_S2;
  const swid = process.env.ESPN_SWID;
  
  let url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`;
  let params = { view: 'mMatchup' };
  
  if (week) {
    params.scoringPeriodId = week;
  }
  
  try {
    const response = await axios.get(url, {
      params,
      headers: {
        'Cookie': `espn_s2=${espnS2}; SWID=${swid}`
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`⚠️ Season ${season} not found or access restricted`);
      return null;
    }
    throw error;
  }
}

// Get current team names for mapping historical team IDs
async function getCurrentTeamNames() {
  try {
    const currentData = await fetchESPNDirect(2024);
    if (!currentData?.teams) {
      throw new Error('Could not fetch current team data');
    }
    
    const teamMap = {};
    currentData.teams.forEach(team => {
      teamMap[team.id] = {
        name: team.name,
        abbrev: team.abbrev,
        logo: team.logo
      };
    });
    
    console.log(`✅ Loaded ${Object.keys(teamMap).length} current team names for mapping`);
    return teamMap;
  } catch (error) {
    console.error('❌ Failed to get current team names:', error.message);
    return {};
  }
}

// Transform and filter ESPN matchups correctly
function transformCleanMatchups(espnData, week, season, teamMap) {
  if (!espnData?.schedule) {
    console.warn(`⚠️ No schedule data for Season ${season}, Week ${week}`);
    return [];
  }
  
  // CRITICAL: Filter for ONLY the specific week's head-to-head matchups
  const weekMatchups = espnData.schedule.filter(matchup => 
    matchup.matchupPeriodId === week &&
    matchup.away && 
    matchup.home &&
    matchup.away.teamId &&
    matchup.home.teamId
  );
  
  console.log(`🔍 Filtered ${weekMatchups.length} valid matchups for Season ${season}, Week ${week} (from ${espnData.schedule.length} total schedule entries)`);
  
  const transformed = weekMatchups.map(espnMatchup => {
    const awayTeamId = espnMatchup.away.teamId;
    const homeTeamId = espnMatchup.home.teamId;
    
    // Use current team names
    const awayTeam = teamMap[awayTeamId] || { name: `Team ${awayTeamId}` };
    const homeTeam = teamMap[homeTeamId] || { name: `Team ${homeTeamId}` };
    
    const awayScore = espnMatchup.away.totalPoints || 0;
    const homeScore = espnMatchup.home.totalPoints || 0;
    
    let status = 'scheduled';
    if (espnMatchup.winner) {
      status = 'final';
    } else if (awayScore > 0 || homeScore > 0) {
      status = 'live';
    }
    
    return {
      week: week,
      season: season,
      team1: {
        id: awayTeamId,
        name: awayTeam.name,
        score: awayScore,
        projected: espnMatchup.away.projectedScore || 0
      },
      team2: {
        id: homeTeamId,
        name: homeTeam.name,
        score: homeScore,
        projected: espnMatchup.home.projectedScore || 0
      },
      status: status,
      isPlayoff: week > 14,
      espnMatchupId: espnMatchup.id
    };
  });
  
  return transformed;
}

// Clean ingestion for a single season
async function ingestCleanSeason(season) {
  console.log(`🧹 Starting clean ingestion for season ${season}`);
  
  try {
    // Get current team names for mapping
    const teamMap = await getCurrentTeamNames();
    
    // Get league data for this season
    const seasonData = await fetchESPNDirect(season);
    if (!seasonData) {
      console.warn(`⚠️ No data available for season ${season}`);
      return { teams: 0, matchups: 0, league: 0 };
    }
    
    // Save league data
    if (seasonData.settings) {
      const leagueData = {
        season: season,
        name: seasonData.settings.name || 'La Liga del Fuego',
        espnLeagueId: process.env.ESPN_LEAGUE_ID,
        currentWeek: seasonData.scoringPeriodId || 14,
        totalWeeks: 17,
        settings: {
          playoffStart: 15,
          regularSeasonWeeks: 14
        }
      };
      await saveLeague(leagueData, season);
      console.log(`✅ Saved league data for ${leagueData.name} (${season})`);
    }
    
    // Save teams with current data (for Liga Bucks calculation)
    if (seasonData.teams && season === 2024) {
      // Only save teams for current season with Liga Bucks
      const teamsWithBucks = seasonData.teams.map(team => ({
        ...team,
        season: season,
        espnId: team.id
      }));
      await saveTeams(teamsWithBucks, season);
      console.log(`✅ Saved ${teamsWithBucks.length} teams for ${season}`);
    }
    
    // Ingest matchups week by week with proper filtering
    let totalMatchups = 0;
    for (let week = 1; week <= 17; week++) {
      try {
        const weekData = await fetchESPNDirect(season, week);
        if (weekData) {
          const cleanMatchups = transformCleanMatchups(weekData, week, season, teamMap);
          
          if (cleanMatchups.length > 0) {
            await saveMatchups(cleanMatchups, week, season);
            totalMatchups += cleanMatchups.length;
            console.log(`✅ Saved ${cleanMatchups.length} matchups for ${season} Week ${week}`);
          }
        }
      } catch (weekError) {
        console.warn(`⚠️ Failed to ingest ${season} Week ${week}:`, weekError.message);
      }
    }
    
    console.log(`🎉 Clean ingestion complete for ${season}: ${totalMatchups} matchups`);
    return { 
      teams: seasonData.teams?.length || 0, 
      matchups: totalMatchups, 
      league: 1 
    };
    
  } catch (error) {
    console.error(`❌ Clean ingestion failed for season ${season}:`, error.message);
    throw error;
  }
}

module.exports = {
  fetchESPNDirect,
  getCurrentTeamNames,
  transformCleanMatchups,
  ingestCleanSeason
};