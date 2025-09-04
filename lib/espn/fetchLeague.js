const axios = require('axios');

async function fetchESPNLeague(leagueId, season) {
  // Use different endpoints based on season year
  let url;
  let params;
  
  if (season <= 2017) {
    // Historical data endpoint for 2017 and earlier
    url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/${leagueId}`;
    params = {
      seasonId: season,
      view: 'mSettings'
    };
  } else {
    // Standard endpoint for 2018 and later
    url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`;
    params = {
      view: 'mSettings'
    };
  }
  
  try {
    const response = await axios.get(url, {
      params,
      headers: {
        'Cookie': `espn_s2=${process.env.ESPN_S2}; SWID=${process.env.ESPN_SWID}`
      }
    });
    
    // Handle different response structures for historical vs current data
    let leagueData;
    if (season <= 2017) {
      // Historical data returns an array, get the first season
      leagueData = response.data[0];
    } else {
      leagueData = response.data;
    }
    
    if (!leagueData) {
      throw new Error(`No league data found for season ${season}`);
    }
    
    // Extract league information from ESPN response
    const extractedData = {
      season: season,
      name: leagueData.settings?.name || 'Fantasy League',
      espnLeagueId: leagueId,
      currentWeek: leagueData.scoringPeriodId || 1,
      totalWeeks: 17, // Standard NFL season
      settings: {
        playoffStart: leagueData.settings?.scheduleSettings?.playoffSeeds || 6,
        regularSeasonWeeks: leagueData.settings?.scheduleSettings?.regularSeasonMatchupPeriods || 14,
        scoringType: leagueData.settings?.scoringSettings?.scoringType || 'standard',
        rosterSettings: {
          lineupSlotCounts: leagueData.settings?.rosterSettings?.lineupSlotCounts || {},
          positionLimits: leagueData.settings?.rosterSettings?.positionLimits || {}
        }
      },
      // Initialize with empty arrays - these would be populated from historical data
      champions: [],
      sackos: []
    };
    
    console.log(`✅ Fetched league data for ${extractedData.name} (${season})`);
    return extractedData;
    
  } catch (error) {
    console.error(`ESPN League API Error (Season ${season}):`, error.message);
    
    if (error.response?.status === 404) {
      throw new Error(`No league data available for season ${season}. This season may not exist or access may be restricted.`);
    }
    
    throw error;
  }
}

// Get current scoring period (week) from ESPN
async function fetchCurrentWeek(leagueId, season) {
  try {
    const leagueData = await fetchESPNLeague(leagueId, season);
    return leagueData.currentWeek;
  } catch (error) {
    console.warn('Could not fetch current week from ESPN:', error.message);
    return 14; // Default fallback
  }
}

module.exports = { fetchESPNLeague, fetchCurrentWeek };