const axios = require('axios');

async function fetchESPNMatchups(leagueId, season, week) {
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`;
  
  try {
    const response = await axios.get(url, {
      params: {
        view: 'mMatchup',
        scoringPeriodId: week
      },
      headers: {
        'Cookie': `espn_s2=${process.env.ESPN_S2}; SWID=${process.env.ESPN_SWID}`
      }
    });
    
    return response.data.schedule || [];
  } catch (error) {
    console.error('ESPN Matchups API Error:', error);
    throw error;
  }
}

async function fetchESPNStandings(leagueId, season) {
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`;
  
  try {
    const response = await axios.get(url, {
      params: {
        view: 'mStandings'
      },
      headers: {
        'Cookie': `espn_s2=${process.env.ESPN_S2}; SWID=${process.env.ESPN_SWID}`
      }
    });
    
    return response.data.teams || [];
  } catch (error) {
    console.error('ESPN Standings API Error:', error);
    throw error;
  }
}

module.exports = { fetchESPNMatchups, fetchESPNStandings };