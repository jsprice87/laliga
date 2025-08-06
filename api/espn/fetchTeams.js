const axios = require('axios');

async function fetchESPNTeams(leagueId, season, week) {
  // Use different endpoints based on season year
  let url;
  let params;
  
  if (season <= 2017) {
    // Historical data endpoint for 2017 and earlier
    url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/${leagueId}`;
    params = {
      seasonId: season,
      view: 'mTeam'
    };
  } else {
    // Standard endpoint for 2018 and later
    url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`;
    params = {
      view: 'mTeam'
    };
    
    // Only add scoringPeriodId for current season data
    if (week && season >= 2024) {
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
      return response.data[0]?.teams || [];
    } else {
      return response.data.teams || [];
    }
  } catch (error) {
    console.error(`ESPN Teams API Error (Season ${season}):`, error.message);
    
    // Provide more specific error handling
    if (error.response?.status === 404) {
      throw new Error(`No data available for season ${season}. This season may not exist or access may be restricted.`);
    }
    
    throw error;
  }
}

// New function to fetch complete season data (all weeks)
async function fetchCompleteSeasonData(leagueId, season) {
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`;
  
  try {
    const response = await axios.get(url, {
      params: {
        view: ['mTeam', 'mRoster', 'mMatchup', 'mStandings']
      },
      headers: {
        'Cookie': `espn_s2=${process.env.ESPN_S2}; SWID=${process.env.ESPN_SWID}`
      }
    });
    
    return {
      teams: response.data.teams || [],
      schedule: response.data.schedule || [],
      settings: response.data.settings || {},
      status: response.data.status || {}
    };
  } catch (error) {
    console.error(`ESPN Complete Season API Error (Season ${season}):`, error.message);
    throw error;
  }
}

module.exports = { fetchESPNTeams, fetchCompleteSeasonData };