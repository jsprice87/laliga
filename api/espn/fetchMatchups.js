const axios = require('axios');

async function fetchESPNMatchups(leagueId, season, week) {
  // Use different endpoints based on season year
  let url;
  let params;
  
  if (season <= 2017) {
    // Historical data endpoint for 2017 and earlier
    url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/${leagueId}`;
    params = {
      seasonId: season,
      view: 'mMatchup'
    };
  } else {
    // Standard endpoint for 2018 and later
    url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`;
    params = {
      view: 'mMatchup'
    };
    
    // Add specific week filter if provided
    if (week) {
      params.scoringPeriodId = week;
    }
  }
  
  try {
    const response = await axios.get(url, {
      params,
      headers: {
        'Cookie': `espn_s2=${process.env.ESPN_S2}; SWID=${process.env.ESPN_SWID}`
      }
    });
    
    // Handle different response structures for historical vs current data
    if (season <= 2017) {
      // Historical data returns an array, get the first season
      return response.data[0]?.schedule || [];
    } else {
      return response.data.schedule || [];
    }
  } catch (error) {
    console.error(`ESPN Matchups API Error (Season ${season}):`, error.message);
    
    if (error.response?.status === 404) {
      throw new Error(`No matchup data available for season ${season}. This season may not exist or access may be restricted.`);
    }
    
    throw error;
  }
}

async function fetchESPNStandings(leagueId, season) {
  // Use different endpoints based on season year
  let url;
  let params;
  
  if (season <= 2017) {
    // Historical data endpoint for 2017 and earlier
    url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/${leagueId}`;
    params = {
      seasonId: season,
      view: 'mStandings'
    };
  } else {
    // Standard endpoint for 2018 and later
    url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`;
    params = {
      view: 'mStandings'
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
    if (season <= 2017) {
      // Historical data returns an array, get the first season
      return response.data[0]?.teams || [];
    } else {
      return response.data.teams || [];
    }
  } catch (error) {
    console.error(`ESPN Standings API Error (Season ${season}):`, error.message);
    
    if (error.response?.status === 404) {
      throw new Error(`No standings data available for season ${season}. This season may not exist or access may be restricted.`);
    }
    
    throw error;
  }
}

module.exports = { fetchESPNMatchups, fetchESPNStandings };